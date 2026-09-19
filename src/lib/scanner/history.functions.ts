import { createServerFn } from "@tanstack/react-start";
import type { PairHistory, PairRef } from "./types";

function asPairs(raw: unknown): PairRef[] {
  if (!Array.isArray(raw)) return [];
  const pairs: PairRef[] = [];
  for (const item of raw.slice(0, 200)) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (
      typeof rec.symbol !== "string" ||
      typeof rec.long !== "string" ||
      typeof rec.short !== "string"
    ) {
      continue;
    }
    pairs.push({ symbol: rec.symbol, long: rec.long, short: rec.short });
  }
  return pairs;
}

export const fetchSpreadHistory = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const min = Number(body.minSpreadApr);
    return {
      pairs: asPairs(body.pairs),
      minSpreadApr: Number.isFinite(min) ? min : 0,
    };
  })
  .handler(async ({ data }): Promise<PairHistory[]> => {
    try {
      const { loadPairHistory } = await import("./history.server");
      return await loadPairHistory(data.pairs, data.minSpreadApr);
    } catch (error) {
      console.error("historique écarts", error);
      return [];
    }
  });
