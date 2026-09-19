import type { Leg } from "./types";
import {
  asList,
  asRecord,
  carbonNormalize,
  intervalApr,
  lotAdjust,
  stripQuoteSuffix,
  toNumber,
  venueSymbol,
} from "./symbols";
import {
  FatalError,
  TemporaryError,
  getJson,
  mapPool,
  unwrapCarbon,
} from "./http.server";

const VARIATIONAL_URL =
  "https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats";
const HYPERLIQUID_URL = "https://api.hyperliquid.xyz/info";
const CARBON_BASE = "https://gw.carbon.inc/v1";
const CARBON_CHAIN_ID = 42161;
const CARBON_FUNDING_HOURS = 4;
const EXTENDED_URL =
  "https://api.starknet.extended.exchange/api/v1/info/markets";
const LIGHTER_BASE = "https://mainnet.zklighter.elliot.ai";
const HL_TAKER_FEE_PCT = 0.045;
const EXTENDED_TAKER_FEE_PCT = 0.025;

type Legs = Record<string, Leg>;

function put(legs: Legs, symbol: string, leg: Leg) {
  if (!symbol) return;
  legs[symbol] = leg;
}

export async function fetchVariational(signal?: AbortSignal): Promise<Legs> {
  const data = asRecord(await getJson("Variational", VARIATIONAL_URL, { signal }));
  const listings = asList(data.listings);
  if (!listings.length) {
    throw new FatalError("Variational : format inattendu");
  }
  const legs: Legs = {};
  for (const raw of listings) {
    const item = asRecord(raw);
    const ticker = item.ticker;
    const funding = toNumber(item.funding_rate);
    const price = toNumber(item.mark_price);
    const volume = toNumber(item.volume_24h);
    const openInterest = asRecord(item.open_interest);
    const oiLong = toNumber(openInterest.long_open_interest);
    const oiShort = toNumber(openInterest.short_open_interest);
    const quote = asRecord(asRecord(item.quotes).size_1k);
    const bid = toNumber(quote.bid);
    const ask = toNumber(quote.ask);
    if (typeof ticker !== "string" || !ticker) continue;
    if ([funding, price, volume, oiLong, oiShort, bid, ask].some((v) => v == null)) {
      continue;
    }
    if (price! <= 0 || bid! <= 0 || ask! < bid!) continue;
    const intervalS = toNumber(item.funding_interval_s);
    put(legs, ticker.toUpperCase(), {
      exchange: "variational",
      apr: funding! * 100,
      oi: oiLong! + oiShort!,
      volume: volume!,
      price: price!,
      costPct: ((ask! - bid!) / ((ask! + bid!) / 2)) * 100,
      fundingHours: intervalS && intervalS > 0 ? intervalS / 3600 : undefined,
    });
  }
  return legs;
}

export async function fetchHyperliquid(signal?: AbortSignal): Promise<Legs> {
  const data = await getJson("Hyperliquid", HYPERLIQUID_URL, {
    payload: { type: "metaAndAssetCtxs" },
    signal,
  });
  if (!Array.isArray(data) || data.length !== 2) {
    throw new FatalError("Hyperliquid : format inattendu");
  }
  const universe = asList(asRecord(data[0]).universe);
  const contexts = asList(data[1]);
  const legs: Legs = {};
  for (let i = 0; i < Math.min(universe.length, contexts.length); i++) {
    const market = asRecord(universe[i]);
    const ctx = asRecord(contexts[i]);
    const name = market.name;
    if (typeof name !== "string" || !name || market.isDelisted) continue;
    const funding = toNumber(ctx.funding);
    const price = toNumber(ctx.markPx);
    const oiTokens = toNumber(ctx.openInterest);
    const volume = toNumber(ctx.dayNtlVlm);
    if ([funding, price, oiTokens, volume].some((v) => v == null) || price! <= 0) {
      continue;
    }
    const impact = ctx.impactPxs;
    if (!Array.isArray(impact) || impact.length !== 2) continue;
    const impactBid = toNumber(impact[0]);
    const impactAsk = toNumber(impact[1]);
    if (impactBid == null || impactAsk == null || impactBid <= 0 || impactAsk < impactBid) {
      continue;
    }
    let symbol = name;
    let comparable = price!;
    if (name[0] === "k" && name.slice(1) === name.slice(1).toUpperCase()) {
      symbol = name.slice(1);
      comparable = price! / 1000;
    }
    const spreadPct =
      ((impactAsk - impactBid) / ((impactAsk + impactBid) / 2)) * 100;
    put(legs, symbol.toUpperCase(), {
      exchange: "hyperliquid",
      apr: funding! * 24 * 365 * 100,
      oi: oiTokens! * price!,
      volume: volume!,
      price: comparable,
      costPct: 2 * HL_TAKER_FEE_PCT + spreadPct,
      fundingHours: 1,
    });
  }
  return legs;
}

