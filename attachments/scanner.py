"""
scanner.py : scanner d'arbitrage de funding
Variational <-> Hyperliquid <-> Carbon <-> Extended <-> Lighter.

Interroge les API publiques et gratuites des DEX (aucune clé nécessaire),
cherche pour chaque token coté d'au moins deux côtés la meilleure combinaison
LONG sur un DEX / SHORT sur l'autre, écarte les marchés risqués et affiche
le classement dans le terminal. Le script lit des données : il ne passe aucun ordre.

Lancement : python scanner.py
"""

import itertools
import math
import sys

import requests

VARIATIONAL_URL = "https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats"
HYPERLIQUID_URL = "https://api.hyperliquid.xyz/info"
CARBON_BASE = "https://gw.carbon.inc/v1"
CARBON_CHAIN_ID = 42161          # Arbitrum
CARBON_SOLVER = "PERPS_HUB"      # perps crypto ; NOXRWA = TradFi
CARBON_FUNDING_HOURS = 4         # intervalle observé sur next_funding_time
EXTENDED_URL = "https://api.starknet.extended.exchange/api/v1/info/markets"
LIGHTER_BASE = "https://mainnet.zklighter.elliot.ai"

# ---------- Réglages : modifie-les librement ----------
MIN_SPREAD_APR = 20.0        # écart minimum entre les 2 jambes, en % APR
MIN_OPEN_INTEREST = 500_000  # open interest minimum en $, sur CHAQUE jambe
MIN_VOLUME_24H = 500_000     # volume 24 h minimum en $, sur CHAQUE jambe
MAX_PRICE_GAP_PCT = 1.0      # écart de prix maximum entre les 2 DEX, en %
MAX_BREAKEVEN_HOURS = 72     # au-delà de 3 jours pour rembourser les coûts, le funding
                             # a largement le temps de s'inverser
HL_TAKER_FEE_PCT = 0.045     # frais taker Hyperliquid au palier de base, par ordre
EXTENDED_TAKER_FEE_PCT = 0.025  # palier de base Extended, par ordre (à ajuster selon ton compte)
TOP_N = 10                   # nombre d'opportunités affichées


# Deux familles d'erreurs, parce qu'à l'étape 2 la boucle réagira différemment :
# elle s'arrêtera sur une FatalError et réessaiera plus tard sur une TemporaryError.
class FatalError(Exception):
    """Réessayer ne sert à rien : accès refusé, format de l'API changé."""


class TemporaryError(Exception):
    """Problème passager : réseau, surcharge de l'API, limite de requêtes."""


def get_json(source, url, payload=None, params=None):
    """Appelle une API et renvoie sa réponse JSON. Avec payload : requête POST, sinon GET."""
    try:
        if payload is None:
            response = requests.get(url, timeout=30, params=params)
        else:
            response = requests.post(url, json=payload, timeout=30, params=params)
    except requests.RequestException as error:
        # Aucune réponse du serveur : coupure internet, DNS, délai dépassé...
        raise TemporaryError(f"{source} injoignable ({error})")

    status = response.status_code
    # On garde le début de la réponse : un refus peut venir d'un pare-feu,
    # d'un antivirus ou d'un VPN placé entre toi et l'API, pas forcément du DEX.
    detail = " ".join(response.text.split())[:150] or "(vide)"
    if status == 429:
        raise TemporaryError(f"{source} : trop de requêtes (429), attends une minute")
    if status >= 500:
        raise TemporaryError(f"{source} a un problème de son côté ({status})")
    if status != 200:
        raise FatalError(f"{source} a répondu {status}. Serveur : {detail}")
    try:
        return response.json()
    except ValueError:
        raise TemporaryError(f"{source} : réponse illisible (pas du JSON)")


def to_number(value):
    """Convertit en nombre ; renvoie None si la valeur manque ou est invalide."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None  # rejette NaN et l'infini


def as_dict(value):
    """Renvoie value si c'est un dictionnaire, sinon un dictionnaire vide.
    Évite de planter quand un champ attendu est absent ou d'un autre type."""
    return value if isinstance(value, dict) else {}


def unwrap_carbon(source, payload):
    """Les réponses Carbon sont toujours {success, data}. On extrait data."""
    payload = as_dict(payload)
    if payload.get("success") is False:
        raise TemporaryError(f"{source} : {payload.get('statusMessage') or 'échec'}")
    return payload.get("data")


def side_apr(leg, side):
    """APR à utiliser selon que la jambe est LONG ou SHORT.
    Carbon publie deux taux ; Variational et Hyperliquid n'en ont qu'un."""
    if side == "long":
        return leg.get("apr_long", leg["apr"])
    return leg.get("apr_short", leg["apr"])


