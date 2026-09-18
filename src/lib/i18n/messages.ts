export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
};

const fr = {
  tagline: "find your funding",
  description:
    "Carry — find your funding. LONG un DEX, SHORT un autre. Lecture seule.",
  language: "Langue",
  refresh: "Actualiser",
  scanning: "Scan…",
  thresholds: "Seuils",
  close: "Fermer",
  presets: "Presets",
  presetLoose: "Souple",
  presetClassic: "Classique",
  presetTight: "Serré",
  presetUltra: "Ultra",
  applyPreset: "Valider le preset",
  ultraWarning:
    "Carnets < 50 k$ d’OI. Slippage, fills partiels, taux parfois fantômes. Taille mini.",
  minSpread: "Écart min",
  minOi: "Open interest min",
  minVolume: "Volume 24 h min",
  maxPriceGap: "Écart de prix max",
  maxBreakeven: "Remboursement max",
  notional: "Notionnel par jambe",
  venues: "Places",
  reset: "Réinitialiser",
  statVenues: "Places",
  statOverlap: "Tokens ≥ 2 DEX",
  statKept: "Retenus",
  lastScan: "Dernier scan",
  cache: "cache",
  filterTicker: "Filtrer un ticker…",
  disclaimer:
    "Lecture seule. Les API publiques des DEX sont croisées côté serveur — aucun ordre n’est envoyé. Gain estimé pour {notional} par jambe.",
  loadingBooks: "Lecture des carnets publics…",
  scanError: "Impossible de lire les marchés. Réessaie dans un instant.",
  showMore: "Voir les {count} autres",
  rescan: "Nouvelle lecture en cours…",
  emptyTitle: "Aucune opportunité",
  emptyHasMulti:
    "Change de preset ou baisse l’écart min. Souple = liquidité, Serré / Ultra = gros APR (carnets plus fins).",
  emptyNoMulti:
    "Aucun token en commun pour l’instant — une API a peut-être changé de format, ou le scan est encore incomplet.",
  topSpreads: "Top écarts",
  spread: "Écart",
  copy: "Copier",
  openVenue: "Ouvrir {venue}",
  perDay: "/ jour",
  long: "LONG",
  short: "SHORT",
  oi: "OI",
  oiMin: "OI min",
  vol: "vol",
  priceGapShort: "prix",
  costShort: "coût",
  breakevenShort: "seuil",
  na: "n/a",
  minutes: "min",
  accessCode: "code {code}",
  fundingInterval: "Paiement toutes les {hours}",
  longPrice: "Prix LONG",
  shortPrice: "Prix SHORT",
  longFees: "Frais LONG",
  shortFees: "Frais SHORT",
  cardDetail:
    "Pour {notional} par jambe, le carry brut est d’environ {daily} par jour tant que les taux tiennent. Lecture seule — aucun ordre n’est passé.",
  markets: "{count} marchés",
  hoursUnit: "h",
  copyBlurb: `{rank}. {symbol} : écart {spread} % APR (~{daily} $/jour pour {notional} par jambe)
   LONG  {longEx} ({longApr}){longIv}
   SHORT {shortEx} ({shortApr}){shortIv}
   OI/cap min {oi} | vol min {volume} | écart prix {priceGap} %
   Coût aller-retour ~{cost} % | remboursé en ~{hours} h si le taux tient`,
  billion: "Md$",
  million: "M$",
  thousand: "k$",
  dayShort: "j",
};

const en: Record<keyof typeof fr, string> = {
  tagline: "find your funding",
  description:
    "Carry — find your funding. LONG one DEX, SHORT another. Read-only.",
  language: "Language",
  refresh: "Refresh",
  scanning: "Scan…",
  thresholds: "Thresholds",
  close: "Close",
  presets: "Presets",
  presetLoose: "Loose",
  presetClassic: "Classic",
  presetTight: "Tight",
  presetUltra: "Ultra",
  applyPreset: "Apply preset",
  ultraWarning:
    "Books under $50k OI. Slippage, partial fills, sometimes ghost rates. Tiny size.",
  minSpread: "Min spread",
  minOi: "Min open interest",
  minVolume: "Min 24h volume",
  maxPriceGap: "Max price gap",
  maxBreakeven: "Max breakeven",
  notional: "Notional per leg",
  venues: "Venues",
  reset: "Reset",
  statVenues: "Venues",
  statOverlap: "Tokens on ≥2 DEXes",
  statKept: "Kept",
  lastScan: "Last scan",
  cache: "cache",
  filterTicker: "Filter a ticker…",
  disclaimer:
    "Read-only. Public DEX APIs are crossed on the server — no orders are sent. Estimated gain for {notional} per leg.",
  loadingBooks: "Reading public order books…",
  scanError: "Could not read markets. Try again in a moment.",
  showMore: "Show {count} more",
  rescan: "Refreshing markets…",
  emptyTitle: "No opportunities",
  emptyHasMulti:
    "Switch preset or lower the min spread. Loose = liquidity, Tight / Ultra = fat APRs (thinner books).",
  emptyNoMulti:
    "No overlapping tokens right now — an API may have changed, or the scan is still incomplete.",
  topSpreads: "Top spreads",
  spread: "Spread",
  copy: "Copy",
  openVenue: "Open {venue}",
  perDay: "/ day",
  long: "LONG",
  short: "SHORT",
  oi: "OI",
  oiMin: "min OI",
  vol: "vol",
  priceGapShort: "gap",
  costShort: "cost",
  breakevenShort: "payback",
  na: "n/a",
  minutes: "min",
  accessCode: "code {code}",
  fundingInterval: "Paid every {hours}",
  longPrice: "LONG price",
  shortPrice: "SHORT price",
  longFees: "LONG fees",
  shortFees: "SHORT fees",
  cardDetail:
    "For {notional} per leg, gross carry is about {daily} per day while rates hold. Read-only — no orders are sent.",
  markets: "{count} markets",
  hoursUnit: "h",
  copyBlurb: `{rank}. {symbol}: spread {spread}% APR (~{daily} $/day for {notional} per leg)
   LONG  {longEx} ({longApr}){longIv}
   SHORT {shortEx} ({shortApr}){shortIv}
   min OI/cap {oi} | min vol {volume} | price gap {priceGap}%
   Round-trip cost ~{cost}% | paid back in ~{hours} h if the rate holds`,
  billion: "B$",
  million: "M$",
  thousand: "k$",
  dayShort: "d",
};

export const messages = { fr, en } as const;
export type MessageKey = keyof typeof fr;