async function fetchCarbonMarkPrices(
  symbols: string[],
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  const chunkSize = 80;
  for (let start = 0; start < symbols.length; start += chunkSize) {
    const chunk = symbols.slice(start, start + chunkSize);
    const payload = await getJson("Carbon", `${CARBON_BASE}/pricing/mark-prices`, {
      params: { symbols: chunk },
      signal,
    });
    const data = asRecord(unwrapCarbon("Carbon prix", payload));
    for (const [ticker, raw] of Object.entries(data)) {
      const price = toNumber(raw);
      if (price != null && price > 0) prices[ticker] = price;
    }
  }
  return prices;
}

export async function fetchCarbon(
  signal?: AbortSignal,
  solver = "PERPS_HUB",
  exchangeName = "carbon",
): Promise<Legs> {
  const marketsPayload = await getJson(
    "Carbon",
    `${CARBON_BASE}/markets/aggregated/${CARBON_CHAIN_ID}`,
    { signal },
  );
  const marketsData = asRecord(unwrapCarbon("Carbon marchés", marketsPayload));
  const listings = asRecord(asRecord(marketsData[solver]).markets);
  if (!Object.keys(listings).length) {
    throw new FatalError(`Carbon : aucun marché ${solver}`);
  }
  const fundingPayload = await getJson("Carbon", `${CARBON_BASE}/solvers/funding-info`, {
    params: { solver, chainId: CARBON_CHAIN_ID },
    signal,
  });
  const funding = asRecord(unwrapCarbon("Carbon funding", fundingPayload));
  const tickers = Object.entries(listings)
    .filter(
      ([name, spec]) =>
        typeof name === "string" && asRecord(spec).isValid !== false,
    )
    .map(([name]) => name);
  const prices = await fetchCarbonMarkPrices(tickers, signal);
  const intervalsPerYear = (24 / CARBON_FUNDING_HOURS) * 365;
  const legs: Legs = {};
  for (const [name, specRaw] of Object.entries(listings)) {
    const spec = asRecord(specRaw);
    if (spec.isValid === false) continue;
    const info = asRecord(funding[name]);
    const rateLong = toNumber(info.next_funding_rate_long);
    const rateShort = toNumber(info.next_funding_rate_short);
    const price = prices[name];
    const notionalCap = toNumber(spec.maxNotionalValue);
    const feeOpen = toNumber(spec.hedgerFeeOpen);
    const feeClose = toNumber(spec.hedgerFeeClose);
    if (
      [rateLong, rateShort, price, notionalCap, feeOpen, feeClose].some(
        (v) => v == null,
      )
    ) {
      continue;
    }
    if (price! <= 0 || notionalCap! <= 0) continue;
    const [symbol, comparable] = carbonNormalize(name, price!);
    if (!symbol || comparable == null) continue;
    const aprLong = rateLong! * intervalsPerYear * 100;
    const aprShort = rateShort! * intervalsPerYear * 100;
    put(legs, symbol, {
      exchange: exchangeName,
      apr: (aprLong + aprShort) / 2,
      aprLong,
      aprShort,
      oi: notionalCap!,
      volume: null,
      price: comparable,
      costPct: (feeOpen! + feeClose!) * 100,
      fundingHours: CARBON_FUNDING_HOURS,
    });
  }
  return legs;
}

export function fetchCarbonTradfi(signal?: AbortSignal): Promise<Legs> {
  return fetchCarbon(signal, "NOXRWA", "carbon_tradfi");
}

export async function fetchExtended(signal?: AbortSignal): Promise<Legs> {
  const payload = asRecord(await getJson("Extended", EXTENDED_URL, { signal }));
  const listings = asList(payload.data);
  if (!listings.length) throw new FatalError("Extended : format inattendu");
  const legs: Legs = {};
  for (const raw of listings) {
    const item = asRecord(raw);
    const name = item.name;
    if (item.type !== "PERPETUAL") continue;
    if (item.status != null && item.status !== "ACTIVE") continue;
    if (item.active === false) continue;
    if (item.isRfq) continue;
    const stats = asRecord(item.marketStats);
    const funding = toNumber(stats.fundingRate);
    const price = toNumber(stats.markPrice) ?? toNumber(stats.lastPrice);
    const oi = toNumber(stats.openInterest);
    const volume = toNumber(stats.dailyVolume);
    const bid = toNumber(stats.bidPrice);
    const ask = toNumber(stats.askPrice);
    if (typeof name !== "string" || [funding, price, oi, volume].some((v) => v == null)) {
      continue;
    }
    if (price! <= 0) continue;
    const [symbol, comparable] = lotAdjust(stripQuoteSuffix(name), price!);
    if (!symbol || comparable == null) continue;
    let spreadPct = 0;
    if (bid && ask && bid > 0 && ask >= bid) {
      spreadPct = ((ask - bid) / ((ask + bid) / 2)) * 100;
    }
    put(legs, symbol, {
      exchange: "extended",
      apr: funding! * 24 * 365 * 100,
      oi: oi!,
      volume: volume!,
      price: comparable,
      costPct: 2 * EXTENDED_TAKER_FEE_PCT + spreadPct,
      fundingHours: 1,
    });
  }
  return legs;
}

