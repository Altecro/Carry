import { getSql } from "@/lib/db";
import type { Leg, PairHistory, PairRef } from "./types";

const SLOT_MS = 30 * 60 * 1000;
const CARBON_WINDOW_MS = 24 * 60 * 60 * 1000;

export function currentSlot(): number {
  return Math.floor(Date.now() / SLOT_MS);
}

function toTime(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNum(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Charge les observations Carbon des 24 dernières heures dans la mémoire process. */
export async function hydrateCarbonIntervals(
  memory: Map<string, Partial<Record<1 | 4 | 8, number>>>,
): Promise<boolean> {
  try {
    const sql = await getSql();
    const rows = await sql.query<{
      market: string;
      hours: number;
      seen_at: unknown;
    }>(
      `select market, hours, seen_at from carbon_intervals
       where seen_at > now() - interval '24 hours'`,
    );
    const now = Date.now();
    for (const row of rows) {
      const hours = row.hours as 1 | 4 | 8;
      if (hours !== 1 && hours !== 4 && hours !== 8) continue;
      const seen = toTime(row.seen_at);
      if (!seen || now - seen > CARBON_WINDOW_MS) continue;
      const cur = { ...(memory.get(row.market) ?? {}) };
      const prev = cur[hours];
      if (prev == null || seen > prev) cur[hours] = seen;
      memory.set(row.market, cur);
    }
    return true;
  } catch {
    return false;
  }
}

/** Enregistre en une requête les paliers observés pendant ce scan. */
export async function persistCarbonIntervals(
  observed: { market: string; hours: 1 | 4 | 8 }[],
): Promise<void> {
  if (!observed.length) return;
  const sql = await getSql();
  const markets: string[] = [];
  const hours: number[] = [];
  const seen: string[] = [];
  const now = new Date().toISOString();
  for (const row of observed) {
    markets.push(row.market);
    hours.push(row.hours);
    seen.push(now);
  }
  await sql.query(
    `insert into carbon_intervals (market, hours, seen_at)
     select * from unnest($1::text[], $2::int[], $3::timestamptz[])
     on conflict (market, hours) do update set seen_at = excluded.seen_at`,
    [markets, hours, seen],
  );
}

export async function reserveSnapshotSlot(
  slot: number,
): Promise<number | null> {
  const sql = await getSql();
  const rows = await sql.query<{ id: number }>(
    `insert into snapshots (slot) values ($1)
     on conflict (slot) do nothing
     returning id`,
    [slot],
  );
  return rows[0]?.id ?? null;
}

export async function deleteSnapshot(id: number): Promise<void> {
  const sql = await getSql();
  await sql.query(`delete from snapshots where id = $1`, [id]);
}

export async function pruneOldSnapshots(): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `delete from snapshots where taken_at < now() - interval '7 days'`,
  );
}

export async function insertFundingPoints(
  snapshotId: number,
  points: {
    symbol: string;
    venue: string;
    longApr: number;
    shortApr: number;
  }[],
): Promise<number> {
  if (!points.length) return 0;
  const sql = await getSql();
  const chunk = 400;
  let written = 0;
  for (let offset = 0; offset < points.length; offset += chunk) {
    const slice = points.slice(offset, offset + chunk);
    const ids: number[] = [];
    const symbols: string[] = [];
    const venues: string[] = [];
    const longs: number[] = [];
    const shorts: number[] = [];
    for (const row of slice) {
      ids.push(snapshotId);
      symbols.push(row.symbol);
      venues.push(row.venue);
      longs.push(row.longApr);
      shorts.push(row.shortApr);
    }
    await sql.query(
      `insert into funding_points (snapshot_id, symbol, venue, long_apr, short_apr)
       select * from unnest($1::int[], $2::text[], $3::text[], $4::real[], $5::real[])`,
      [ids, symbols, venues, longs, shorts],
    );
    written += slice.length;
  }
  return written;
}

