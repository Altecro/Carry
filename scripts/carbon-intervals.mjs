#!/usr/bin/env node
/**
 * Génère la table de référence des intervalles Carbon (PERPS_HUB).
 * Fiable seulement quand l’heure UTC est dans [00:00, 03:00), [08:00, 11:00)
 * ou [16:00, 19:00) : un horaire n’y a pas son prochain paiement à 00/04/08/…
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FUNDING_URL =
  "https://gw.carbon.inc/v1/solvers/funding-info?solver=PERPS_HUB&chainId=42161";
const OUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/lib/scanner/carbon-intervals.json",
);
const WINDOW_STARTS = [0, 8, 16];
const WINDOW_HOURS = 3;

function utcHourFraction(date) {
  return (
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3_600_000
  );
}

function inSafeWindow(date) {
  const hour = utcHourFraction(date);
  return WINDOW_STARTS.some(
    (start) => hour >= start && hour < start + WINDOW_HOURS,
  );
}

function nextSafeWindow(date) {
  const t = date.getTime();
  for (let day = 0; day <= 1; day++) {
    for (const start of WINDOW_STARTS) {
      const begin = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + day,
        start,
        0,
        0,
      );
      const end = begin + WINDOW_HOURS * 3600_000;
      if (t < end) {
        const from = new Date(Math.max(begin, t));
        if (from.getTime() < end) {
          return { begin: new Date(begin), end: new Date(end) };
        }
      }
    }
  }
  const begin = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
  );
  return { begin: new Date(begin), end: new Date(begin + WINDOW_HOURS * 3600_000) };
}

function fmtUtc(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

function hourBucket(nextMs) {
  const hour = new Date(nextMs).getUTCHours();
  if (hour % 8 === 0) return 8;
  if (hour % 4 === 0) return 4;
  return 1;
}

const now = new Date();
if (!inSafeWindow(now)) {
  const next = nextSafeWindow(now);
  console.error(
    `Hors plage fiable (heure UTC ${fmtUtc(now)}). Prochaine plage : ${fmtUtc(next.begin)} → ${fmtUtc(next.end)}.`,
  );
  process.exit(1);
}

const res = await fetch(FUNDING_URL, {
  headers: { Accept: "application/json", "User-Agent": "carry-carbon-intervals" },
});
if (!res.ok) {
  console.error(`funding-info HTTP ${res.status}`);
  process.exit(1);
}
const payload = await res.json();
const funding =
  payload && typeof payload === "object" && payload.data && typeof payload.data === "object"
    ? payload.data
    : payload;
if (!funding || typeof funding !== "object") {
  console.error("funding-info : format inattendu");
  process.exit(1);
}

const intervals = {};
const counts = { 1: 0, 4: 0, 8: 0 };
for (const [market, raw] of Object.entries(funding)) {
  const info = raw && typeof raw === "object" ? raw : {};
  const next = Number(info.next_funding_time);
  if (!Number.isFinite(next) || next < 1e12) continue;
  const hours = hourBucket(next);
  intervals[market] = hours;
  counts[hours] += 1;
}

const n = Object.keys(intervals).length;
if (!n) {
  console.error("Aucun marché avec next_funding_time");
  process.exit(1);
}

const body = {
  generatedAt: now.toISOString(),
  intervals,
};
writeFileSync(OUT_FILE, `${JSON.stringify(body, null, 2)}\n`);
console.log(
  `Écrit ${OUT_FILE} (${n} marchés : 1 h × ${counts[1]}, 4 h × ${counts[4]}, 8 h × ${counts[8]})`,
);
