import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FILTERS, type Filters } from "./types";

type FilterState = Filters & {
  set: (patch: Partial<Filters>) => void;
  reset: () => void;
};

export const useFilters = create<FilterState>()(
  persist(
    (set) => ({
      ...DEFAULT_FILTERS,
      set: (patch) => set(patch),
      reset: () => set({ ...DEFAULT_FILTERS, query: "" }),
    }),
    {
      name: "ecart-filters",
      partialize: (state) => ({
        minSpreadApr: state.minSpreadApr,
        minOpenInterest: state.minOpenInterest,
        minVolume24h: state.minVolume24h,
        maxPriceGapPct: state.maxPriceGapPct,
        maxBreakevenHours: state.maxBreakevenHours,
        notional: state.notional,
        disabledVenues: state.disabledVenues,
      }),
    },
  ),
);