def fetch_variational():
    """Marchés Variational Omni, sous la forme {symbole: jambe}."""
    data = get_json("Variational", VARIATIONAL_URL)
    listings = as_dict(data).get("listings")
    if not isinstance(listings, list):
        raise FatalError("Variational : format inattendu, l'API a peut-être changé")

    legs = {}
    for item in listings:
        item = as_dict(item)
        ticker = item.get("ticker")
        funding = to_number(item.get("funding_rate"))
        price = to_number(item.get("mark_price"))
        volume = to_number(item.get("volume_24h"))
        open_interest = as_dict(item.get("open_interest"))
        oi_long = to_number(open_interest.get("long_open_interest"))
        oi_short = to_number(open_interest.get("short_open_interest"))
        quote = as_dict(as_dict(item.get("quotes")).get("size_1k"))  # cotation pour 1 000 $
        bid, ask = to_number(quote.get("bid")), to_number(quote.get("ask"))
        if not isinstance(ticker, str) or not ticker:
            continue
        if None in (funding, price, volume, oi_long, oi_short, bid, ask):
            continue  # donnée manquante ou pas de cotation : on ignore ce marché
        if price <= 0 or bid <= 0 or ask < bid:
            continue
        legs[ticker.upper()] = {
            "exchange": "variational",
            "apr": funding * 100,          # funding_rate est déjà annualisé : 0.05 = 5 % APR
            "oi": oi_long + oi_short,      # déjà en $
            "volume": volume,
            "price": price,
            # Pas de frais de trading sur Omni : le coût d'un aller-retour de 1 000 $,
            # c'est l'écart entre le prix d'achat (ask) et le prix de revente (bid).
            "cost_pct": (ask - bid) / ((ask + bid) / 2) * 100,
        }
    return legs


def fetch_hyperliquid():
    """Marchés perp Hyperliquid, sous la forme {symbole: jambe}."""
    data = get_json("Hyperliquid", HYPERLIQUID_URL, payload={"type": "metaAndAssetCtxs"})
    # Réponse = [meta, chiffres] : meta["universe"][i] décrit le marché i, chiffres[i] ses données
    if not (isinstance(data, list) and len(data) == 2):
        raise FatalError("Hyperliquid : format inattendu, l'API a peut-être changé")
    universe, contexts = as_dict(data[0]).get("universe"), data[1]
    if not isinstance(universe, list) or not isinstance(contexts, list):
        raise FatalError("Hyperliquid : format inattendu, l'API a peut-être changé")

    legs = {}
    for market, ctx in zip(universe, contexts):  # zip associe le marché i à ses chiffres i
        market, ctx = as_dict(market), as_dict(ctx)
        name = market.get("name")
        if not isinstance(name, str) or not name or market.get("isDelisted"):
            continue
        funding = to_number(ctx.get("funding"))
        price = to_number(ctx.get("markPx"))
        oi_tokens = to_number(ctx.get("openInterest"))
        volume = to_number(ctx.get("dayNtlVlm"))
        if None in (funding, price, oi_tokens, volume) or price <= 0:
            continue
        # Prix d'impact = prix moyen pour vendre / acheter une grosse taille.
        # S'ils manquent, le carnet d'ordres est trop fin : on ignore ce marché.
        impact = ctx.get("impactPxs")
        if not (isinstance(impact, list) and len(impact) == 2):
            continue
        impact_bid, impact_ask = to_number(impact[0]), to_number(impact[1])
        if impact_bid is None or impact_ask is None or impact_bid <= 0 or impact_ask < impact_bid:
            continue

        symbol, comparable_price = name, price
        # Hyperliquid cote certains petits tokens par lots de 1 000 : kPEPE = 1 000 PEPE
        if name[0] == "k" and name[1:].isupper():
            symbol, comparable_price = name[1:], price / 1000

        spread_pct = (impact_ask - impact_bid) / ((impact_ask + impact_bid) / 2) * 100
        legs[symbol.upper()] = {
            "exchange": "hyperliquid",
            "apr": funding * 24 * 365 * 100,   # funding horaire -> APR en %
            "oi": oi_tokens * price,            # open interest en jetons -> en $
            "volume": volume,
            "price": comparable_price,
            "cost_pct": 2 * HL_TAKER_FEE_PCT + spread_pct,  # 2 ordres taker + écart de prix
        }
    return legs


def carbon_normalize(name, price):
    """BTCUSDT -> BTC ; 1000PEPEUSDT -> PEPE (prix / 1 000). Ignore TradFi / suffixes bizarres."""
    if not isinstance(name, str) or not name:
        return None, None
    symbol = name.upper()
    if symbol.endswith("_PERP"):
        return None, None
    if symbol.endswith("_CARBONRWA"):
        symbol = symbol[: -len("_CARBONRWA")]
    if symbol.endswith("USDT"):
        symbol = symbol[:-4]
    elif symbol.endswith("USD"):
        symbol = symbol[:-3]
    if symbol.startswith("1000") and symbol[4:].isalpha():
        symbol = symbol[4:]
        if price is not None:
            price = price / 1000
    if not symbol or not symbol.isascii() or not symbol.isalnum():
        return None, None
    return symbol, price


def fetch_carbon_mark_prices(symbols):
    """Prix mark Carbon, par lots (l'API accepte une liste de symboles)."""
    prices = {}
    chunk_size = 80
    for start in range(0, len(symbols), chunk_size):
        chunk = symbols[start:start + chunk_size]
        payload = get_json(
            "Carbon",
            f"{CARBON_BASE}/pricing/mark-prices",
            params={"symbols": chunk},
        )
        data = unwrap_carbon("Carbon prix", payload)
        for ticker, raw_price in as_dict(data).items():
            price = to_number(raw_price)
            if price is not None and price > 0:
                prices[ticker] = price
    return prices