export async function fetchLighter(signal?: AbortSignal): Promise<Legs> {
  const details = asRecord(
    await getJson("Lighter", `${LIGHTER_BASE}/api/v1/orderBookDetails`, {
      params: { filter: "perp" },
      signal,
    }),
  );
  const books = asList(details.order_book_details);
  if (!books.length) throw new FatalError("Lighter : format inattendu (orderBookDetails)");
  const ratesPayload = asRecord(
    await getJson("Lighter", `${LIGHTER_BASE}/api/v1/funding-rates`, { signal }),
  );
  const rateRows = asList(ratesPayload.funding_rates);
  if (!rateRows.length) throw new FatalError("Lighter : format inattendu (funding-rates)");
  const rateByMarket = new Map<unknown, number>();
  for (const raw of rateRows) {
    const row = asRecord(raw);
    if (row.exchange !== "lighter") continue;
    const rate = toNumber(row.rate);
    if (rate == null || row.market_id == null) continue;
    rateByMarket.set(row.market_id, rate);
  }
  const legs: Legs = {};
  for (const raw of books) {
    const book = asRecord(raw);
    if (book.status !== "active") continue;
    const name = book.symbol;
    const funding8h = rateByMarket.get(book.market_id);
    const price = toNumber(book.mark_price) ?? toNumber(book.last_trade_price);
    const oiBase = toNumber(book.open_interest);
    const volume = toNumber(book.daily_quote_token_volume);
    const taker = toNumber(book.taker_fee);
    if (
      typeof name !== "string" ||
      funding8h == null ||
      [price, oiBase, volume, taker].some((v) => v == null)
    ) {
      continue;
    }
    if (price! <= 0) continue;
    const [symbol, comparable] = lotAdjust(stripQuoteSuffix(name), price!);
    if (!symbol || comparable == null) continue;
    put(legs, symbol, {
      exchange: "lighter",
      apr: funding8h * 3 * 365 * 100,
      oi: oiBase! * price!,
      volume: volume!,
      price: comparable,
      costPct: 2 * taker! * 100,
      fundingHours: 8,
    });
  }
  return legs;
}

export async function fetchParadex(signal?: AbortSignal): Promise<Legs> {
  const markets = asList(
    asRecord(
      await getJson("Paradex", "https://api.prod.paradex.trade/v1/markets", {
        signal,
      }),
    ).results,
  );
  const summary = asList(
    asRecord(
      await getJson("Paradex", "https://api.prod.paradex.trade/v1/markets/summary", {
        params: { market: "ALL" },
        signal,
      }),
    ).results,
  );
  if (!markets.length || !summary.length) {
    throw new FatalError("Paradex : format inattendu");
  }
  const hoursBySymbol = new Map<unknown, number>();
  for (const raw of markets) {
    const market = asRecord(raw);
    if (market.asset_kind !== "PERP") continue;
    hoursBySymbol.set(market.symbol, toNumber(market.funding_period_hours) || 8);
  }
  const legs: Legs = {};
  for (const raw of summary) {
    const row = asRecord(raw);
    const name = row.symbol;
    const hours = hoursBySymbol.get(name);
    if (hours == null) continue;
    const rate = toNumber(row.funding_rate) ?? toNumber(row.future_funding_rate);
    const price = toNumber(row.mark_price) ?? toNumber(row.underlying_price);
    const oi = toNumber(row.open_interest);
    const volume = toNumber(row.volume_24h);
    if ([rate, price, oi, volume].some((v) => v == null) || price! <= 0) continue;
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate!, hours);
    if (!symbol || apr == null) continue;
    put(legs, symbol, {
      exchange: "paradex",
      apr,
      oi: oi! < price! * 10 ? oi! * price! : oi!,
      volume: volume!,
      price: price!,
      costPct: 2 * 0.03,
      fundingHours: hours,
    });
  }
  return legs;
}

