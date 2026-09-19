import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { runScan } from "@/lib/scanner/scan.functions";
import { findResearchPairs } from "@/lib/scanner/engine";
import { useFilters, useResearch } from "@/lib/scanner/store";
import { VENUES } from "@/lib/scanner/types";
import { fmtUsd } from "@/lib/scanner/format";
import { useT } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand, GuideLink } from "./brand";
import { LanguageSwitch } from "./language-switch";
import { OpportunityCard } from "./opportunity-card";
import { SpreadChart } from "./spread-chart";
import { cn } from "@/lib/utils";

export function ResearchPage() {
  const { locale, t } = useT();
  const filters = useFilters();
  const research = useResearch();
  const [visible, setVisible] = useState(12);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const scan = useQuery({
    queryKey: ["scan"],
    queryFn: () => runScan({ data: { force: false } }),
    staleTime: 45_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const selected = research.venues;
  const venueStatus = useMemo(() => {
    const map = new Map<string, { error?: string; label: string }>();
    for (const venue of scan.data?.venues ?? []) {
      map.set(venue.id, { error: venue.error, label: venue.label });
    }
    return map;
  }, [scan.data]);

  const excludedSelected = VENUES.filter((venue) => {
    if (!selected.includes(venue.id)) return false;
    return Boolean(venueStatus.get(venue.id)?.error);
  });
  const usableCount = selected.filter(
    (id) => !venueStatus.get(id)?.error,
  ).length;

  const opportunities = useMemo(() => {
    if (!scan.data || selected.length < 2) return [];
    return findResearchPairs(scan.data.legs, { ...filters, query }, selected);
  }, [scan.data, filters, query, selected]);

  const overlap =
    scan.data == null || selected.length < 2
      ? 0
      : Object.values(scan.data.legs).filter((legs) => {
          const ids = new Set(
            legs.filter((leg) => selected.includes(leg.exchange)).map((leg) => leg.exchange),
          );
          return ids.size >= 2;
        }).length;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-6">
          <Brand compact />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <LanguageSwitch compact />
            <GuideLink compact />
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-surface-2 hover:text-fg"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{t("backToScan")}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-medium tracking-tight text-fg">
            {t("research")}
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted">{t("researchLead")}</p>
        </header>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">
              {t("venues")}
            </p>
            <button
              type="button"
              onClick={() => research.reset()}
              className="h-11 text-xs text-muted hover:text-fg"
            >
              {t("researchReset")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {VENUES.map((venue) => {
              const on = selected.includes(venue.id);
              const excluded = Boolean(venueStatus.get(venue.id)?.error);
              return (
                <button
                  key={venue.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => research.toggle(venue.id)}
                  className={cn(
                    "h-11 rounded-full px-3.5 text-sm shadow-border",
                    excluded
                      ? "bg-surface text-subtle"
                      : on
                        ? "bg-accent text-accent-fg"
                        : "bg-surface text-muted hover:text-fg",
                  )}
                >
                  {venue.label}
                  {excluded ? ` · ${t("researchExcluded")}` : null}
                </button>
              );
            })}
          </div>
          {excludedSelected.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {excludedSelected.map((venue) => (
                <li
                  key={venue.id}
                  className="text-pretty text-sm leading-relaxed text-muted"
                >
                  {venue.label} : {venueStatus.get(venue.id)?.error}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label={t("venues")} value={`${usableCount}`} />
          <Stat
            label={t("researchOverlap")}
            value={scan.data && selected.length >= 2 ? String(overlap) : "—"}
          />
          <Stat
            label={t("statKept")}
            value={selected.length >= 2 ? String(opportunities.length) : "—"}
          />
        </section>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("filterTicker")}
          className="sm:max-w-xs"
        />

        <p className="text-pretty text-xs text-muted">
          {t("disclaimer", { notional: fmtUsd(filters.notional, locale) })}
        </p>

        {scan.isPending && !scan.data ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : null}

        {scan.isError ? (
          <p className="rounded-xl bg-surface p-5 text-sm text-loss shadow-border">
            {t("scanError")}
          </p>
        ) : null}

        {scan.data && selected.length < 2 ? (
          <div className="rounded-xl bg-surface px-5 py-10 text-center shadow-border">
            <p className="font-display text-lg text-fg">{t("researchNeedTwo")}</p>
          </div>
        ) : null}

        {scan.data && selected.length >= 2 ? (
          opportunities.length === 0 ? (
            <div className="rounded-xl bg-surface px-5 py-10 text-center shadow-border">
              <p className="font-display text-lg text-fg">{t("emptyTitle")}</p>
              <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted">
                {t("researchEmpty")}
              </p>
            </div>
          ) : (
            <>
              <SpreadChart items={opportunities} />
              <ol className="flex flex-col gap-3">
                {opportunities.slice(0, visible).map((opp, index) => (
                  <li key={`${opp.symbol}-${opp.long.exchange}-${opp.short.exchange}`}>
                    <OpportunityCard
                      rank={index + 1}
                      opp={opp}
                      notional={filters.notional}
                      leverage={filters.leverage ?? 2}
                    />
                  </li>
                ))}
              </ol>
              {opportunities.length > visible ? (
                <Button
                  variant="outline"
                  className="self-center"
                  onClick={() => setVisible((n) => n + 20)}
                >
                  {t("showMore", { count: opportunities.length - visible })}
                </Button>
              ) : null}
            </>
          )
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-3 shadow-border sm:px-4">
      <p className="text-xs font-medium tracking-wide text-subtle uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg text-fg tabular-nums">{value}</p>
    </div>
  );
}
