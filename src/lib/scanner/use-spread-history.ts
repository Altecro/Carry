import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSpreadHistory } from "./history.functions";
import type { Opportunity, PairHistory } from "./types";

export function pairHistoryKey(
  symbol: string,
  long: string,
  short: string,
): string {
  return `${symbol}\t${long}\t${short}`;
}

export function useSpreadHistory(
  opportunities: Opportunity[],
  minSpreadApr: number,
) {
  const pairs = useMemo(
    () =>
      opportunities.map((opp) => ({
        symbol: opp.symbol,
        long: opp.long.exchange,
        short: opp.short.exchange,
      })),
    [opportunities],
  );

  const query = useQuery({
    queryKey: ["spread-history", pairs, minSpreadApr],
    queryFn: () => fetchSpreadHistory({ data: { pairs, minSpreadApr } }),
    enabled: pairs.length > 0,
    staleTime: 60_000,
  });

  const byKey = useMemo(() => {
    const map = new Map<string, PairHistory>();
    for (const row of query.data ?? []) {
      map.set(pairHistoryKey(row.symbol, row.long, row.short), row);
    }
    return map;
  }, [query.data]);

  return { byKey, isPending: query.isPending };
}