export async function fetchOrderly(signal?: AbortSignal): Promise<Legs> {
  const payload = asRecord(
    await getJson("WOOFi", "https://api.orderly.org/v1/public/futures", {
      signal,
    }),
  );
  const rows = asList(asRecord(payload.data).rows);
  if (!rows.length) throw new FatalError("WOOFi : format inattendu");
  const legs: Legs = {};
  for (const raw of rows) {
    const row = asRecord(raw);
    if (row.status !== "ACTIVE") continue;
    const name = row.symbol;
    const rate = toNumber(row.est_funding_rate) ?? toNumber(row.last_funding_rate);
    const price = toNumber(row.mark_price);
    const oiBase = toNumber(row.open_interest);
    const volume = toNumber(row["24h_amount"]);
    if (
      typeof name !== "string" ||
      [rate, price, oiBase, volume].some((v) => v == null) ||
      price! <= 0
    ) {
      continue;
    }
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate!, 8);
    if (!symbol || apr == null) continue;
    put(legs, symbol, {
      exchange: "orderly",
      apr,
      oi: oiBase! * price!,
      volume: volume!,
      price: price!,
      costPct: 2 * 0.03,
      fundingHours: 8,
    });
  }
  return legs;
}

export async function fetchBackpack(signal?: AbortSignal): Promise<Legs> {
  const [marks, markets, interests, tickers] = await Promise.all([
    getJson("Backpack", "https://api.backpack.exchange/api/v1/markPrices", {
      signal,
    }),
    getJson("Backpack", "https://api.backpack.exchange/api/v1/markets", {
      signal,
    }),
    getJson("Backpack", "https://api.backpack.exchange/api/v1/openInterest", {
      signal,
    }),
    getJson("Backpack", "https://api.backpack.exchange/api/v1/tickers", {
      signal,
    }),
  ]);
  if (
    ![marks, markets, interests, tickers].every((x) => Array.isArray(x))
  ) {
    throw new FatalError("Backpack : format inattendu");
  }
  const hoursBySymbol = new Map<unknown, number>();
  for (const raw of asList(markets)) {
    const market = asRecord(raw);
    const type = String(market.marketType ?? "").toUpperCase();
    if (type !== "PERP" && type !== "FUTURE") continue;
    let hours = toNumber(market.fundingInterval);
    if (hours && hours > 24) hours = hours / 3600;
    hoursBySymbol.set(market.symbol, hours || 1);
  }
  const oiBySymbol = new Map<unknown, number | null>();
  for (const raw of asList(interests)) {
    const row = asRecord(raw);
    oiBySymbol.set(row.symbol, toNumber(row.openInterest));
  }
  const volBySymbol = new Map<unknown, number | null>();
  for (const raw of asList(tickers)) {
    const row = asRecord(raw);
    volBySymbol.set(row.symbol, toNumber(row.quoteVolume));
  }
  const legs: Legs = {};
  for (const raw of asList(marks)) {
    const row = asRecord(raw);
    const name = row.symbol;
    const hours = hoursBySymbol.get(name);
    if (hours == null) continue;
    const rate = toNumber(row.fundingRate);
    const price = toNumber(row.markPrice);
    const oiBase = oiBySymbol.get(name) ?? null;
    const volume = volBySymbol.get(name) ?? null;
    if ([rate, price, oiBase, volume].some((v) => v == null) || price! <= 0) continue;
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate!, hours);
    if (!symbol || apr == null) continue;
    put(legs, symbol, {
      exchange: "backpack",
      apr,
      oi: oiBase! * price!,
      volume: volume!,
      price: price!,
      costPct: 2 * 0.02,
      fundingHours: hours,
    });
  }
  return legs;
}

export async function fetchAster(signal?: AbortSignal): Promise<Legs> {
  const [premiums, tickers, infos] = await Promise.all([
    getJson("Aster", "https://fapi.asterdex.com/fapi/v1/premiumIndex", { signal }),
    getJson("Aster", "https://fapi.asterdex.com/fapi/v1/ticker/24hr", { signal }),
    getJson("Aster", "https://fapi.asterdex.com/fapi/v1/fundingInfo", { signal }),
  ]);
  if (![premiums, tickers, infos].every((x) => Array.isArray(x))) {
    throw new FatalError("Aster : format inattendu");
  }
  const hoursBySymbol = new Map<unknown, number>();
  for (const raw of asList(infos)) {
    const row = asRecord(raw);
    hoursBySymbol.set(row.symbol, toNumber(row.fundingIntervalHours) || 8);
  }
  const volBySymbol = new Map<unknown, number | null>();
  for (const raw of asList(tickers)) {
    const row = asRecord(raw);
    volBySymbol.set(row.symbol, toNumber(row.quoteVolume));
  }
  const legs: Legs = {};
  for (const raw of asList(premiums)) {
    const row = asRecord(raw);
    const name = row.symbol;
    const rate = toNumber(row.lastFundingRate);
    const price = toNumber(row.markPrice);
    const volume = volBySymbol.get(name) ?? null;
    if (
      typeof name !== "string" ||
      [rate, price, volume].some((v) => v == null) ||
      price! <= 0
    ) {
      continue;
    }
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate!, hoursBySymbol.get(name) || 8);
    if (!symbol || apr == null) continue;
    put(legs, symbol, {
      exchange: "aster",
      apr,
      oi: volume!,
      volume: volume!,
      price: price!,
      costPct: 2 * 0.04,
      fundingHours: hoursBySymbol.get(name) || 8,
    });
  }
  return legs;
}

