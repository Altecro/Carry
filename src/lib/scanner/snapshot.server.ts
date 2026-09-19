import { sideApr } from "./engine";
import {
  collectFundingPoints,
  currentSlot,
  deleteSnapshot,
  insertFundingPoints,
  insertVenueChecks,
  pruneOldSnapshots,
  reserveSnapshotSlot,
} from "./history.server";
import { executeScan, lastCanaryReport } from "./run.server";

export type SnapshotResult =
  | { skipped: true }
  | { ok: true; points: number };

/** Réserve le créneau de 30 min, scanne, enregistre, puis purge à 7 jours. */
export async function takeSnapshot(): Promise<SnapshotResult> {
  const slot = currentSlot();
  const snapshotId = await reserveSnapshotSlot(slot);
  if (snapshotId == null) return { skipped: true };

  try {
    const payload = await executeScan(true);
    const points = collectFundingPoints(payload.legs, sideApr);
    const written = await insertFundingPoints(snapshotId, points);
    const { ratios } = lastCanaryReport();
    await insertVenueChecks(
      snapshotId,
      payload.venues.map((venue) => {
        const report = ratios.get(venue.id);
        return {
          venue: venue.id,
          ratio: report?.ratio ?? null,
          n: report?.n ?? null,
          status: venue.error ?? "ok",
        };
      }),
    );
    await pruneOldSnapshots();
    return { ok: true, points: written };
  } catch (error) {
    await deleteSnapshot(snapshotId);
    throw error;
  }
}
