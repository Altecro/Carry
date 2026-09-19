export type Leg = {
  exchange: string;
  apr: number;
  aprLong?: number;
  aprShort?: number;
  oi: number | null;
  volume: number | null;
  price: number;
  skipPrice?: boolean;
  costPct: number;
  /** Intervalle de paiement du funding, en heures, s’il est connu. */
  fundingHours?: number;
  /** Carbon : aprLong / aprShort sont le PnL de chaque côté (positif = ce côté est payé). */
  pnlBySide?: boolean;
  /** Carbon : `oi` est un plafond de notionnel, pas un open interest. */
  oiIsCap?: boolean;
};

export type Opportunity = {
  symbol: string;
  long: Leg;
  short: Leg;
  spread: number;
  priceGap: number;
  cost: number;
  hours: number;
};

export type PairRef = {
  symbol: string;
  long: string;
  short: string;
};

export type PairHistory = {
  symbol: string;
  long: string;
  short: string;
  avg24h: number | null;
  avg7d: number | null;
  hold24h: number | null;
  hoursCovered: number | null;
  series: { t: number; spread: number }[];
};

export type Filters = {
  minSpreadApr: number;
  minOpenInterest: number;
  minVolume24h: number;
  maxPriceGapPct: number;
  maxBreakevenHours: number;
  notional: number;
  /** Levier par jambe (1–10), pour le calculateur de capital. */
  leverage: number;
  disabledVenues: string[];
  query: string;
};

export type VenueStatus = {
  id: string;
  label: string;
  count: number;
  error?: string;
  ms: number;
};

export type ScanPayload = {
  scannedAt: number;
  durationMs: number;
  cached: boolean;
  venues: VenueStatus[];
  legs: Record<string, Leg[]>;
};

export const VENUES = [
  { id: "variational", label: "Variational" },
  { id: "hyperliquid", label: "Hyperliquid" },
  { id: "carbon", label: "Carbon" },
  { id: "extended", label: "Extended" },
  { id: "lighter", label: "Lighter" },
  { id: "paradex", label: "Paradex" },
  { id: "orderly", label: "WOOFi" },
  { id: "backpack", label: "Backpack" },
  { id: "aster", label: "Aster" },
  { id: "pacifica", label: "Pacifica" },
  { id: "hibachi", label: "Hibachi" },
  { id: "carbon_tradfi", label: "Carbon TradFi" },
  { id: "grvt", label: "GRVT" },
  { id: "polymarket", label: "Polymarket" },
  { id: "arcus", label: "Arcus" },
  { id: "popdex", label: "PopDEX" },
] as const;

export const VENUE_LABEL: Record<string, string> = Object.fromEntries(
  VENUES.map((v) => [v.id, v.label]),
);

export const DEFAULT_FILTERS: Filters = {
  minSpreadApr: 20,
  minOpenInterest: 300_000,
  minVolume24h: 200_000,
  maxPriceGapPct: 1,
  maxBreakevenHours: 72,
  notional: 1000,
  leverage: 2,
  disabledVenues: [],
  query: "",
};

export const FILTER_PRESETS = {
  souple: {
    minSpreadApr: 8,
    minOpenInterest: 500_000,
    minVolume24h: 300_000,
    maxPriceGapPct: 2,
    maxBreakevenHours: 120,
  },
  classic: {
    minSpreadApr: 20,
    minOpenInterest: 300_000,
    minVolume24h: 200_000,
    maxPriceGapPct: 1,
    maxBreakevenHours: 72,
  },
  strict: {
    minSpreadApr: 45,
    minOpenInterest: 100_000,
    minVolume24h: 50_000,
    maxPriceGapPct: 0.8,
    maxBreakevenHours: 48,
  },
  ultra: {
    minSpreadApr: 50,
    minOpenInterest: 25_000,
    minVolume24h: 25_000,
    maxPriceGapPct: 1.2,
    maxBreakevenHours: 36,
  },
} as const;

export type PresetId = keyof typeof FILTER_PRESETS;