export async function fetchPacifica(signal?: AbortSignal): Promise<Legs> {
  const payload = asRecord(
    await getJson("Pacifica", "https://api.pacifica.fi/api/v1/info/prices", {
      signal,
    }),
  );
  const rows = asList(payload.data);
  if (!rows.length) throw new FatalError("Pacifica : format inattendu");
  const legs: Legs = {};
  for (const raw of rows) {
    const row = asRecord(raw);
    const name = row.symbol;
    const rate = toNumber(row.next_funding) ?? toNumber(row.funding);
    const price = toNumber(row.mark);
    const oiRaw = toNumber(row.open_interest);
    const volume = toNumber(row.volume_24h);
    if (
      typeof name !== "string" ||
      [rate, price, oiRaw, volume].some((v) => v == null) ||
      price! <= 0
    ) {
      continue;
    }
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate!, 1);
    if (!symbol || apr == null) continue;
    const oi = oiRaw! * price! > oiRaw! ? oiRaw! * price! : oiRaw!;
    put(legs, symbol, {
      exchange: "pacifica",
      apr,
      oi,
      volume: volume!,
      price: price!,
      costPct: 2 * 0.03,
      fundingHours: 1,
    });
  }
  return legs;
}

export async function fetchHibachi(signal?: AbortSignal): Promise<Legs> {
  const info = asRecord(
    await getJson("Hibachi", "https://data-api.hibachi.xyz/market/exchange-info", {
      signal,
    }),
  );
  const contracts = asList(info.futureContracts);
  if (!contracts.length) throw new FatalError("Hibachi : format inattendu");
  const taker =
    toNumber(asRecord(info.feeConfig).tradeTakerFeeRate) || 0.00045;
  const open = contracts.filter((raw) => {
    const contract = asRecord(raw);
    const symbolStatus = contract.symbolStatus;
    const status = contract.status;
    return (
      (symbolStatus == null || symbolStatus === "OPEN") &&
      (status == null || status === "LIVE") &&
      typeof contract.symbol === "string"
    );
  }).slice(0, 12);

  const pairs = await mapPool(open, 4, async (raw) => {
    const contract = asRecord(raw);
    const name = String(contract.symbol);
    const [prices, stats] = await Promise.all([
      getJson("Hibachi", "https://data-api.hibachi.xyz/market/data/prices", {
        params: { symbol: name },
        signal,
        timeoutMs: 8000,
      }),
      getJson("Hibachi", "https://data-api.hibachi.xyz/market/data/stats", {
        params: { symbol: name },
        signal,
        timeoutMs: 8000,
      }),
    ]);
    const priceBody = asRecord(prices);
    const statsBody = asRecord(stats);
    const funding = toNumber(
      asRecord(priceBody.fundingRateEstimation).estimatedFundingRate,
    );
    const price = toNumber(priceBody.markPrice);
    const bid = toNumber(priceBody.bidPrice);
    const ask = toNumber(priceBody.askPrice);
    const volume = toNumber(statsBody.volume24h);
    if ([funding, price, volume].some((v) => v == null) || price! <= 0) return null;
    let spreadPct = 0;
    if (bid && ask && bid > 0 && ask >= bid) {
      spreadPct = ((ask - bid) / ((ask + bid) / 2)) * 100;
    }
    const symbol =
      (typeof contract.underlyingSymbol === "string"
        ? contract.underlyingSymbol.toUpperCase()
        : venueSymbol(name)) ?? null;
    const apr = intervalApr(funding!, 1);
    if (!symbol || apr == null) return null;
    return [
      symbol,
      {
        exchange: "hibachi",
        apr,
        oi: volume!,
        volume: volume!,
        price: price!,
        costPct: 2 * taker * 100 + spreadPct,
        fundingHours: 1,
      } satisfies Leg,
    ] as const;
  });

  const legs: Legs = {};
  for (const [symbol, leg] of pairs) put(legs, symbol, leg);
  return legs;
}