def fetch_carbon(solver=None, exchange_name="carbon"):
    """Marchés Carbon. PERPS_HUB = crypto ; NOXRWA = CarbonTradFi."""
    solver = solver or CARBON_SOLVER
    markets_payload = get_json("Carbon", f"{CARBON_BASE}/markets/aggregated/{CARBON_CHAIN_ID}")
    markets_data = as_dict(unwrap_carbon("Carbon marchés", markets_payload))
    listings = as_dict(as_dict(markets_data.get(solver)).get("markets"))
    if not listings:
        raise FatalError(f"Carbon : aucun marché {solver}")

    funding_payload = get_json(
        "Carbon",
        f"{CARBON_BASE}/solvers/funding-info",
        params={"solver": solver, "chainId": CARBON_CHAIN_ID},
    )
    funding = as_dict(unwrap_carbon("Carbon funding", funding_payload))

    tickers = [name for name, spec in listings.items()
               if isinstance(name, str) and as_dict(spec).get("isValid") is not False]
    prices = fetch_carbon_mark_prices(tickers)

    intervals_per_year = (24 / CARBON_FUNDING_HOURS) * 365
    legs = {}
    for name, spec in listings.items():
        spec = as_dict(spec)
        if spec.get("isValid") is False:
            continue
        info = as_dict(funding.get(name))
        rate_long = to_number(info.get("next_funding_rate_long"))
        rate_short = to_number(info.get("next_funding_rate_short"))
        price = prices.get(name)
        # Capacite max du marché en $ : Carbon ne publie pas l'OI ni le volume par token.
        notional_cap = to_number(spec.get("maxNotionalValue"))
        fee_open = to_number(spec.get("hedgerFeeOpen"))
        fee_close = to_number(spec.get("hedgerFeeClose"))
        if None in (rate_long, rate_short, price, notional_cap, fee_open, fee_close):
            continue
        if price <= 0 or notional_cap <= 0:
            continue
        symbol, comparable_price = carbon_normalize(name, price)
        if symbol is None:
            continue
        apr_long = rate_long * intervals_per_year * 100
        apr_short = rate_short * intervals_per_year * 100
        legs[symbol] = {
            "exchange": exchange_name,
            "apr": (apr_long + apr_short) / 2,  # affichage par défaut ; best_pair utilise apr_long/short
            "apr_long": apr_long,
            "apr_short": apr_short,
            "oi": notional_cap,                 # plafond de taille, pas un vrai open interest
            "volume": None,                     # Carbon ne publie pas le volume 24 h
            "price": comparable_price,
            # tradingFee est souvent 0 ; le coût réel, c'est le hedge du solver à l'ouverture et à la fermeture.
            "cost_pct": (fee_open + fee_close) * 100,
        }
    return legs


def strip_quote_suffix(name):
    """BTC-USD / BTCUSDT / BTCUSD -> BTC."""
    symbol = name.upper().replace("_", "")
    for suffix in ("USDT", "USDC", "USD"):
        if symbol.endswith(suffix) and len(symbol) > len(suffix):
            symbol = symbol[:-len(suffix)]
            break
    if symbol.endswith("-"):
        symbol = symbol[:-1]
    return symbol


def lot_adjust(symbol, price):
    """1000PEPE / kPEPE -> PEPE avec prix unitaire."""
    if symbol.startswith("1000") and symbol[4:].isalpha():
        return symbol[4:], (None if price is None else price / 1000)
    if symbol.startswith("K") and len(symbol) > 1 and symbol[1:].isupper() and symbol[1:].isalpha():
        return symbol[1:], (None if price is None else price / 1000)
    return symbol, price


def fetch_extended():
    """Marchés perp Extended (Starknet), sous la forme {symbole: jambe}."""
    payload = as_dict(get_json("Extended", EXTENDED_URL))
    listings = payload.get("data")
    if not isinstance(listings, list):
        raise FatalError("Extended : format inattendu, l'API a peut-être changé")

    legs = {}
    for item in listings:
        item = as_dict(item)
        name = item.get("name")
        if item.get("type") != "PERPETUAL":
            continue
        if item.get("status") not in (None, "ACTIVE") or item.get("active") is False:
            continue
        if item.get("isRfq"):
            continue
        stats = as_dict(item.get("marketStats"))
        funding = to_number(stats.get("fundingRate"))
        price = to_number(stats.get("markPrice")) or to_number(stats.get("lastPrice"))
        oi = to_number(stats.get("openInterest"))       # déjà en $
        volume = to_number(stats.get("dailyVolume"))
        bid, ask = to_number(stats.get("bidPrice")), to_number(stats.get("askPrice"))
        if not isinstance(name, str) or None in (funding, price, oi, volume):
            continue
        if price <= 0:
            continue
        symbol, comparable_price = lot_adjust(strip_quote_suffix(name), price)
        if not symbol:
            continue
        spread_pct = 0.0
        if bid and ask and bid > 0 and ask >= bid:
            spread_pct = (ask - bid) / ((ask + bid) / 2) * 100
        # fundingRate Extended = taux horaire (paiement chaque heure, formule interne / 8)
        legs[symbol] = {
            "exchange": "extended",
            "apr": funding * 24 * 365 * 100,
            "oi": oi,
            "volume": volume,
            "price": comparable_price,
            "cost_pct": 2 * EXTENDED_TAKER_FEE_PCT + spread_pct,
        }
    return legs


