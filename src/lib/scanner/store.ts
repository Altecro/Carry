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
        leverage: state.leverage,
        disabledVenues: state.disabledVenues,
      }),
    },
  ),
);

const DEFAULT_RESEARCH_VENUES = ["variational", "hyperliquid"];

type ResearchState = {
  venues: string[];
  toggle: (id: string) => void;
  reset: () => void;
};

export const useResearch = create<ResearchState>()(
  persist(
    (set, get) => ({
      venues: DEFAULT_RESEARCH_VENUES,
      toggle: (id) => {
        const current = get().venues;
        const next = current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id];
        set({ venues: next });
      },
      reset: () => set({ venues: DEFAULT_RESEARCH_VENUES }),
    }),
    {
      name: "carry-research",
      partialize: (state) => ({ venues: state.venues }),
    },
  ),
);