export async function fetchGtrade(signal?: AbortSignal): Promise<Legs> {
  const variables = asRecord(
    await getJson(
      "gTrade",
      "https://backend-arbitrum.gains.trade/trading-variables/all",
      { signal },
    ),
  );
  const pairs = asList(variables.pairs);
  if (!pairs.length) throw new FatalError("gTrade : format inattendu");
  const slice = pairs.slice(0, 20);
  const results = await mapPool(
    slice.map((pair, index) => ({ pair, index })),
    5,
    async ({ pair: raw, index }) => {
      const pair = asRecord(raw);
      const base = pair.from;
      if (typeof base !== "string") return null;
      let payload: unknown;
      try {
        payload = await getJson(
          "gTrade",
          `https://backend-global.gains.trade/api/holding-rates/3/${index}`,
          { params: { chainId: 42161 }, signal, timeoutMs: 8000 },
        );
      } catch {
        return null;
      }
      const history = asList(asRecord(payload).holdingRates);
      if (!history.length) return null;
      const last = asRecord(history[history.length - 1]);
      const rateLong = toNumber(last.fundingFeeLongHourlyRate);
      const rateShort = toNumber(last.fundingFeeShortHourlyRate);
      if (rateLong == null || rateShort == null) return null;
      const [symbol] = lotAdjust(base.toUpperCase(), null);
      if (!symbol) return null;
      const spreadP = toNumber(pair.spreadP) || 0;
      const spreadPct = spreadP > 100 ? (spreadP / 1e10) * 100 : spreadP;
      const aprLong = intervalApr(rateLong, 1);
      const aprShort = intervalApr(rateShort, 1);
      if (aprLong == null || aprShort == null) return null;
      return [
        symbol,
        {
          exchange: "gtrade",
          apr: (aprLong + aprShort) / 2,
          aprLong,
          aprShort,
          oi: 1_000_000,
          volume: null,
          price: 1,
          skipPrice: true,
          costPct: Math.max(spreadPct, 0.08),
          fundingHours: 1,
        } satisfies Leg,
      ] as const;
    },
  );
  const legs: Legs = {};
  for (const [symbol, leg] of results) put(legs, symbol, leg);
  return legs;
}

export async function fetchGrvt(signal?: AbortSignal): Promise<Legs> {
  const instruments = asList(
    asRecord(
      await getJson("GRVT", "https://market-data.grvt.io/full/v1/all_instruments", {
        payload: { is_active: true, kinds: ["PERPETUAL"] },
        signal,
      }),
    ).result,
  );
  if (!instruments.length) throw new FatalError("GRVT : format inattendu");
  const slice = instruments
    .filter((raw) => {
      const name = asRecord(raw).instrument;
      return typeof name === "string" && name.endsWith("_Perp");
    })
    .slice(0, 25);

  const results = await mapPool(slice, 6, async (raw) => {
    const item = asRecord(raw);
    const name = String(item.instrument);
    let tickerRaw: unknown;
    try {
      tickerRaw = await getJson("GRVT", "https://market-data.grvt.io/full/v1/ticker", {
        payload: { instrument: name },
        signal,
        timeoutMs: 8000,
      });
    } catch {
      return null;
    }
    const ticker = asRecord(asRecord(tickerRaw).result);
    const rawRate = toNumber(ticker.funding_rate);
    const price = toNumber(ticker.mark_price);
    const oiBase = toNumber(ticker.open_interest);
    const volQ =
      (toNumber(ticker.buy_volume_24h_q) || 0) +
      (toNumber(ticker.sell_volume_24h_q) || 0);
    if ([rawRate, price, oiBase].some((v) => v == null) || price! <= 0) return null;
    const symbol = venueSymbol(name.replace("_Perp", ""));
    const apr = intervalApr(rawRate! / 100, 8);
    if (!symbol || apr == null) return null;
    const bid = toNumber(ticker.best_bid_price);
    const ask = toNumber(ticker.best_ask_price);
    let spreadPct = 0;
    if (bid && ask && bid > 0 && ask >= bid) {
      spreadPct = ((ask - bid) / ((ask + bid) / 2)) * 100;
    }
    return [
      symbol,
      {
        exchange: "grvt",
        apr,
        oi: oiBase! * price!,
        volume: volQ || null,
        price: price!,
        costPct: 2 * 0.03 + spreadPct,
        fundingHours: 8,
      } satisfies Leg,
    ] as const;
  });
  const legs: Legs = {};
  for (const [symbol, leg] of results) put(legs, symbol, leg);
  return legs;
}