def fetch_lighter():
    """Marchés perp Lighter, sous la forme {symbole: jambe}."""
    details_payload = as_dict(get_json(
        "Lighter",
        f"{LIGHTER_BASE}/api/v1/orderBookDetails",
        params={"filter": "perp"},
    ))
    books = details_payload.get("order_book_details")
    if not isinstance(books, list):
        raise FatalError("Lighter : format inattendu (orderBookDetails)")

    rates_payload = as_dict(get_json("Lighter", f"{LIGHTER_BASE}/api/v1/funding-rates"))
    rate_rows = rates_payload.get("funding_rates")
    if not isinstance(rate_rows, list):
        raise FatalError("Lighter : format inattendu (funding-rates)")

    # Cet endpoint normalise les taux en équivalent 8 h (HL natif 0.0000125/h -> 0.0001 ici).
    rate_by_market = {}
    for row in rate_rows:
        row = as_dict(row)
        if row.get("exchange") != "lighter":
            continue
        rate = to_number(row.get("rate"))
        market_id = row.get("market_id")
        if rate is None or market_id is None:
            continue
        rate_by_market[market_id] = rate

    legs = {}
    for book in books:
        book = as_dict(book)
        if book.get("status") != "active":
            continue
        name = book.get("symbol")
        market_id = book.get("market_id")
        funding_8h = rate_by_market.get(market_id)
        price = to_number(book.get("mark_price")) or to_number(book.get("last_trade_price"))
        oi_base = to_number(book.get("open_interest"))
        volume = to_number(book.get("daily_quote_token_volume"))
        taker = to_number(book.get("taker_fee"))
        if not isinstance(name, str) or None in (funding_8h, price, oi_base, volume, taker):
            continue
        if price <= 0:
            continue
        symbol, comparable_price = lot_adjust(strip_quote_suffix(name), price)
        if not symbol:
            continue
        legs[symbol] = {
            "exchange": "lighter",
            "apr": funding_8h * 3 * 365 * 100,   # taux 8 h -> APR %
            "oi": oi_base * price,               # OI en jetons -> $
            "volume": volume,
            "price": comparable_price,
            "cost_pct": 2 * taker * 100,         # taker souvent 0 sur Lighter retail
        }
    return legs


def venue_symbol(name):
    """PERP_BTC_USDC / SOL_USDC_PERP / ETH-USD-PERP / ETH/USDT-P -> BTC / SOL / ETH."""
    if not isinstance(name, str):
        return None
    symbol = name.upper()
    for junk in ("/USDT-P", "/USD-P", "_USDC_PERP", "_USDT_PERP", "-USD-PERP", "-USDT-PERP",
                 "_PERP", "-PERP"):
        symbol = symbol.replace(junk, "")
    if symbol.startswith("PERP_"):
        symbol = symbol[5:].split("_")[0]
    symbol = symbol.replace("/", "")
    symbol, _ = lot_adjust(strip_quote_suffix(symbol), None)
    return symbol or None


def interval_apr(rate, hours):
    """Taux par intervalle -> APR %."""
    if hours <= 0:
        return None
    return rate * (24 / hours) * 365 * 100


def fetch_paradex():
    """Perps Paradex (ignore options). Taux sur funding_period_hours (souvent 8 h)."""
    markets = as_dict(get_json("Paradex", "https://api.prod.paradex.trade/v1/markets")).get("results")
    summary = as_dict(get_json(
        "Paradex", "https://api.prod.paradex.trade/v1/markets/summary", params={"market": "ALL"}
    )).get("results")
    if not isinstance(markets, list) or not isinstance(summary, list):
        raise FatalError("Paradex : format inattendu")
    hours_by_symbol = {}
    for market in markets:
        market = as_dict(market)
        if market.get("asset_kind") != "PERP":
            continue
        hours_by_symbol[market.get("symbol")] = to_number(market.get("funding_period_hours")) or 8
    legs = {}
    for row in summary:
        row = as_dict(row)
        name = row.get("symbol")
        if name not in hours_by_symbol:
            continue
        rate = to_number(row.get("funding_rate")) or to_number(row.get("future_funding_rate"))
        price = to_number(row.get("mark_price")) or to_number(row.get("underlying_price"))
        oi = to_number(row.get("open_interest"))
        volume = to_number(row.get("volume_24h"))
        if None in (rate, price, oi, volume) or price <= 0:
            continue
        symbol = venue_symbol(name)
        if not symbol:
            continue
        legs[symbol] = {
            "exchange": "paradex",
            "apr": interval_apr(rate, hours_by_symbol[name]),
            "oi": oi * price if oi < price * 10 else oi,  # OI parfois en jetons
            "volume": volume,
            "price": price,
            "cost_pct": 2 * 0.03,  # taker 3 bps
        }
    return legs


def fetch_orderly():
    """Perps Orderly. est_funding_rate ≈ taux de la prochaine fenêtre (souvent 8 h)."""
    payload = as_dict(get_json("Orderly", "https://api.orderly.org/v1/public/futures"))
    rows = as_dict(payload.get("data")).get("rows")
    if not isinstance(rows, list):
        raise FatalError("Orderly : format inattendu")
    legs = {}
    for row in rows:
        row = as_dict(row)
        if row.get("status") != "ACTIVE":
            continue
        name = row.get("symbol")
        rate = to_number(row.get("est_funding_rate"))
        if rate is None:
            rate = to_number(row.get("last_funding_rate"))
        price = to_number(row.get("mark_price"))
        oi_base = to_number(row.get("open_interest"))
        volume = to_number(row.get("24h_amount"))  # notionnel quote
        if not isinstance(name, str) or None in (rate, price, oi_base, volume) or price <= 0:
            continue
        symbol = venue_symbol(name)
        if not symbol:
            continue
        legs[symbol] = {
            "exchange": "orderly",
            "apr": interval_apr(rate, 8),
            "oi": oi_base * price,
            "volume": volume,
            "price": price,
            "cost_pct": 2 * 0.03,
        }
    return legs