export async function insertVenueChecks(
  snapshotId: number,
  checks: {
    venue: string;
    ratio: number | null;
    n: number | null;
    status: string;
  }[],
): Promise<void> {
  if (!checks.length) return;
  const sql = await getSql();
  const ids: number[] = [];
  const venues: string[] = [];
  const ratios: (number | null)[] = [];
  const ns: (number | null)[] = [];
  const statuses: string[] = [];
  for (const row of checks) {
    ids.push(snapshotId);
    venues.push(row.venue);
    ratios.push(row.ratio);
    ns.push(row.n);
    statuses.push(row.status);
  }
  await sql.query(
    `insert into venue_checks (snapshot_id, venue, ratio, n, status)
     select * from unnest($1::int[], $2::text[], $3::real[], $4::int[], $5::text[])`,
    [ids, venues, ratios, ns, statuses],
  );
}

export function collectFundingPoints(
  legs: Record<string, Leg[]>,
  sideApr: (leg: Leg, side: "long" | "short") => number,
): {
  symbol: string;
  venue: string;
  longApr: number;
  shortApr: number;
}[] {
  const points: {
    symbol: string;
    venue: string;
    longApr: number;
    shortApr: number;
  }[] = [];
  for (const [symbol, list] of Object.entries(legs)) {
    if (list.length < 2) continue;
    for (const leg of list) {
      points.push({
        symbol,
        venue: leg.exchange,
        longApr: sideApr(leg, "long"),
        shortApr: sideApr(leg, "short"),
      });
    }
  }
  return points;
}

type HistoryRow = {
  symbol: string;
  long_venue: string;
  short_venue: string;
  avg_24h: unknown;
  avg_7d: unknown;
  hold_24h: unknown;
  hours_covered: unknown;
  series: unknown;
};

/** Une requête : moyennes, tenue, durée et série 7 j pour les paires affichées. */
export async function loadPairHistory(
  pairs: PairRef[],
  minSpreadApr: number,
): Promise<PairHistory[]> {
  if (!pairs.length) return [];
  const sql = await getSql();
  const symbols = pairs.map((p) => p.symbol);
  const longs = pairs.map((p) => p.long);
  const shorts = pairs.map((p) => p.short);
  const rows = await sql.query<HistoryRow>(
    `with pairs (symbol, long_venue, short_venue) as (
       select * from unnest($1::text[], $2::text[], $3::text[])
     ),
     legs as (
       select
         p.symbol,
         p.long_venue,
         p.short_venue,
         s.taken_at,
         (short_leg.short_apr - long_leg.long_apr)::float8 as spread
       from pairs p
       inner join funding_points long_leg
         on long_leg.symbol = p.symbol and long_leg.venue = p.long_venue
       inner join funding_points short_leg
         on short_leg.snapshot_id = long_leg.snapshot_id
        and short_leg.symbol = p.symbol
        and short_leg.venue = p.short_venue
       inner join snapshots s on s.id = long_leg.snapshot_id
       where s.taken_at >= now() - interval '7 days'
     )
     select
       symbol,
       long_venue,
       short_venue,
       avg(spread) filter (where taken_at >= now() - interval '24 hours') as avg_24h,
       avg(spread) as avg_7d,
       count(*) filter (
         where taken_at >= now() - interval '24 hours' and spread >= $4
       )::float8
         / nullif(count(*) filter (where taken_at >= now() - interval '24 hours'), 0)
         as hold_24h,
       extract(epoch from (max(taken_at) - min(taken_at)))::float8 / 3600.0 as hours_covered,
       coalesce(
         json_agg(
           json_build_object(
             't', (extract(epoch from taken_at) * 1000)::float8,
             'spread', spread
           ) order by taken_at
         ),
         '[]'::json
       ) as series
     from legs
     group by symbol, long_venue, short_venue`,
    [symbols, longs, shorts, minSpreadApr],
  );

  return rows.map((row) => {
    let series: { t: number; spread: number }[] = [];
    const raw = row.series;
    if (Array.isArray(raw)) {
      series = raw
        .map((point) => {
          const rec = point as { t?: unknown; spread?: unknown };
          const t = toNum(rec.t);
          const spread = toNum(rec.spread);
          if (t == null || spread == null) return null;
          return { t, spread };
        })
        .filter((p): p is { t: number; spread: number } => p != null);
    }
    return {
      symbol: row.symbol,
      long: row.long_venue,
      short: row.short_venue,
      avg24h: toNum(row.avg_24h),
      avg7d: toNum(row.avg_7d),
      hold24h: toNum(row.hold_24h),
      hoursCovered: toNum(row.hours_covered),
      series,
    };
  });
}
