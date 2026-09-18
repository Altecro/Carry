import type { Leg, ScanPayload, VenueStatus } from "./types";
import { FatalError, TemporaryError, VENUE_LOADERS } from "./venues.server";
import { withDeadline } from "./http.server";

const CACHE_TTL_MS = 45_000;
const VENUE_DEADLINE_MS = 10_000;

type Cache = { at: number; payload: ScanPayload };
let cache: Cache | null = null;

function mergeLegs(
  target: Record<string, Leg[]>,
  source: Record<string, Leg>,
) {
  for (const [symbol, leg] of Object.entries(source)) {
    const list = target[symbol] ?? (target[symbol] = []);
    list.push(leg);
  }
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