def fetch_backpack():
    """Perps Backpack. fundingRate = taux de l'intervalle marché (souvent 1 h)."""
    marks = get_json("Backpack", "https://api.backpack.exchange/api/v1/markPrices")
    markets = get_json("Backpack", "https://api.backpack.exchange/api/v1/markets")
    interests = get_json("Backpack", "https://api.backpack.exchange/api/v1/openInterest")
    tickers = get_json("Backpack", "https://api.backpack.exchange/api/v1/tickers")
    if not all(isinstance(x, list) for x in (marks, markets, interests, tickers)):
        raise FatalError("Backpack : format inattendu")
    hours_by_symbol = {}
    for market in markets:
        market = as_dict(market)
        if str(market.get("marketType", "")).upper() not in ("PERP", "FUTURE"):
            continue
        hours = to_number(market.get("fundingInterval"))
        # fundingInterval est en secondes chez Backpack (3600 = 1 h)
        if hours and hours > 24:
            hours = hours / 3600
        hours_by_symbol[market.get("symbol")] = hours or 1
    oi_by_symbol = {as_dict(x).get("symbol"): to_number(as_dict(x).get("openInterest")) for x in interests}
    vol_by_symbol = {as_dict(x).get("symbol"): to_number(as_dict(x).get("quoteVolume")) for x in tickers}
    legs = {}
    for row in marks:
        row = as_dict(row)
        name = row.get("symbol")
        if name not in hours_by_symbol:
            continue
        rate = to_number(row.get("fundingRate"))
        price = to_number(row.get("markPrice"))
        oi_base = oi_by_symbol.get(name)
        volume = vol_by_symbol.get(name)
        if None in (rate, price, oi_base, volume) or price <= 0:
            continue
        symbol = venue_symbol(name)
        if not symbol:
            continue
        legs[symbol] = {
            "exchange": "backpack",
            "apr": interval_apr(rate, hours_by_symbol[name]),
            "oi": oi_base * price,
            "volume": volume,
            "price": price,
            "cost_pct": 2 * 0.02,
        }
    return legs


def fetch_aster():
    """Perps Aster (API type Binance). lastFundingRate sur fundingIntervalHours."""
    premiums = get_json("Aster", "https://fapi.asterdex.com/fapi/v1/premiumIndex")
    tickers = get_json("Aster", "https://fapi.asterdex.com/fapi/v1/ticker/24hr")
    infos = get_json("Aster", "https://fapi.asterdex.com/fapi/v1/fundingInfo")
    if not all(isinstance(x, list) for x in (premiums, tickers, infos)):
        raise FatalError("Aster : format inattendu")
    hours_by_symbol = {as_dict(x).get("symbol"): to_number(as_dict(x).get("fundingIntervalHours")) or 8
                       for x in infos}
    vol_by_symbol = {as_dict(x).get("symbol"): to_number(as_dict(x).get("quoteVolume")) for x in tickers}
    legs = {}
    for row in premiums:
        row = as_dict(row)
        name = row.get("symbol")
        rate = to_number(row.get("lastFundingRate"))
        price = to_number(row.get("markPrice"))
        volume = vol_by_symbol.get(name)
        if not isinstance(name, str) or None in (rate, price, volume) or price <= 0:
            continue
        symbol = venue_symbol(name)
        if not symbol:
            continue
        # Aster ne publie pas l'OI sur premiumIndex : on utilise le volume comme filtre principal
        legs[symbol] = {
            "exchange": "aster",
            "apr": interval_apr(rate, hours_by_symbol.get(name) or 8),
            "oi": volume,  # proxy : pas d'OI public ici
            "volume": volume,
            "price": price,
            "cost_pct": 2 * 0.04,
        }
    return legs


def fetch_pacifica():
    """Perps Pacifica. funding = taux horaire déjà appliqué / prévu."""
    payload = as_dict(get_json("Pacifica", "https://api.pacifica.fi/api/v1/info/prices"))
    rows = payload.get("data")
    if not isinstance(rows, list):
        raise FatalError("Pacifica : format inattendu")
    legs = {}
    for row in rows:
        row = as_dict(row)
        name = row.get("symbol")
        rate = to_number(row.get("next_funding"))
        if rate is None:
            rate = to_number(row.get("funding"))
        price = to_number(row.get("mark"))
        oi_raw = to_number(row.get("open_interest"))
        volume = to_number(row.get("volume_24h"))
        if not isinstance(name, str) or None in (rate, price, oi_raw, volume) or price <= 0:
            continue
        symbol = venue_symbol(name)
        if not symbol:
            continue
        # OI parfois en jetons (BTC ~384), parfois déjà en $ (EURUSD)
        oi = oi_raw * price if oi_raw * price > oi_raw else oi_raw
        legs[symbol] = {
            "exchange": "pacifica",
            "apr": interval_apr(rate, 1),
            "oi": oi,
            "volume": volume,
            "price": price,
            "cost_pct": 2 * 0.03,
        }
    return legs


