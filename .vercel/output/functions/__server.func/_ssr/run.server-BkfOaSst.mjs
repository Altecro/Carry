//#region node_modules/.nitro/vite/services/ssr/assets/run.server-BkfOaSst.js
var carbon_intervals_default = {
	generatedAt: "",
	intervals: {}
};
function toNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value === "string" && value.trim() !== "") {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
function asRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asList(value) {
	return Array.isArray(value) ? value : [];
}
function stripQuoteSuffix(name) {
	let symbol = name.toUpperCase().replaceAll("_", "");
	for (const suffix of [
		"USDT",
		"USDC",
		"USD"
	]) if (symbol.endsWith(suffix) && symbol.length > suffix.length) {
		symbol = symbol.slice(0, -suffix.length);
		break;
	}
	if (symbol.endsWith("-")) symbol = symbol.slice(0, -1);
	return symbol;
}
function lotAdjust(symbol, price) {
	if (symbol.startsWith("1000") && /^[A-Z]+$/.test(symbol.slice(4))) return [symbol.slice(4), price == null ? null : price / 1e3];
	if (symbol.startsWith("K") && symbol.length > 1 && symbol.slice(1) === symbol.slice(1).toUpperCase() && /^[A-Z]+$/.test(symbol.slice(1))) return [symbol.slice(1), price == null ? null : price / 1e3];
	return [symbol, price];
}
function venueSymbol(name) {
	if (typeof name !== "string") return null;
	let symbol = name.toUpperCase();
	for (const junk of [
		"/USDT-P",
		"/USD-P",
		"_USDC_PERP",
		"_USDT_PERP",
		"-USD-PERP",
		"-USDT-PERP",
		"_PERP",
		"-PERP"
	]) symbol = symbol.replaceAll(junk, "");
	if (symbol.startsWith("PERP_")) symbol = symbol.slice(5).split("_")[0] ?? "";
	symbol = symbol.replaceAll("/", "");
	const [normalized] = lotAdjust(stripQuoteSuffix(symbol), null);
	return normalized || null;
}
function intervalApr(rate, hours) {
	if (hours <= 0) return null;
	return rate * (24 / hours) * 365 * 100;
}
function carbonNormalize(name, price) {
	if (typeof name !== "string" || !name) return [null, null];
	let symbol = name.toUpperCase();
	if (symbol.endsWith("_PERP")) return [null, null];
	if (symbol.endsWith("_CARBONRWA")) symbol = symbol.slice(0, -10);
	if (symbol.endsWith("USDT")) symbol = symbol.slice(0, -4);
	else if (symbol.endsWith("USD")) symbol = symbol.slice(0, -3);
	if (symbol.startsWith("1000") && /^[A-Z]+$/.test(symbol.slice(4))) {
		symbol = symbol.slice(4);
		if (price != null) price = price / 1e3;
	}
	if (!symbol || !/^[\x00-\x7F]+$/.test(symbol) || !/^[A-Z0-9]+$/.test(symbol)) return [null, null];
	return [symbol, price];
}
var FatalError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "FatalError";
	}
};
var TemporaryError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "TemporaryError";
	}
};
var UA = "Mozilla/5.0 (compatible; CarryScanner/1.0; +https://grok.com) AppleWebKit/537.36";
function buildUrl(url, params) {
	if (!params) return url;
	const parsed = new URL(url);
	for (const [key, value] of Object.entries(params)) if (Array.isArray(value)) for (const item of value) parsed.searchParams.append(key, item);
	else parsed.searchParams.set(key, String(value));
	return parsed.toString();
}
async function getJson(source, url, options = {}) {
	const timeoutMs = options.timeoutMs ?? 12e3;
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), timeoutMs);
	const onParentAbort = () => ctrl.abort();
	options.signal?.addEventListener("abort", onParentAbort);
	try {
		const init = {
			method: options.payload === void 0 ? "GET" : "POST",
			headers: {
				Accept: "application/json",
				"User-Agent": UA,
				...options.payload === void 0 ? {} : { "Content-Type": "application/json" }
			},
			signal: ctrl.signal
		};
		if (options.payload !== void 0) init.body = JSON.stringify(options.payload);
		const response = await fetch(buildUrl(url, options.params), init);
		const status = response.status;
		const text = await response.text();
		const detail = text.replace(/\s+/g, " ").slice(0, 150) || "(vide)";
		if (status === 429) throw new TemporaryError(`${source} : trop de requêtes (429)`);
		if (status >= 500) throw new TemporaryError(`${source} a un problème de son côté (${status})`);
		if (status !== 200) throw new FatalError(`${source} a répondu ${status}. Serveur : ${detail}`);
		try {
			return JSON.parse(text);
		} catch {
			throw new TemporaryError(`${source} : réponse illisible (pas du JSON)`);
		}
	} catch (error) {
		if (error instanceof FatalError || error instanceof TemporaryError) throw error;
		if (error instanceof Error && error.name === "AbortError") throw new TemporaryError(`${source} : délai dépassé`);
		throw new TemporaryError(`${source} injoignable (${error instanceof Error ? error.message : "réseau"})`);
	} finally {
		clearTimeout(timer);
		options.signal?.removeEventListener("abort", onParentAbort);
	}
}
function unwrapCarbon(source, payload) {
	const body = asRecord(payload);
	if (body.success === false) throw new TemporaryError(`${source} : ${typeof body.statusMessage === "string" ? body.statusMessage : "échec"}`);
	return body.data;
}
async function mapPool(items, limit, fn) {
	const out = [];
	let index = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (index < items.length) {
			const current = items[index++];
			try {
				const result = await fn(current);
				if (result != null) out.push(result);
			} catch {}
		}
	});
	await Promise.all(workers);
	return out;
}
async function withDeadline(ms, fn) {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), ms);
	try {
		return await fn(ctrl.signal);
	} finally {
		clearTimeout(timer);
	}
}
var VARIATIONAL_URL = "https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats";
var HYPERLIQUID_URL = "https://api.hyperliquid.xyz/info";
var CARBON_BASE = "https://gw.carbon.inc/v1";
var CARBON_CHAIN_ID = 42161;
var CARBON_DEFAULT_FUNDING_HOURS = 8;
var CARBON_INTERVAL_MEMORY_MS = 864e5;
/** Dernière observation par marché Carbon et par palier (1 / 4 / 8 h). */
var carbonIntervalSeen = /* @__PURE__ */ new Map();
/** Lit l’heure UTC du prochain paiement : 00/08/16 → 8 h, autre multiple de 4 → 4 h, sinon 1 h. */
function carbonHourBucket(nextMs) {
	const hour = new Date(nextMs).getUTCHours();
	if (hour % 8 === 0) return 8;
	if (hour % 4 === 0) return 4;
	return 1;
}
/**
* Intervalle Carbon pour un marché (ex. ONEUSDT).
* Un horaire paie aussi à 00/04/08/12/16/20 UTC : sans mémoire, il passerait
* en 4 h ou 8 h dans l’heure qui précède. On retient le plus petit palier
* vu dans les 24 dernières heures (observation actuelle comprise), plafonné
* par la table de référence (générée en plage fiable) si le marché y figure.
*/
function carbonFundingHours(market, nextMs) {
	let deduced = CARBON_DEFAULT_FUNDING_HOURS;
	if (nextMs != null && nextMs >= 0xe8d4a51000) {
		const now = Date.now();
		const observed = carbonHourBucket(nextMs);
		const memory = { ...carbonIntervalSeen.get(market) ?? {} };
		memory[observed] = now;
		for (const hours of [
			1,
			4,
			8
		]) {
			const seenAt = memory[hours];
			if (seenAt != null && now - seenAt > CARBON_INTERVAL_MEMORY_MS) delete memory[hours];
		}
		carbonIntervalSeen.set(market, memory);
		const live = [
			1,
			4,
			8
		].filter((hours) => memory[hours] != null);
		deduced = live.length ? Math.min(...live) : CARBON_DEFAULT_FUNDING_HOURS;
	}
	const fromTable = carbon_intervals_default.intervals[market];
	if (fromTable === 1 || fromTable === 4 || fromTable === 8) return Math.min(fromTable, deduced);
	return deduced;
}
var EXTENDED_URL = "https://api.starknet.extended.exchange/api/v1/info/markets";
var LIGHTER_BASE = "https://mainnet.zklighter.elliot.ai";
var HL_TAKER_FEE_PCT = .045;
var EXTENDED_TAKER_FEE_PCT = .025;
function put(legs, symbol, leg) {
	if (!symbol) return;
	legs[symbol] = leg;
}
async function fetchVariational(signal) {
	const listings = asList(asRecord(await getJson("Variational", VARIATIONAL_URL, { signal })).listings);
	if (!listings.length) throw new FatalError("Variational : format inattendu");
	const legs = {};
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
		if ([
			funding,
			price,
			volume,
			oiLong,
			oiShort,
			bid,
			ask
		].some((v) => v == null)) continue;
		if (price <= 0 || bid <= 0 || ask < bid) continue;
		const intervalS = toNumber(item.funding_interval_s);
		put(legs, ticker.toUpperCase(), {
			exchange: "variational",
			apr: funding * 100,
			oi: oiLong + oiShort,
			volume,
			price,
			costPct: (ask - bid) / ((ask + bid) / 2) * 100,
			fundingHours: intervalS && intervalS > 0 ? intervalS / 3600 : void 0
		});
	}
	return legs;
}
async function fetchHyperliquid(signal) {
	const data = await getJson("Hyperliquid", HYPERLIQUID_URL, {
		payload: { type: "metaAndAssetCtxs" },
		signal
	});
	if (!Array.isArray(data) || data.length !== 2) throw new FatalError("Hyperliquid : format inattendu");
	const universe = asList(asRecord(data[0]).universe);
	const contexts = asList(data[1]);
	const legs = {};
	for (let i = 0; i < Math.min(universe.length, contexts.length); i++) {
		const market = asRecord(universe[i]);
		const ctx = asRecord(contexts[i]);
		const name = market.name;
		if (typeof name !== "string" || !name || market.isDelisted) continue;
		const funding = toNumber(ctx.funding);
		const price = toNumber(ctx.markPx);
		const oiTokens = toNumber(ctx.openInterest);
		const volume = toNumber(ctx.dayNtlVlm);
		if ([
			funding,
			price,
			oiTokens,
			volume
		].some((v) => v == null) || price <= 0) continue;
		const impact = ctx.impactPxs;
		if (!Array.isArray(impact) || impact.length !== 2) continue;
		const impactBid = toNumber(impact[0]);
		const impactAsk = toNumber(impact[1]);
		if (impactBid == null || impactAsk == null || impactBid <= 0 || impactAsk < impactBid) continue;
		let symbol = name;
		let comparable = price;
		if (name[0] === "k" && name.slice(1) === name.slice(1).toUpperCase()) {
			symbol = name.slice(1);
			comparable = price / 1e3;
		}
		const spreadPct = (impactAsk - impactBid) / ((impactAsk + impactBid) / 2) * 100;
		put(legs, symbol.toUpperCase(), {
			exchange: "hyperliquid",
			apr: funding * 24 * 365 * 100,
			oi: oiTokens * price,
			volume,
			price: comparable,
			costPct: 2 * HL_TAKER_FEE_PCT + spreadPct,
			fundingHours: 1
		});
	}
	return legs;
}
async function fetchCarbonMarkPrices(symbols, signal) {
	const prices = {};
	const chunkSize = 80;
	for (let start = 0; start < symbols.length; start += chunkSize) {
		const chunk = symbols.slice(start, start + chunkSize);
		const data = asRecord(unwrapCarbon("Carbon prix", await getJson("Carbon", `${CARBON_BASE}/pricing/mark-prices`, {
			params: { symbols: chunk },
			signal
		})));
		for (const [ticker, raw] of Object.entries(data)) {
			const price = toNumber(raw);
			if (price != null && price > 0) prices[ticker] = price;
		}
	}
	return prices;
}
async function fetchCarbon(signal, solver = "PERPS_HUB", exchangeName = "carbon", fundingHoursOverride) {
	const listings = asRecord(asRecord(asRecord(unwrapCarbon("Carbon marchés", await getJson("Carbon", `${CARBON_BASE}/markets/aggregated/${CARBON_CHAIN_ID}`, { signal })))[solver]).markets);
	if (!Object.keys(listings).length) throw new FatalError(`Carbon : aucun marché ${solver}`);
	const funding = asRecord(unwrapCarbon("Carbon funding", await getJson("Carbon", `${CARBON_BASE}/solvers/funding-info`, {
		params: {
			solver,
			chainId: CARBON_CHAIN_ID
		},
		signal
	})));
	const prices = await fetchCarbonMarkPrices(Object.entries(listings).filter(([name, spec]) => typeof name === "string" && asRecord(spec).isValid !== false).map(([name]) => name), signal);
	const legs = {};
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
		if ([
			rateLong,
			rateShort,
			price,
			notionalCap,
			feeOpen,
			feeClose
		].some((v) => v == null)) continue;
		if (price <= 0 || notionalCap <= 0) continue;
		const [symbol, comparable] = carbonNormalize(name, price);
		if (!symbol || comparable == null) continue;
		const hours = fundingHoursOverride ?? carbonFundingHours(name, toNumber(info.next_funding_time));
		const aprLong = intervalApr(rateLong, hours);
		const aprShort = intervalApr(rateShort, hours);
		if (aprLong == null || aprShort == null) continue;
		put(legs, symbol, {
			exchange: exchangeName,
			apr: (aprLong + aprShort) / 2,
			aprLong,
			aprShort,
			oi: notionalCap,
			volume: null,
			price: comparable,
			costPct: (feeOpen + feeClose) * 100,
			fundingHours: hours,
			pnlBySide: true,
			oiIsCap: true
		});
	}
	return legs;
}
function fetchCarbonTradfi(signal) {
	return fetchCarbon(signal, "NOXRWA", "carbon_tradfi", 24);
}
async function fetchExtended(signal) {
	const listings = asList(asRecord(await getJson("Extended", EXTENDED_URL, { signal })).data);
	if (!listings.length) throw new FatalError("Extended : format inattendu");
	const legs = {};
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
		if (typeof name !== "string" || [
			funding,
			price,
			oi,
			volume
		].some((v) => v == null)) continue;
		if (price <= 0) continue;
		const [symbol, comparable] = lotAdjust(stripQuoteSuffix(name), price);
		if (!symbol || comparable == null) continue;
		let spreadPct = 0;
		if (bid && ask && bid > 0 && ask >= bid) spreadPct = (ask - bid) / ((ask + bid) / 2) * 100;
		put(legs, symbol, {
			exchange: "extended",
			apr: funding * 24 * 365 * 100,
			oi,
			volume,
			price: comparable,
			costPct: 2 * EXTENDED_TAKER_FEE_PCT + spreadPct,
			fundingHours: 1
		});
	}
	return legs;
}
async function fetchLighter(signal) {
	const books = asList(asRecord(await getJson("Lighter", `${LIGHTER_BASE}/api/v1/orderBookDetails`, {
		params: { filter: "perp" },
		signal
	})).order_book_details);
	if (!books.length) throw new FatalError("Lighter : format inattendu (orderBookDetails)");
	const rateRows = asList(asRecord(await getJson("Lighter", `${LIGHTER_BASE}/api/v1/funding-rates`, { signal })).funding_rates);
	if (!rateRows.length) throw new FatalError("Lighter : format inattendu (funding-rates)");
	const rateByMarket = /* @__PURE__ */ new Map();
	for (const raw of rateRows) {
		const row = asRecord(raw);
		if (row.exchange !== "lighter") continue;
		const rate = toNumber(row.rate);
		if (rate == null || row.market_id == null) continue;
		rateByMarket.set(row.market_id, rate);
	}
	const legs = {};
	for (const raw of books) {
		const book = asRecord(raw);
		if (book.status !== "active") continue;
		const name = book.symbol;
		const funding8h = rateByMarket.get(book.market_id);
		const price = toNumber(book.mark_price) ?? toNumber(book.last_trade_price);
		const oiBase = toNumber(book.open_interest);
		const volume = toNumber(book.daily_quote_token_volume);
		const taker = toNumber(book.taker_fee);
		if (typeof name !== "string" || funding8h == null || [
			price,
			oiBase,
			volume,
			taker
		].some((v) => v == null)) continue;
		if (price <= 0) continue;
		const [symbol, comparable] = lotAdjust(stripQuoteSuffix(name), price);
		if (!symbol || comparable == null) continue;
		put(legs, symbol, {
			exchange: "lighter",
			apr: funding8h * 3 * 365 * 100,
			oi: oiBase * price,
			volume,
			price: comparable,
			costPct: 2 * taker * 100,
			fundingHours: 8
		});
	}
	return legs;
}
async function fetchParadex(signal) {
	const markets = asList(asRecord(await getJson("Paradex", "https://api.prod.paradex.trade/v1/markets", { signal })).results);
	const summary = asList(asRecord(await getJson("Paradex", "https://api.prod.paradex.trade/v1/markets/summary", {
		params: { market: "ALL" },
		signal
	})).results);
	if (!markets.length || !summary.length) throw new FatalError("Paradex : format inattendu");
	const hoursBySymbol = /* @__PURE__ */ new Map();
	for (const raw of markets) {
		const market = asRecord(raw);
		if (market.asset_kind !== "PERP") continue;
		hoursBySymbol.set(market.symbol, toNumber(market.funding_period_hours) || 8);
	}
	const legs = {};
	for (const raw of summary) {
		const row = asRecord(raw);
		const name = row.symbol;
		const hours = hoursBySymbol.get(name);
		if (hours == null) continue;
		const rate = toNumber(row.funding_rate) ?? toNumber(row.future_funding_rate);
		const price = toNumber(row.mark_price) ?? toNumber(row.underlying_price);
		const oi = toNumber(row.open_interest);
		const volume = toNumber(row.volume_24h);
		if ([
			rate,
			price,
			oi,
			volume
		].some((v) => v == null) || price <= 0) continue;
		const symbol = venueSymbol(name);
		const apr = intervalApr(rate, hours);
		if (!symbol || apr == null) continue;
		put(legs, symbol, {
			exchange: "paradex",
			apr,
			oi: oi * price,
			volume,
			price,
			costPct: .06,
			fundingHours: hours
		});
	}
	return legs;
}
async function fetchOrderly(signal) {
	const [futuresPayload, infoPayload] = await Promise.all([getJson("WOOFi", "https://api.orderly.org/v1/public/futures", { signal }), getJson("WOOFi", "https://api.orderly.org/v1/public/info", { signal })]);
	const rows = asList(asRecord(asRecord(futuresPayload).data).rows);
	if (!rows.length) throw new FatalError("WOOFi : format inattendu");
	const hoursBySymbol = /* @__PURE__ */ new Map();
	for (const raw of asList(asRecord(asRecord(infoPayload).data).rows)) {
		const spec = asRecord(raw);
		const period = toNumber(spec.funding_period);
		if (typeof spec.symbol === "string" && period != null && period > 0) hoursBySymbol.set(spec.symbol, period);
	}
	const legs = {};
	for (const raw of rows) {
		const row = asRecord(raw);
		if (row.status !== "ACTIVE") continue;
		const name = row.symbol;
		const rate = toNumber(row.est_funding_rate) ?? toNumber(row.last_funding_rate);
		const price = toNumber(row.mark_price);
		const oiBase = toNumber(row.open_interest);
		const volume = toNumber(row["24h_amount"]);
		if (typeof name !== "string" || [
			rate,
			price,
			oiBase,
			volume
		].some((v) => v == null) || price <= 0) continue;
		const symbol = venueSymbol(name);
		const hours = hoursBySymbol.get(name) || 8;
		const apr = intervalApr(rate, hours);
		if (!symbol || apr == null) continue;
		put(legs, symbol, {
			exchange: "orderly",
			apr,
			oi: oiBase * price,
			volume,
			price,
			costPct: .06,
			fundingHours: hours
		});
	}
	return legs;
}
async function fetchBackpack(signal) {
	const [marks, markets, interests, tickers] = await Promise.all([
		getJson("Backpack", "https://api.backpack.exchange/api/v1/markPrices", { signal }),
		getJson("Backpack", "https://api.backpack.exchange/api/v1/markets", { signal }),
		getJson("Backpack", "https://api.backpack.exchange/api/v1/openInterest", { signal }),
		getJson("Backpack", "https://api.backpack.exchange/api/v1/tickers", { signal })
	]);
	if (![
		marks,
		markets,
		interests,
		tickers
	].every((x) => Array.isArray(x))) throw new FatalError("Backpack : format inattendu");
	const hoursBySymbol = /* @__PURE__ */ new Map();
	for (const raw of asList(markets)) {
		const market = asRecord(raw);
		const type = String(market.marketType ?? "").toUpperCase();
		if (type !== "PERP" && type !== "FUTURE") continue;
		let hours = toNumber(market.fundingInterval);
		if (hours != null && hours >= 6e4) hours = hours / 36e5;
		else if (hours != null && hours > 24) hours = hours / 3600;
		hoursBySymbol.set(market.symbol, hours || 1);
	}
	const oiBySymbol = /* @__PURE__ */ new Map();
	for (const raw of asList(interests)) {
		const row = asRecord(raw);
		oiBySymbol.set(row.symbol, toNumber(row.openInterest));
	}
	const volBySymbol = /* @__PURE__ */ new Map();
	for (const raw of asList(tickers)) {
		const row = asRecord(raw);
		volBySymbol.set(row.symbol, toNumber(row.quoteVolume));
	}
	const legs = {};
	for (const raw of asList(marks)) {
		const row = asRecord(raw);
		const name = row.symbol;
		const hours = hoursBySymbol.get(name);
		if (hours == null) continue;
		const rate = toNumber(row.fundingRate);
		const price = toNumber(row.markPrice);
		const oiBase = oiBySymbol.get(name) ?? null;
		const volume = volBySymbol.get(name) ?? null;
		if ([
			rate,
			price,
			oiBase,
			volume
		].some((v) => v == null) || price <= 0) continue;
		const symbol = venueSymbol(name);
		const apr = intervalApr(rate, hours);
		if (!symbol || apr == null) continue;
		put(legs, symbol, {
			exchange: "backpack",
			apr,
			oi: oiBase * price,
			volume,
			price,
			costPct: .04,
			fundingHours: hours
		});
	}
	return legs;
}
async function fetchAster(signal) {
	const [premiums, tickers, infos] = await Promise.all([
		getJson("Aster", "https://fapi.asterdex.com/fapi/v1/premiumIndex", { signal }),
		getJson("Aster", "https://fapi.asterdex.com/fapi/v1/ticker/24hr", { signal }),
		getJson("Aster", "https://fapi.asterdex.com/fapi/v1/fundingInfo", { signal })
	]);
	if (![
		premiums,
		tickers,
		infos
	].every((x) => Array.isArray(x))) throw new FatalError("Aster : format inattendu");
	const hoursBySymbol = /* @__PURE__ */ new Map();
	for (const raw of asList(infos)) {
		const row = asRecord(raw);
		hoursBySymbol.set(row.symbol, toNumber(row.fundingIntervalHours) || 8);
	}
	const volBySymbol = /* @__PURE__ */ new Map();
	for (const raw of asList(tickers)) {
		const row = asRecord(raw);
		volBySymbol.set(row.symbol, toNumber(row.quoteVolume));
	}
	const legs = {};
	for (const raw of asList(premiums)) {
		const row = asRecord(raw);
		const name = row.symbol;
		const rate = toNumber(row.lastFundingRate);
		const price = toNumber(row.markPrice);
		const volume = volBySymbol.get(name) ?? null;
		if (typeof name !== "string" || [
			rate,
			price,
			volume
		].some((v) => v == null) || price <= 0) continue;
		const symbol = venueSymbol(name);
		const apr = intervalApr(rate, hoursBySymbol.get(name) || 8);
		if (!symbol || apr == null) continue;
		put(legs, symbol, {
			exchange: "aster",
			apr,
			oi: null,
			volume,
			price,
			costPct: .08,
			fundingHours: hoursBySymbol.get(name) || 8
		});
	}
	return legs;
}
async function fetchPacifica(signal) {
	const rows = asList(asRecord(await getJson("Pacifica", "https://api.pacifica.fi/api/v1/info/prices", { signal })).data);
	if (!rows.length) throw new FatalError("Pacifica : format inattendu");
	const legs = {};
	for (const raw of rows) {
		const row = asRecord(raw);
		const name = row.symbol;
		const rate = toNumber(row.next_funding) ?? toNumber(row.funding);
		const price = toNumber(row.mark);
		const oiRaw = toNumber(row.open_interest);
		const volume = toNumber(row.volume_24h);
		if (typeof name !== "string" || [
			rate,
			price,
			oiRaw,
			volume
		].some((v) => v == null) || price <= 0) continue;
		const symbol = venueSymbol(name);
		const apr = intervalApr(rate, 1);
		if (!symbol || apr == null) continue;
		put(legs, symbol, {
			exchange: "pacifica",
			apr,
			oi: oiRaw,
			volume,
			price,
			costPct: .06,
			fundingHours: 1
		});
	}
	return legs;
}
async function fetchHibachi(signal) {
	const info = asRecord(await getJson("Hibachi", "https://data-api.hibachi.xyz/market/exchange-info", { signal }));
	const contracts = asList(info.futureContracts);
	if (!contracts.length) throw new FatalError("Hibachi : format inattendu");
	const taker = toNumber(asRecord(info.feeConfig).tradeTakerFeeRate) || 45e-5;
	const pairs = await mapPool(contracts.filter((raw) => {
		const contract = asRecord(raw);
		const symbolStatus = contract.symbolStatus;
		const status = contract.status;
		return (symbolStatus == null || symbolStatus === "OPEN") && (status == null || status === "LIVE") && typeof contract.symbol === "string";
	}).slice(0, 12), 4, async (raw) => {
		const contract = asRecord(raw);
		const name = String(contract.symbol);
		const [prices, stats] = await Promise.all([getJson("Hibachi", "https://data-api.hibachi.xyz/market/data/prices", {
			params: { symbol: name },
			signal,
			timeoutMs: 8e3
		}), getJson("Hibachi", "https://data-api.hibachi.xyz/market/data/stats", {
			params: { symbol: name },
			signal,
			timeoutMs: 8e3
		})]);
		const priceBody = asRecord(prices);
		const statsBody = asRecord(stats);
		const funding = toNumber(asRecord(priceBody.fundingRateEstimation).estimatedFundingRate);
		const price = toNumber(priceBody.markPrice);
		const bid = toNumber(priceBody.bidPrice);
		const ask = toNumber(priceBody.askPrice);
		const volume = toNumber(statsBody.volume24h);
		if ([
			funding,
			price,
			volume
		].some((v) => v == null) || price <= 0) return null;
		let spreadPct = 0;
		if (bid && ask && bid > 0 && ask >= bid) spreadPct = (ask - bid) / ((ask + bid) / 2) * 100;
		const symbol = (typeof contract.underlyingSymbol === "string" ? contract.underlyingSymbol.toUpperCase() : venueSymbol(name)) ?? null;
		const apr = intervalApr(funding, 1);
		if (!symbol || apr == null) return null;
		return [symbol, {
			exchange: "hibachi",
			apr,
			oi: null,
			volume,
			price,
			costPct: 2 * taker * 100 + spreadPct,
			fundingHours: 1
		}];
	});
	const legs = {};
	for (const [symbol, leg] of pairs) put(legs, symbol, leg);
	return legs;
}
async function fetchGrvt(signal) {
	const instruments = asList(asRecord(await getJson("GRVT", "https://market-data.grvt.io/full/v1/all_instruments", {
		payload: {
			is_active: true,
			kinds: ["PERPETUAL"]
		},
		signal
	})).result);
	if (!instruments.length) throw new FatalError("GRVT : format inattendu");
	const perps = instruments.filter((raw) => {
		const name = asRecord(raw).instrument;
		return typeof name === "string" && name.endsWith("_Perp");
	});
	const head = ["BTC_USDT_Perp", "ETH_USDT_Perp"].map((name) => perps.find((raw) => asRecord(raw).instrument === name)).filter((raw) => raw != null);
	const rest = perps.filter((raw) => {
		const name = asRecord(raw).instrument;
		return name !== "BTC_USDT_Perp" && name !== "ETH_USDT_Perp";
	});
	const results = await mapPool([...head, ...rest].slice(0, 25), 6, async (raw) => {
		const item = asRecord(raw);
		const name = String(item.instrument);
		let tickerRaw;
		try {
			tickerRaw = await getJson("GRVT", "https://market-data.grvt.io/full/v1/ticker", {
				payload: { instrument: name },
				signal,
				timeoutMs: 8e3
			});
		} catch {
			return null;
		}
		const ticker = asRecord(asRecord(tickerRaw).result);
		const rawRate = toNumber(ticker.funding_rate);
		const price = toNumber(ticker.mark_price);
		const oiBase = toNumber(ticker.open_interest);
		const volQ = (toNumber(ticker.buy_volume_24h_q) || 0) + (toNumber(ticker.sell_volume_24h_q) || 0);
		if ([
			rawRate,
			price,
			oiBase
		].some((v) => v == null) || price <= 0) return null;
		const symbol = venueSymbol(name.replace("_Perp", ""));
		const apr = intervalApr(rawRate / 100, 8);
		if (!symbol || apr == null) return null;
		const bid = toNumber(ticker.best_bid_price);
		const ask = toNumber(ticker.best_ask_price);
		let spreadPct = 0;
		if (bid && ask && bid > 0 && ask >= bid) spreadPct = (ask - bid) / ((ask + bid) / 2) * 100;
		return [symbol, {
			exchange: "grvt",
			apr,
			oi: oiBase * price,
			volume: volQ || null,
			price,
			costPct: .06 + spreadPct,
			fundingHours: 8
		}];
	});
	const legs = {};
	for (const [symbol, leg] of results) put(legs, symbol, leg);
	return legs;
}
async function fetchPolymarket(signal) {
	const instruments = await getJson("Polymarket", "https://api.perpetuals.polymarket.com/v1/info/instruments", { signal });
	if (!Array.isArray(instruments)) throw new FatalError("Polymarket : format inattendu");
	const results = await mapPool(instruments.map((raw) => asRecord(raw)).filter((item) => item.instrument_type === "perpetual" && item.instrument_id != null && typeof item.base_asset === "string").slice(0, 18), 4, async (item) => {
		const instrumentId = String(item.instrument_id);
		const base = String(item.base_asset);
		let funding;
		let index;
		try {
			[funding, index] = await Promise.all([getJson("Polymarket", "https://api.perpetuals.polymarket.com/v1/info/funding", {
				params: { instrument_id: instrumentId },
				signal,
				timeoutMs: 8e3
			}), getJson("Polymarket", "https://api.perpetuals.polymarket.com/v1/info/index", {
				params: { asset: base },
				signal,
				timeoutMs: 8e3
			})]);
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
		return [symbol, {
			exchange: "polymarket",
			apr,
			oi: toNumber(item.max_market_notional) || 1e6,
			oiIsCap: true,
			volume: null,
			price,
			costPct: .06,
			fundingHours: 1
		}];
	});
	const legs = {};
	for (const [symbol, leg] of results) put(legs, symbol, leg);
	return legs;
}
var ARCUS_TAKER_FEE_PCT = .0225;
async function fetchArcus(signal) {
	const rows = asList(asRecord(await getJson("Arcus", "https://api.arcus.xyz/v1/markets", { signal })).markets);
	if (!rows.length) throw new FatalError("Arcus : format inattendu");
	const legs = {};
	for (const raw of rows) {
		const row = asRecord(raw);
		if (row.status !== "ONLINE" || row.type !== "PERPETUAL") continue;
		const name = row.marketDisplayName ?? row.baseAsset;
		const rate = toNumber(row.nextFundingRate) ?? toNumber(row.fundingRate);
		const price = toNumber(row.markPrice) ?? toNumber(row.oraclePrice);
		const oiBase = toNumber(row.openInterest);
		const volume = toNumber(row.volume24hNotional);
		if (typeof name !== "string" || [
			rate,
			price,
			oiBase
		].some((v) => v == null) || price <= 0) continue;
		const symbol = venueSymbol(name);
		const apr = intervalApr(rate, 1);
		if (!symbol || apr == null) continue;
		put(legs, symbol, {
			exchange: "arcus",
			apr,
			oi: oiBase * price,
			volume: volume ?? null,
			price,
			costPct: 2 * ARCUS_TAKER_FEE_PCT,
			fundingHours: 1
		});
	}
	return legs;
}
var POPDEX_TAKER_FEE_PCT = .032;
async function fetchPopdexTickers(signal) {
	const rows = [];
	let cursor;
	for (let page = 0; page < 20; page++) {
		const payload = asRecord(await getJson("PopDEX", "https://api.popdex.xyz/api/v1/public/market/tickers", {
			signal,
			params: cursor == null ? void 0 : { cursor }
		}));
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
async function fetchPopdex(signal) {
	const [tickers, symbolsPayload] = await Promise.all([fetchPopdexTickers(signal), getJson("PopDEX", "https://api.popdex.xyz/api/v1/config/symbols", { signal })]);
	if (!tickers.length) throw new FatalError("PopDEX : format inattendu");
	const hoursBySymbol = /* @__PURE__ */ new Map();
	for (const raw of asList(asRecord(symbolsPayload).data)) {
		const row = asRecord(raw);
		const name = row.symbol;
		if (typeof name !== "string") continue;
		hoursBySymbol.set(name, toNumber(row.fundingInterval) || 1);
	}
	const legs = {};
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
		if (typeof name !== "string" || [
			rate,
			price,
			oiBase
		].some((v) => v == null) || price <= 0) continue;
		const hours = hoursBySymbol.get(name) || 1;
		const symbol = venueSymbol(name);
		const apr = intervalApr(rate, hours);
		if (!symbol || apr == null) continue;
		let spreadPct = 0;
		if (bid && ask && bid > 0 && ask >= bid) spreadPct = (ask - bid) / ((ask + bid) / 2) * 100;
		put(legs, symbol, {
			exchange: "popdex",
			apr,
			oi: oiBase * price,
			volume: volume ?? null,
			price,
			costPct: 2 * POPDEX_TAKER_FEE_PCT + spreadPct,
			fundingHours: hours
		});
	}
	return legs;
}
var VENUE_LOADERS = [
	{
		id: "variational",
		label: "Variational",
		load: fetchVariational
	},
	{
		id: "hyperliquid",
		label: "Hyperliquid",
		load: fetchHyperliquid
	},
	{
		id: "carbon",
		label: "Carbon",
		load: fetchCarbon
	},
	{
		id: "extended",
		label: "Extended",
		load: fetchExtended
	},
	{
		id: "lighter",
		label: "Lighter",
		load: fetchLighter
	},
	{
		id: "paradex",
		label: "Paradex",
		load: fetchParadex
	},
	{
		id: "orderly",
		label: "WOOFi",
		load: fetchOrderly
	},
	{
		id: "backpack",
		label: "Backpack",
		load: fetchBackpack
	},
	{
		id: "aster",
		label: "Aster",
		load: fetchAster
	},
	{
		id: "pacifica",
		label: "Pacifica",
		load: fetchPacifica
	},
	{
		id: "hibachi",
		label: "Hibachi",
		load: fetchHibachi
	},
	{
		id: "carbon_tradfi",
		label: "Carbon TradFi",
		load: fetchCarbonTradfi
	},
	{
		id: "grvt",
		label: "GRVT",
		load: fetchGrvt
	},
	{
		id: "polymarket",
		label: "Polymarket",
		load: fetchPolymarket
	},
	{
		id: "arcus",
		label: "Arcus",
		load: fetchArcus
	},
	{
		id: "popdex",
		label: "PopDEX",
		load: fetchPopdex
	}
];
var CACHE_TTL_MS = 45e3;
var VENUE_DEADLINE_MS = 1e4;
var CANARY_SYMBOLS = ["BTC", "ETH"];
var cache = null;
function mergeLegs(target, source) {
	for (const [symbol, leg] of Object.entries(source)) (target[symbol] ?? (target[symbol] = [])).push(leg);
}
/** APR comparable (positif = les longs paient). Carbon publie le PnL par côté. */
function standardApr(leg) {
	if (leg.pnlBySide && leg.aprLong != null && leg.aprShort != null) return (leg.aprShort - leg.aprLong) / 2;
	return leg.apr;
}
function median(values) {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function fmtAprPts(value) {
	return `${value > 0 ? "+" : ""}${value.toFixed(1)} %`;
}
function fmtRatio(value) {
	const digits = Math.abs(value) >= 10 ? 1 : 2;
	return value.toFixed(digits);
}
function excludeVenues(legs, suspects) {
	if (!suspects.size) return;
	for (const symbol of Object.keys(legs)) {
		const kept = legs[symbol].filter((leg) => !suspects.has(leg.exchange));
		if (kept.length) legs[symbol] = kept;
		else delete legs[symbol];
	}
}
/**
* Canari BTC/ETH : un DEX dont l’APR s’écarte trop de la médiane
* (intervalle ou unité de funding probablement faux) est retiré des opportunités.
*/
function applyBtcEthCanary(legs, venues) {
	const listed = new Set(venues.map((venue) => venue.id));
	const present = /* @__PURE__ */ new Set();
	const flags = /* @__PURE__ */ new Map();
	for (const symbol of CANARY_SYMBOLS) {
		const sample = (legs[symbol] ?? []).filter((leg) => listed.has(leg.exchange));
		for (const leg of sample) present.add(leg.exchange);
		if (sample.length < 3) continue;
		const med = median(sample.map((leg) => standardApr(leg)));
		const threshold = Math.max(30, 2 * Math.abs(med));
		for (const leg of sample) {
			const apr = standardApr(leg);
			if (Math.abs(apr - med) <= threshold) continue;
			const prev = flags.get(leg.exchange);
			const note = `${symbol} ${fmtAprPts(apr)}, médiane ${fmtAprPts(med)}`;
			flags.set(leg.exchange, prev ? `${prev} ; ${note}` : note);
		}
	}
	const suspects = new Set(flags.keys());
	for (const venue of venues) {
		if (venue.error) continue;
		if (suspects.has(venue.id)) {
			venue.error = `APR incohérent avec BTC/ETH des autres DEX : intervalle ou unité de funding à vérifier (${flags.get(venue.id)})`;
			continue;
		}
		if (venue.id === "carbon_tradfi") continue;
		if (venue.count > 0 && !present.has(venue.id)) venue.error = "Pas de BTC/ETH : APR non contrôlé";
	}
	excludeVenues(legs, suspects);
}
/**
* Canari croisé : médiane du ratio APR(DEX) / médiane des autres DEX,
* uniquement sur les paires partagées avec ≥ 2 autres et |médiane| ≥ 10 %.
* Un facteur hors [0,67 ; 1,5] (ou un signe inverse) trahit un intervalle / une unité faux.
*/
function applyRatioCanary(legs, venues) {
	const report = /* @__PURE__ */ new Map();
	const suspects = /* @__PURE__ */ new Set();
	for (const venue of venues) {
		if (venue.id === "carbon_tradfi") continue;
		if (venue.error?.startsWith("APR incohérent")) {
			report.set(venue.id, {
				n: 0,
				ratio: null
			});
			continue;
		}
		const ratios = [];
		for (const [symbol, list] of Object.entries(legs)) {
			const mine = list.find((leg) => leg.exchange === venue.id);
			if (!mine) continue;
			const others = list.filter((leg) => leg.exchange !== venue.id);
			if (others.length < 2) continue;
			const med = median(others.map(standardApr));
			if (Math.abs(med) < 10) continue;
			ratios.push(standardApr(mine) / med);
		}
		if (ratios.length < 5) {
			report.set(venue.id, {
				n: ratios.length,
				ratio: null
			});
			if (venue.count > 0 && (!venue.error || venue.error.startsWith("Pas de BTC/ETH"))) {
				venue.error = "Écart systématique : non contrôlable";
				suspects.add(venue.id);
			}
			continue;
		}
		const medRatio = median(ratios);
		report.set(venue.id, {
			n: ratios.length,
			ratio: medRatio
		});
		if (medRatio > 1.5 || medRatio < .67) {
			suspects.add(venue.id);
			venue.error = `Écart systématique ×${fmtRatio(medRatio)} avec les autres DEX sur ${ratios.length} paires : intervalle, unité ou signe du funding à vérifier`;
		}
	}
	excludeVenues(legs, suspects);
	return report;
}
/**
* Carbon TradFi : le funding overnight reste en général entre quelques % et 20 % / an.
* Une médiane hors 0,5–25 % pointe un intervalle (1 h / 8 h au lieu de 24 h) ou une unité faux.
*/
function applyTradfiCanary(legs, venues) {
	const venue = venues.find((row) => row.id === "carbon_tradfi");
	if (!venue || venue.count < 1) return null;
	const magnitudes = [];
	for (const list of Object.values(legs)) for (const leg of list) {
		if (leg.exchange !== "carbon_tradfi") continue;
		const mag = leg.aprLong != null && leg.aprShort != null ? Math.max(Math.abs(leg.aprLong), Math.abs(leg.aprShort)) : Math.abs(leg.apr);
		if (mag === 0) continue;
		magnitudes.push(mag);
	}
	if (magnitudes.length < 5) {
		venue.error = "Écart systématique : non contrôlable";
		excludeVenues(legs, /* @__PURE__ */ new Set(["carbon_tradfi"]));
		return magnitudes.length ? median(magnitudes) : null;
	}
	const med = median(magnitudes);
	if (med < .5 || med > 25) {
		venue.error = `Écart systématique : médiane |APR| ${fmtAprPts(med).replace("+", "")} hors plage 0,5–25 % (funding TradFi)`;
		excludeVenues(legs, /* @__PURE__ */ new Set(["carbon_tradfi"]));
	}
	return med;
}
async function loadVenue(loader) {
	const started = Date.now();
	try {
		const legs = await withDeadline(VENUE_DEADLINE_MS, (signal) => loader.load(signal));
		return {
			legs,
			status: {
				id: loader.id,
				label: loader.label,
				count: Object.keys(legs).length,
				ms: Date.now() - started
			}
		};
	} catch (error) {
		const message = error instanceof FatalError || error instanceof TemporaryError ? error.message : error instanceof Error ? error.message : "échec";
		return {
			legs: {},
			status: {
				id: loader.id,
				label: loader.label,
				count: 0,
				error: message,
				ms: Date.now() - started
			}
		};
	}
}
async function executeScan(force) {
	if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return {
		...cache.payload,
		cached: true
	};
	const started = Date.now();
	const results = await Promise.all(VENUE_LOADERS.map(loadVenue));
	const legs = {};
	const venues = [];
	for (const result of results) {
		mergeLegs(legs, result.legs);
		venues.push(result.status);
	}
	applyBtcEthCanary(legs, venues);
	applyRatioCanary(legs, venues);
	applyTradfiCanary(legs, venues);
	const payload = {
		scannedAt: Date.now(),
		durationMs: Date.now() - started,
		cached: false,
		venues,
		legs
	};
	cache = {
		at: Date.now(),
		payload
	};
	return payload;
}
//#endregion
export { executeScan };
