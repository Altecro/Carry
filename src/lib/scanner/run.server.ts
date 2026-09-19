import type { Leg, ScanPayload, VenueStatus } from "./types";
import { FatalError, TemporaryError, VENUE_LOADERS } from "./venues.server";
import { withDeadline } from "./http.server";

const CACHE_TTL_MS = 45_000;
const VENUE_DEADLINE_MS = 10_000;
const CANARY_SYMBOLS = ["BTC", "ETH"] as const;

type Cache = { at: number; payload: ScanPayload };
let cache: Cache | null = null;
let lastRatioReport = new Map<string, { n: number; ratio: number | null }>();
let lastTradfiMedian: number | null = null;

export function lastCanaryReport() {
  return { ratios: lastRatioReport, tradfiMedian: lastTradfiMedian };
}

function mergeLegs(
  target: Record<string, Leg[]>,
  source: Record<string, Leg>,
) {
  for (const [symbol, leg] of Object.entries(source)) {
    const list = target[symbol] ?? (target[symbol] = []);
    list.push(leg);
  }
}

/** APR comparable (positif = les longs paient). Carbon publie le PnL par côté. */
export function standardApr(leg: Leg): number {
  if (leg.pnlBySide && leg.aprLong != null && leg.aprShort != null) {
    return (leg.aprShort - leg.aprLong) / 2;
  }
  return leg.apr;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function fmtAprPts(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} %`;
}

function fmtRatio(value: number): string {
  const digits = Math.abs(value) >= 10 ? 1 : 2;
  return value.toFixed(digits);
}

function excludeVenues(legs: Record<string, Leg[]>, suspects: Set<string>) {
  if (!suspects.size) return;
  for (const symbol of Object.keys(legs)) {
    const kept = legs[symbol]!.filter((leg) => !suspects.has(leg.exchange));
    if (kept.length) legs[symbol] = kept;
    else delete legs[symbol];
  }
}

/**
 * Canari BTC/ETH : un DEX dont l’APR s’écarte trop de la médiane
 * (intervalle ou unité de funding probablement faux) est retiré des opportunités.
 */
function applyBtcEthCanary(
  legs: Record<string, Leg[]>,
  venues: VenueStatus[],
): void {
  const listed = new Set(venues.map((venue) => venue.id));
  const present = new Set<string>();
  const flags = new Map<string, string>();

  for (const symbol of CANARY_SYMBOLS) {
    const sample = (legs[symbol] ?? []).filter((leg) => listed.has(leg.exchange));
    for (const leg of sample) present.add(leg.exchange);
    if (sample.length < 3) continue;
    const values = sample.map((leg) => standardApr(leg));
    const med = median(values);
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
      venue.error =
        `APR incohérent avec BTC/ETH des autres DEX : intervalle ou unité de funding à vérifier (${flags.get(venue.id)})`;
      continue;
    }
    // TradFi a son propre canari ; pas de BTC/ETH crypto.
    if (venue.id === "carbon_tradfi") continue;
    if (venue.count > 0 && !present.has(venue.id)) {
      venue.error = "Pas de BTC/ETH : APR non contrôlé";
    }
  }

  excludeVenues(legs, suspects);
}

/**
 * Canari croisé : médiane du ratio APR(DEX) / médiane des autres DEX,
 * uniquement sur les paires partagées avec ≥ 2 autres et |médiane| ≥ 10 %.
 * Un facteur hors [0,67 ; 1,5] (ou un signe inverse) trahit un intervalle / une unité faux.
 */
function applyRatioCanary(
  legs: Record<string, Leg[]>,
  venues: VenueStatus[],
): Map<string, { n: number; ratio: number | null }> {
  const report = new Map<string, { n: number; ratio: number | null }>();
  const suspects = new Set<string>();

  for (const venue of venues) {
    if (venue.id === "carbon_tradfi") continue;
    if (venue.error?.startsWith("APR incohérent")) {
      report.set(venue.id, { n: 0, ratio: null });
      continue;
    }

    const ratios: number[] = [];
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
      report.set(venue.id, { n: ratios.length, ratio: null });
      if (
        venue.count > 0 &&
        (!venue.error || venue.error.startsWith("Pas de BTC/ETH"))
      ) {
        venue.error = "Écart systématique : non contrôlable";
        suspects.add(venue.id);
      }
      continue;
    }

    const medRatio = median(ratios);
    report.set(venue.id, { n: ratios.length, ratio: medRatio });
    if (medRatio > 1.5 || medRatio < 0.67) {
      suspects.add(venue.id);
      venue.error =
        `Écart systématique ×${fmtRatio(medRatio)} avec les autres DEX sur ${ratios.length} paires : intervalle, unité ou signe du funding à vérifier`;
    }
  }

  excludeVenues(legs, suspects);
  return report;
}

/**
 * Carbon TradFi : le funding overnight reste en général entre quelques % et 20 % / an.
 * Une médiane hors 0,5–25 % pointe un intervalle (1 h / 8 h au lieu de 24 h) ou une unité faux.
 */
function applyTradfiCanary(
  legs: Record<string, Leg[]>,
  venues: VenueStatus[],
): number | null {
  const venue = venues.find((row) => row.id === "carbon_tradfi");
  if (!venue || venue.count < 1) return null;
  const magnitudes: number[] = [];
  for (const list of Object.values(legs)) {
    for (const leg of list) {
      if (leg.exchange !== "carbon_tradfi") continue;
      const mag =
        leg.aprLong != null && leg.aprShort != null
          ? Math.max(Math.abs(leg.aprLong), Math.abs(leg.aprShort))
          : Math.abs(leg.apr);
      if (mag === 0) continue;
      magnitudes.push(mag);
    }
  }
  if (magnitudes.length < 5) {
    venue.error = "Écart systématique : non contrôlable";
    excludeVenues(legs, new Set(["carbon_tradfi"]));
    return magnitudes.length ? median(magnitudes) : null;
  }
  const med = median(magnitudes);
  if (med < 0.5 || med > 25) {
    venue.error =
      `Écart systématique : médiane |APR| ${fmtAprPts(med).replace("+", "")} hors plage 0,5–25 % (funding TradFi)`;
    excludeVenues(legs, new Set(["carbon_tradfi"]));
  }
  return med;
}

async function loadVenue(
  loader: (typeof VENUE_LOADERS)[number],
): Promise<{ legs: Record<string, Leg>; status: VenueStatus }> {
  const started = Date.now();
  try {
    const legs = await withDeadline(VENUE_DEADLINE_MS, (signal) =>
      loader.load(signal),
    );
    return {
      legs,
      status: {
        id: loader.id,
        label: loader.label,
        count: Object.keys(legs).length,
        ms: Date.now() - started,
      },
    };
  } catch (error) {
    const message =
      error instanceof FatalError || error instanceof TemporaryError
        ? error.message
        : error instanceof Error
          ? error.message
          : "échec";
    return {
      legs: {},
      status: {
        id: loader.id,
        label: loader.label,
        count: 0,
        error: message,
        ms: Date.now() - started,
      },
    };
  }
}

export async function executeScan(force: boolean): Promise<ScanPayload> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { ...cache.payload, cached: true };
  }

  const started = Date.now();
  const results = await Promise.all(VENUE_LOADERS.map(loadVenue));
  const legs: Record<string, Leg[]> = {};
  const venues: VenueStatus[] = [];
  for (const result of results) {
    mergeLegs(legs, result.legs);
    venues.push(result.status);
  }

  applyBtcEthCanary(legs, venues);
  lastRatioReport = applyRatioCanary(legs, venues);
  lastTradfiMedian = applyTradfiCanary(legs, venues);

  const payload: ScanPayload = {
    scannedAt: Date.now(),
    durationMs: Date.now() - started,
    cached: false,
    venues,
    legs,
  };
  cache = { at: Date.now(), payload };
  return payload;
}