export async function fetchQfex(signal?: AbortSignal): Promise<Legs> {
  const ref = asRecord(
    await getJson("QFEX", "https://api.qfex.com/refdata", { signal }),
  );
  const rows = asList(ref.data);
  if (!rows.length) throw new FatalError("QFEX : format inattendu");
  const now = new Date();
  const start = new Date(now.getTime() - 3 * 3600_000).toISOString().replace(/\.\d+Z$/, "Z");
  const end = now.toISOString().replace(/\.\d+Z$/, "Z");
  const slice = rows
    .filter((raw) => {
      const row = asRecord(raw);
      const price = toNumber(row.underlier_price);
      return typeof row.symbol === "string" && price != null && price > 0;
    })
    .slice(0, 15);

  const results = await mapPool(slice, 4, async (raw) => {
    const row = asRecord(raw);
    const name = String(row.symbol);
    const price = toNumber(row.underlier_price)!;
    let hist: unknown;
    try {
      hist = await getJson("QFEX", `https://api.qfex.com/funding/${name}`, {
        params: { intervalMinutes: 60, fromISO: start, toISO: end },
        signal,
        timeoutMs: 8000,
      });
    } catch {
      return null;
    }
    const points = asList(asRecord(hist).data);
    if (!points.length) return null;
    const rate = toNumber(asRecord(points[points.length - 1]).rate);
    if (rate == null) return null;
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate, 1);
    if (!symbol || apr == null) return null;
    return [
      symbol,
      {
        exchange: "qfex",
        apr,
        oi: 1_000_000,
        volume: null,
        price,
        costPct: 2 * 0.1,
        fundingHours: 1,
      } satisfies Leg,
    ] as const;
  });
  const legs: Legs = {};
  for (const [symbol, leg] of results) put(legs, symbol, leg);
  return legs;
}

export async function fetchPolymarket(signal?: AbortSignal): Promise<Legs> {
  const instruments = await getJson(
    "Polymarket",
    "https://api.perpetuals.polymarket.com/v1/info/instruments",
    { signal },
  );
  if (!Array.isArray(instruments)) {
    throw new FatalError("Polymarket : format inattendu");
  }
  const slice = instruments
    .map((raw) => asRecord(raw))
    .filter(
      (item) =>
        item.instrument_type === "perpetual" &&
        item.instrument_id != null &&
        typeof item.base_asset === "string",
    )
    .slice(0, 18);

  const results = await mapPool(slice, 4, async (item) => {
    const instrumentId = String(item.instrument_id);
    const base = String(item.base_asset);
    let funding: unknown;
    let index: unknown;
    try {
      [funding, index] = await Promise.all([
        getJson("Polymarket", "https://api.perpetuals.polymarket.com/v1/info/funding", {
          params: { instrument_id: instrumentId },
          signal,
          timeoutMs: 8000,
        }),
        getJson("Polymarket", "https://api.perpetuals.polymarket.com/v1/info/index", {
          params: { asset: base },
          signal,
          timeoutMs: 8000,
        }),
      ]);
    } catch {
      return null;
    }
    const points = asList(asRecord(funding).data);
    if (!points.length) return null;
    const rate = toNumber(asRecord(points[0]).funding_rate);
    const price = toNumber(asRecord(index).index_price);
    if (rate == null || price == null || price <= 0) return null;
    const symbol = venueSymbol(typeof item.symbol === "string" ? item.symbol : base);
    const apr = intervalApr(rate, 1);
    if (!symbol || apr == null) return null;
    const cap = toNumber(item.max_market_notional) || 1_000_000;
    return [
      symbol,
      {
        exchange: "polymarket",
        apr,
        oi: cap,
        volume: null,
        price,
        costPct: 2 * 0.03,
        fundingHours: 1,
      } satisfies Leg,
    ] as const;
  });
  const legs: Legs = {};
  for (const [symbol, leg] of results) put(legs, symbol, leg);
  return legs;
}

const ARCUS_TAKER_FEE_PCT = 0.0225; // 225 ppm base tier

export async function fetchArcus(signal?: AbortSignal): Promise<Legs> {
  const payload = asRecord(
    await getJson("Arcus", "https://api.arcus.xyz/v1/markets", { signal }),
  );
  const rows = asList(payload.markets);
  if (!rows.length) throw new FatalError("Arcus : format inattendu");
  const legs: Legs = {};
  for (const raw of rows) {
    const row = asRecord(raw);
    if (row.status !== "ONLINE" || row.type !== "PERPETUAL") continue;
    const name = row.marketDisplayName ?? row.baseAsset;
    const rate =
      toNumber(row.nextFundingRate) ?? toNumber(row.fundingRate);
    const price = toNumber(row.markPrice) ?? toNumber(row.oraclePrice);
    const oiBase = toNumber(row.openInterest);
    const volume = toNumber(row.volume24hNotional);
    if (
      typeof name !== "string" ||
      [rate, price, oiBase].some((v) => v == null) ||
      price! <= 0
    ) {
      continue;
    }
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate!, 1);
    if (!symbol || apr == null) continue;
    put(legs, symbol, {
      exchange: "arcus",
      apr,
      oi: oiBase! * price!,
      volume: volume ?? null,
      price: price!,
      costPct: 2 * ARCUS_TAKER_FEE_PCT,
      fundingHours: 1,
    });
  }
  return legs;
}

