import type { Filters, Leg, Opportunity } from "./types";

function sideApr(leg: Leg, side: "long" | "short"): number {
  if (side === "long") {
    const value = leg.aprLong ?? leg.apr;
    // Carbon quotes the long's PnL; other venues quote longs-pay-positive.
    return leg.pnlBySide ? -value : value;
  }
  return leg.aprShort ?? leg.apr;
}

function displayApr(leg: Leg, side: "long" | "short"): number {
  const value = side === "long" ? (leg.aprLong ?? leg.apr) : (leg.aprShort ?? leg.apr);
  // Show PnL of that side: Carbon already stores it; other venues
  // quote longs-pay-positive so the long is flipped, the short is not.
  if (side === "long") return leg.pnlBySide ? value : -value;
  return value;
}

function breakevenHours(spreadApr: number, costPct: number): number {
  const hourly = spreadApr / (365 * 24);
  if (hourly <= 0) return Number.POSITIVE_INFINITY;
  return costPct / hourly;
}

function isLiquid(leg: Leg, filters: Filters): boolean {
  if (leg.oi < filters.minOpenInterest) return false;
  if (leg.volume == null) return true;
  return leg.volume >= filters.minVolume24h;
}

function bestPair(
  symbol: string,
  legs: Leg[],
  filters: Filters,
): Opportunity | null {
  let best: Opportunity | null = null;
  for (let i = 0; i < legs.length; i++) {
    for (let j = 0; j < legs.length; j++) {
      if (i === j) continue;
      const longLeg = legs[i]!;
      const shortLeg = legs[j]!;
      const longApr = sideApr(longLeg, "long");
      const shortApr = sideApr(shortLeg, "short");
      const spread = shortApr - longApr;
      if (spread < filters.minSpreadApr || (best && spread <= best.spread)) {
        continue;
      }
      let priceGap = 0;
      if (!longLeg.skipPrice && !shortLeg.skipPrice) {
        const lower = Math.min(longLeg.price, shortLeg.price);
        if (lower <= 0) continue;
        priceGap = (Math.abs(longLeg.price - shortLeg.price) / lower) * 100;
      }
      if (priceGap > filters.maxPriceGapPct) continue;
      const cost = longLeg.costPct + shortLeg.costPct;
      const hours = breakevenHours(spread, cost);
      if (hours > filters.maxBreakevenHours) continue;
      best = {
        symbol,
        long: { ...longLeg, apr: displayApr(longLeg, "long") },
        short: { ...shortLeg, apr: displayApr(shortLeg, "short") },
        spread,
        priceGap,
        cost,
        hours,
      };
    }
  }
  return best;
}

export function findOpportunities(
  legsBySymbol: Record<string, Leg[]>,
  filters: Filters,
): Opportunity[] {
  const disabled = new Set(filters.disabledVenues);
  const query = filters.query.trim().toUpperCase();
  const opportunities: Opportunity[] = [];

  for (const [symbol, legs] of Object.entries(legsBySymbol)) {
    if (query && !symbol.includes(query)) continue;
    const liquid = legs.filter(
      (leg) => !disabled.has(leg.exchange) && isLiquid(leg, filters),
    );
    if (liquid.length < 2) continue;
    const opportunity = bestPair(symbol, liquid, filters);
    if (opportunity) opportunities.push(opportunity);
  }

  opportunities.sort((a, b) => b.spread - a.spread);
  return opportunities;
}

export function dailyGain(spreadApr: number, notional: number): number {
  return (notional * spreadApr) / 100 / 365;
}