def fetch_hibachi():
    """Perps Hibachi. Peu de marchés : un GET prix + stats par symbole."""
    info = as_dict(get_json("Hibachi", "https://data-api.hibachi.xyz/market/exchange-info"))
    contracts = info.get("futureContracts")
    if not isinstance(contracts, list):
        raise FatalError("Hibachi : format inattendu")
    taker = to_number(as_dict(info.get("feeConfig")).get("tradeTakerFeeRate")) or 0.00045
    legs = {}
    for contract in contracts:
        contract = as_dict(contract)
        if contract.get("symbolStatus") not in (None, "OPEN") or contract.get("status") not in (None, "LIVE"):
            continue
        name = contract.get("symbol")
        if not isinstance(name, str):
            continue
        prices = as_dict(get_json(
            "Hibachi", "https://data-api.hibachi.xyz/market/data/prices", params={"symbol": name}
        ))
        stats = as_dict(get_json(
            "Hibachi", "https://data-api.hibachi.xyz/market/data/stats", params={"symbol": name}
        ))
        funding = to_number(as_dict(prices.get("fundingRateEstimation")).get("estimatedFundingRate"))
        price = to_number(prices.get("markPrice"))
        bid, ask = to_number(prices.get("bidPrice")), to_number(prices.get("askPrice"))
        volume = to_number(stats.get("volume24h"))
        if None in (funding, price, volume) or price <= 0:
            continue
        spread_pct = 0.0
        if bid and ask and bid > 0 and ask >= bid:
            spread_pct = (ask - bid) / ((ask + bid) / 2) * 100
        symbol = contract.get("underlyingSymbol") or venue_symbol(name)
        if not symbol:
            continue
        legs[str(symbol).upper()] = {
            "exchange": "hibachi",
            "apr": interval_apr(funding, 1),
            "oi": volume,  # pas d'OI dans prices/stats
            "volume": volume,
            "price": price,
            "cost_pct": 2 * taker * 100 + spread_pct,
        }
    return legs


def fetch_carbon_tradfi():
    """Carbon TradFi (solver NOXRWA) : actions, FX, commodités."""
    return fetch_carbon(solver="NOXRWA", exchange_name="carbon_tradfi")


def fetch_gtrade():
    """gTrade / Gains Network (Arbitrum). Dual-rate horaire, comme Carbon."""
    variables = as_dict(get_json(
        "gTrade", "https://backend-arbitrum.gains.trade/trading-variables/all"
    ))
    pairs = variables.get("pairs")
    if not isinstance(pairs, list):
        raise FatalError("gTrade : format inattendu")

    legs = {}
    # Les groupes 10+ sont surtout des RWA illiquides ; on prend les ~120 premiers pairs.
    for pair_index, pair in enumerate(pairs[:40]):
        pair = as_dict(pair)
        base = pair.get("from")
        if not isinstance(base, str):
            continue
        try:
            payload = as_dict(get_json(
                "gTrade",
                f"https://backend-global.gains.trade/api/holding-rates/3/{pair_index}",
                params={"chainId": 42161},
            ))
        except (FatalError, TemporaryError):
            continue
        history = payload.get("holdingRates")
        if not isinstance(history, list) or not history:
            continue
        last = as_dict(history[-1])
        rate_long = to_number(last.get("fundingFeeLongHourlyRate"))
        rate_short = to_number(last.get("fundingFeeShortHourlyRate"))
        if rate_long is None or rate_short is None:
            continue
        symbol, _ = lot_adjust(base.upper(), None)
        if not symbol:
            continue
        spread_p = to_number(pair.get("spreadP")) or 0
        # spreadP est en 1e10 (100000000 = 1 %)
        spread_pct = spread_p / 1e10 * 100 if spread_p > 100 else spread_p
        apr_long = interval_apr(rate_long, 1)
        apr_short = interval_apr(rate_short, 1)
        legs[symbol] = {
            "exchange": "gtrade",
            "apr": (apr_long + apr_short) / 2,
            "apr_long": apr_long,
            "apr_short": apr_short,
            "oi": 1_000_000,   # OI gTrade peu fiable dans oiWindows ; seuil passé avec prudence
            "volume": None,
            "price": 1.0,
            "skip_price": True,  # pas de mark public fiable
            "cost_pct": max(spread_pct, 0.08),
        }
    return legs


def fetch_grvt():
    """Perps GRVT. funding_rate en points de % sur l'intervalle (souvent 8 h)."""
    instruments = as_dict(get_json(
        "GRVT",
        "https://market-data.grvt.io/full/v1/all_instruments",
        payload={"is_active": True, "kinds": ["PERPETUAL"]},
    )).get("result")
    if not isinstance(instruments, list):
        raise FatalError("GRVT : format inattendu")
    legs = {}
    for item in instruments[:50]:
        item = as_dict(item)
        name = item.get("instrument")
        if not isinstance(name, str) or not name.endswith("_Perp"):
            continue
        try:
            ticker = as_dict(as_dict(get_json(
                "GRVT",
                "https://market-data.grvt.io/full/v1/ticker",
                payload={"instrument": name},
            )).get("result"))
        except (FatalError, TemporaryError):
            continue
        raw_rate = to_number(ticker.get("funding_rate"))
        price = to_number(ticker.get("mark_price"))
        oi_base = to_number(ticker.get("open_interest"))
        vol_q = (to_number(ticker.get("buy_volume_24h_q")) or 0) + (to_number(ticker.get("sell_volume_24h_q")) or 0)
        if None in (raw_rate, price, oi_base) or price <= 0:
            continue
        # 0.01 publié = 0.01 % par intervalle (baseline 8 h ~ 10.95 % APR)
        decimal_rate = raw_rate / 100.0
        symbol = venue_symbol(name.replace("_Perp", ""))
        if not symbol:
            continue
        bid, ask = to_number(ticker.get("best_bid_price")), to_number(ticker.get("best_ask_price"))
        spread_pct = 0.0
        if bid and ask and bid > 0 and ask >= bid:
            spread_pct = (ask - bid) / ((ask + bid) / 2) * 100
        legs[symbol] = {
            "exchange": "grvt",
            "apr": interval_apr(decimal_rate, 8),
            "oi": oi_base * price,
            "volume": vol_q if vol_q else None,
            "price": price,
            "cost_pct": 2 * 0.03 + spread_pct,
        }
    return legs