const POPDEX_TAKER_FEE_PCT = 0.032;

async function fetchPopdexTickers(signal?: AbortSignal): Promise<unknown[]> {
  const rows: unknown[] = [];
  let cursor: number | string | undefined;
  for (let page = 0; page < 20; page++) {
    const payload = asRecord(
      await getJson("PopDEX", "https://api.popdex.xyz/api/v1/public/market/tickers", {
        signal,
        params: cursor == null ? undefined : { cursor },
      }),
    );
    const chunk = asList(payload.data);
    rows.push(...chunk);
    const next = payload.cursor;
    const total = toNumber(payload.total);
    if (!chunk.length) break;
    if (total != null && rows.length >= total) break;
    if (next == null || next === cursor) break;
    cursor = typeof next === "string" || typeof next === "number" ? next : String(next);
  }
  return rows;
}

export async function fetchPopdex(signal?: AbortSignal): Promise<Legs> {
  const [tickers, symbolsPayload] = await Promise.all([
    fetchPopdexTickers(signal),
    getJson("PopDEX", "https://api.popdex.xyz/api/v1/config/symbols", { signal }),
  ]);
  if (!tickers.length) throw new FatalError("PopDEX : format inattendu");
  const hoursBySymbol = new Map<string, number>();
  for (const raw of asList(asRecord(symbolsPayload).data)) {
    const row = asRecord(raw);
    const name = row.symbol;
    if (typeof name !== "string") continue;
    hoursBySymbol.set(name, toNumber(row.fundingInterval) || 1);
  }
  const legs: Legs = {};
  for (const raw of tickers) {
    const row = asRecord(raw);
    if (row.status != null && row.status !== "Trading") continue;
    const name = row.symbol;
    const rate = toNumber(row.fundingRate);
    const price = toNumber(row.markPrice) ?? toNumber(row.lastPrice);
    const oiBase = toNumber(row.openInterest);
    const volume = toNumber(row.turnover24h);
    const bid = toNumber(row.bid1Price);
    const ask = toNumber(row.ask1Price);
    if (
      typeof name !== "string" ||
      [rate, price, oiBase].some((v) => v == null) ||
      price! <= 0
    ) {
      continue;
    }
    const hours = hoursBySymbol.get(name) || 1;
    const symbol = venueSymbol(name);
    const apr = intervalApr(rate!, hours);
    if (!symbol || apr == null) continue;
    let spreadPct = 0;
    if (bid && ask && bid > 0 && ask >= bid) {
      spreadPct = ((ask - bid) / ((ask + bid) / 2)) * 100;
    }
    put(legs, symbol, {
      exchange: "popdex",
      apr,
      oi: oiBase! * price!,
      volume: volume ?? null,
      price: price!,
      costPct: 2 * POPDEX_TAKER_FEE_PCT + spreadPct,
      fundingHours: hours,
    });
  }
  return legs;
}

export const VENUE_LOADERS: {
  id: string;
  label: string;
  load: (signal?: AbortSignal) => Promise<Legs>;
}[] = [
  { id: "variational", label: "Variational", load: fetchVariational },
  { id: "hyperliquid", label: "Hyperliquid", load: fetchHyperliquid },
  { id: "carbon", label: "Carbon", load: fetchCarbon },
  { id: "extended", label: "Extended", load: fetchExtended },
  { id: "lighter", label: "Lighter", load: fetchLighter },
  { id: "paradex", label: "Paradex", load: fetchParadex },
  { id: "orderly", label: "WOOFi", load: fetchOrderly },
  { id: "backpack", label: "Backpack", load: fetchBackpack },
  { id: "aster", label: "Aster", load: fetchAster },
  { id: "pacifica", label: "Pacifica", load: fetchPacifica },
  { id: "hibachi", label: "Hibachi", load: fetchHibachi },
  { id: "carbon_tradfi", label: "Carbon TradFi", load: fetchCarbonTradfi },
  { id: "gtrade", label: "gTrade", load: fetchGtrade },
  { id: "grvt", label: "GRVT", load: fetchGrvt },
  { id: "qfex", label: "QFEX", load: fetchQfex },
  { id: "polymarket", label: "Polymarket", load: fetchPolymarket },
  { id: "arcus", label: "Arcus", load: fetchArcus },
  { id: "popdex", label: "PopDEX", load: fetchPopdex },
];

export { FatalError, TemporaryError };