def fetch_qfex():
    """QFEX : catalogue REST + dernier taux horaire. Hors séance le taux est souvent 0."""
    ref = as_dict(get_json("QFEX", "https://api.qfex.com/refdata"))
    rows = ref.get("data")
    if not isinstance(rows, list):
        raise FatalError("QFEX : format inattendu")
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    start = (now - timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    legs = {}
    for row in rows:
        if len(legs) >= 30:
            break
        row = as_dict(row)
        name = row.get("symbol")
        price = to_number(row.get("underlier_price"))
        if not isinstance(name, str) or price is None or price <= 0:
            continue
        try:
            hist = as_dict(get_json(
                "QFEX",
                f"https://api.qfex.com/funding/{name}",
                params={"intervalMinutes": 60, "fromISO": start, "toISO": end},
            ))
        except (FatalError, TemporaryError):
            continue
        points = hist.get("data")
        if not isinstance(points, list) or not points:
            continue
        rate = to_number(as_dict(points[-1]).get("rate"))
        if rate is None:
            continue
        symbol = venue_symbol(name)
        if not symbol:
            continue
        legs[symbol] = {
            "exchange": "qfex",
            "apr": interval_apr(rate, 1),
            "oi": 1_000_000,
            "volume": None,
            "price": price,
            "cost_pct": 2 * 0.10,  # taker actions palier de base
        }
    return legs


def fetch_polymarket():
    """Polymarket Perps. Funding horaire + index par base_asset."""
    instruments = get_json("Polymarket", "https://api.perpetuals.polymarket.com/v1/info/instruments")
    if not isinstance(instruments, list):
        raise FatalError("Polymarket : format inattendu")
    legs = {}
    for item in instruments[:40]:
        item = as_dict(item)
        if item.get("instrument_type") != "perpetual":
            continue
        instrument_id = item.get("instrument_id")
        base = item.get("base_asset")
        if instrument_id is None or not isinstance(base, str):
            continue
        try:
            funding = as_dict(get_json(
                "Polymarket",
                "https://api.perpetuals.polymarket.com/v1/info/funding",
                params={"instrument_id": instrument_id},
            ))
            index = as_dict(get_json(
                "Polymarket",
                "https://api.perpetuals.polymarket.com/v1/info/index",
                params={"asset": base},
            ))
        except (FatalError, TemporaryError):
            continue
        points = funding.get("data")
        if not isinstance(points, list) or not points:
            continue
        rate = to_number(as_dict(points[0]).get("funding_rate"))
        price = to_number(index.get("index_price"))
        if rate is None or price is None or price <= 0:
            continue
        symbol = venue_symbol(item.get("symbol") or base)
        if not symbol:
            continue
        cap = to_number(item.get("max_market_notional")) or 1_000_000
        legs[symbol] = {
            "exchange": "polymarket",
            "apr": interval_apr(rate, 1),
            "oi": cap,
            "volume": None,
            "price": price,
            "cost_pct": 2 * 0.03,
        }
    return legs


def breakeven_hours(spread_apr, cost_pct):
    """Heures de funding nécessaires pour rembourser les coûts, si le taux ne bouge pas."""
    hourly_gain_pct = spread_apr / (365 * 24)
    if hourly_gain_pct <= 0:
        return math.inf
    return cost_pct / hourly_gain_pct


def best_pair(symbol, legs):
    """Meilleure combinaison LONG sur un DEX / SHORT sur un autre, pour un token."""
    best = None
    # permutations(legs, 2) donne chaque couple (jambe long, jambe short), dans les deux sens
    for long_leg, short_leg in itertools.permutations(legs, 2):
        # Funding positif = les longs paient les shorts. Ton gain net annualisé
        # vaut donc : APR encaissé par le short - APR payé par le long.
        # Sur Carbon on prend le taux du côté réellement utilisé (dual-rate).
        long_apr = side_apr(long_leg, "long")
        short_apr = side_apr(short_leg, "short")
        spread = short_apr - long_apr
        if spread < MIN_SPREAD_APR or (best and spread <= best["spread"]):
            continue
        if long_leg.get("skip_price") or short_leg.get("skip_price"):
            price_gap = 0.0
        else:
            lower_price = min(long_leg["price"], short_leg["price"])
            price_gap = abs(long_leg["price"] - short_leg["price"]) / lower_price * 100
        if price_gap > MAX_PRICE_GAP_PCT:
            # Gros écart de prix = souvent deux tokens différents sous le même ticker,
            # ou un prix figé sur un marché qui ne trade presque pas
            continue
        cost = long_leg["cost_pct"] + short_leg["cost_pct"]
        hours = breakeven_hours(spread, cost)
        if hours > MAX_BREAKEVEN_HOURS:
            continue
        best = {
            "symbol": symbol,
            "long": {**long_leg, "apr": long_apr},
            "short": {**short_leg, "apr": short_apr},
            "spread": spread,
            "price_gap": price_gap,
            "cost": cost,
            "hours": hours,
        }
    return best


def is_liquid(leg):
    """OI obligatoire ; volume seulement s'il est connu (Carbon ne le publie pas)."""
    if leg["oi"] < MIN_OPEN_INTEREST:
        return False
    if leg.get("volume") is None:
        return True
    return leg["volume"] >= MIN_VOLUME_24H


def find_opportunities(*sources):
    """Croise les DEX et renvoie les opportunités, meilleures d'abord."""
    legs_by_symbol = {}
    for legs in sources:
        for symbol, leg in legs.items():
            # setdefault crée la liste vide au premier passage, puis la réutilise
            legs_by_symbol.setdefault(symbol, []).append(leg)

    opportunities = []
    for symbol, legs in legs_by_symbol.items():
        liquid = [leg for leg in legs if is_liquid(leg)]
        if len(liquid) < 2:
            continue  # absent d'un des DEX, ou trop peu liquide d'un côté
        opportunity = best_pair(symbol, liquid)
        if opportunity:
            opportunities.append(opportunity)
    opportunities.sort(key=lambda opp: opp["spread"], reverse=True)
    return opportunities


def fmt_usd(amount):
    """Rend un montant lisible : 2400000 -> '2.4 M$'. None -> 'n/a'."""
    if amount is None:
        return "n/a"
    if amount >= 1e9:
        return f"{amount / 1e9:.1f} Md$"
    if amount >= 1e6:
        return f"{amount / 1e6:.1f} M$"
    return f"{amount / 1e3:.0f} k$"


def format_opportunity(rank, opp):
    """Texte d'une opportunité (on le réutilisera tel quel pour Telegram)."""
    long_leg, short_leg = opp["long"], opp["short"]
    daily_gain = 1000 * opp["spread"] / 100 / 365  # $ par jour pour 1 000 $ par jambe
    volumes = [leg["volume"] for leg in (long_leg, short_leg) if leg.get("volume") is not None]
    vol_label = fmt_usd(min(volumes)) if volumes else "n/a"
    return (
        f"{rank}. {opp['symbol']} : écart {opp['spread']:.1f} % APR "
        f"(~{daily_gain:.2f} $/jour pour 1 000 $ par jambe)\n"
        f"   LONG  {long_leg['exchange']} ({long_leg['apr']:+.1f} %)\n"
        f"   SHORT {short_leg['exchange']} ({short_leg['apr']:+.1f} %)\n"
        f"   OI/cap min {fmt_usd(min(long_leg['oi'], short_leg['oi']))} | "
        f"vol min {vol_label} | "
        f"écart prix {opp['price_gap']:.2f} %\n"
        f"   Coût aller-retour ~{opp['cost']:.2f} % | remboursé en ~{opp['hours']:.0f} h si le taux tient"
    )


def main():
    # Évite un plantage si un ticker contient des caractères que ton terminal
    # ne sait pas afficher (certains tokens ont un nom en chinois)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")

    loaders = (
        ("Variational", fetch_variational),
        ("Hyperliquid", fetch_hyperliquid),
        ("Carbon", fetch_carbon),
        ("Extended", fetch_extended),
        ("Lighter", fetch_lighter),
        ("Paradex", fetch_paradex),
        ("Orderly", fetch_orderly),
        ("Backpack", fetch_backpack),
        ("Aster", fetch_aster),
        ("Pacifica", fetch_pacifica),
        ("Hibachi", fetch_hibachi),
        ("CarbonTradFi", fetch_carbon_tradfi),
        ("gTrade", fetch_gtrade),
        ("GRVT", fetch_grvt),
        ("QFEX", fetch_qfex),
        ("Polymarket", fetch_polymarket),
    )
    names, sources = [], []
    for name, loader in loaders:
        try:
            legs = loader()
        except (FatalError, TemporaryError) as error:
            print(f"AVERTISSEMENT {name} : {error}")
            legs = {}
        names.append(name)
        sources.append(legs)
    if not any(sources):
        print("ERREUR : aucune source n'a répondu.")
        sys.exit(1)
    all_symbols = set().union(*sources)
    multi = sum(1 for symbol in all_symbols
                if sum(symbol in source for source in sources) >= 2)
    opportunities = find_opportunities(*sources)
    counts = " | ".join(f"{name} : {len(source)}" for name, source in zip(names, sources))
    print(f"{counts} | sur ≥2 DEX : {multi} | retenus : {len(opportunities)}\n")
    if multi == 0:
        print("Aucun token en commun : le format d'une des API a sans doute changé.")
        return
    if not opportunities:
        print("Aucune opportunité : baisse les seuils en haut du fichier pour en voir plus.")
        return
    for rank, opportunity in enumerate(opportunities[:TOP_N], start=1):
        print(format_opportunity(rank, opportunity) + "\n")


# Ce bloc ne s'exécute que si tu lances ce fichier directement,
# pas quand un autre script l'importe (ce que fera la v2 avec Telegram).
if __name__ == "__main__":
    main()
