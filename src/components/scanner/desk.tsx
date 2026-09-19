import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { runScan } from "@/lib/scanner/scan.functions";
import { findOpportunities } from "@/lib/scanner/engine";
import { useFilters } from "@/lib/scanner/store";
import { FILTER_PRESETS } from "@/lib/scanner/types";
import { venueUrl } from "@/lib/scanner/links";
import { fmtTime, fmtUsd } from "@/lib/scanner/format";
import { useT } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterPanel } from "./filters";
import { OpportunityCard } from "./opportunity-card";
import { SpreadChart } from "./spread-chart";
import { LanguageSwitch } from "./language-switch";
import { Brand, GuideLink, ResearchLink } from "./brand";
import { cn } from "@/lib/utils";

export function Desk() {
  const queryClient = useQueryClient();
  const filters = useFilters();
  const { locale, t } = useT();
  const [elapsed, setElapsed] = useState(0);

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

  const refresh = useMutation({
    mutationFn: () => runScan({ data: { force: true } }),
    onSuccess: (data) => {
      queryClient.setQueryData(["scan"], data);
    },
  });

  const loading = scan.isPending || refresh.isPending;
  const [visible, setVisible] = useState(12);

  const onRefresh = () => {
    setElapsed(0);
    const t0 = Date.now();
    const timer = window.setInterval(() => setElapsed(Date.now() - t0), 200);
    refresh.mutate(undefined, {
      onSettled: () => window.clearInterval(timer),
    });
  };

  const opportunities = useMemo(() => {
    if (!scan.data) return [];
    return findOpportunities(scan.data.legs, filters);
  }, [scan.data, filters]);

  const venueErrors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const venue of scan.data?.venues ?? []) {
      if (venue.error) map[venue.id] = venue.error;
    }
    return map;
  }, [scan.data]);

  const multi =
    scan.data == null
      ? 0
      : Object.values(scan.data.legs).filter((legs) => legs.length >= 2).length;
  const venueOk = scan.data?.venues.filter((v) => !v.error).length ?? 0;
  const venueTotal = scan.data?.venues.length ?? 0;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="desk-shell mx-auto flex max-w-7xl flex-col">
        <aside className="hidden border-r border-border lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
          <div className="px-6 pt-8 pb-4">
            <Brand />
          </div>
          <div className="flex flex-col gap-3 px-6 pb-4">
            <LanguageSwitch />
            <RefreshButton loading={loading} elapsed={elapsed} onRefresh={onRefresh} />
            <ResearchLink />
            <GuideLink />
          </div>
          <div className="flex-1 px-6 pb-8">
            <FilterPanel
              filters={filters}
              onChange={filters.set}
              onReset={filters.reset}
              venueErrors={venueErrors}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-bg/90 px-3 py-2.5 backdrop-blur-sm lg:hidden">
            <div className="flex items-center gap-2">
              <Brand compact />
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <LanguageSwitch compact />
                <ResearchLink compact />
                <GuideLink compact />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <SlidersHorizontal />
                      <span className="sr-only">{t("thresholds")}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{t("thresholds")}</SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto pb-8">
                      <FilterPanel
                        filters={filters}
                        onChange={filters.set}
                        onReset={filters.reset}
                        venueErrors={venueErrors}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
                <RefreshButton
                  compact
                  loading={loading}
                  elapsed={elapsed}
                  onRefresh={onRefresh}
                />
              </div>
            </div>
          </header>

          <main className="flex flex-col gap-6 px-4 py-6 sm:px-6">
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                label={t("statVenues")}
                value={scan.data ? `${venueOk}/${venueTotal}` : "—"}
              />
              <Stat
                label={t("statOverlap")}
                value={scan.data ? String(multi) : "—"}
              />
              <Stat
                label={t("statKept")}
                value={scan.data ? String(opportunities.length) : "—"}
              />
              <Stat
                label={t("lastScan")}
                value={
                  scan.data
                    ? `${fmtTime(scan.data.scannedAt, locale)}${scan.data.cached ? ` · ${t("cache")}` : ""}`
                    : "—"
                }
              />
            </section>

            {scan.data ? (
              <VenueStrip venues={scan.data.venues} />
            ) : (
              <Skeleton className="h-9 w-full rounded-full" />
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={filters.query}
                onChange={(e) => filters.set({ query: e.target.value })}
                placeholder={t("filterTicker")}
                className="sm:max-w-xs"
              />
              <p className="text-pretty text-xs text-muted">
                {t("disclaimer", { notional: fmtUsd(filters.notional, locale) })}{" "}
                <Link
                  to="/docs"
                  className="text-fg underline-offset-2 hover:underline"
                >
                  {t("guide")}
                </Link>
              </p>
            </div>

            {filters.minOpenInterest === FILTER_PRESETS.ultra.minOpenInterest &&
            filters.minSpreadApr === FILTER_PRESETS.ultra.minSpreadApr ? (
              <p className="rounded-xl bg-surface px-4 py-3 text-pretty text-sm text-loss shadow-border">
                {t("ultraWarning")}
              </p>
            ) : null}

            {loading && !scan.data ? <LoadingState /> : null}

            {scan.isError ? (
              <p className="rounded-xl bg-surface p-5 text-sm text-loss shadow-border">
                {t("scanError")}
              </p>
            ) : null}

            {scan.data && !loading ? (
              <>
                <SpreadChart items={opportunities} />
                {opportunities.length === 0 ? (
                  <EmptyState hasMulti={multi > 0} />
                ) : (
                  <>
                    <ol className="flex flex-col gap-3">
                      {opportunities.slice(0, visible).map((opp, index) => (
                        <li key={`${opp.symbol}-${opp.long.exchange}-${opp.short.exchange}`}>
                          <OpportunityCard
                            rank={index + 1}
                            opp={opp}
                            notional={filters.notional}
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
                )}
              </>
            ) : null}

            {loading && scan.data ? (
              <p className="text-center text-xs text-muted">{t("rescan")}</p>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

function RefreshButton({
  loading,
  elapsed,
  onRefresh,
  compact = false,
}: {
  loading: boolean;
  elapsed: number;
  onRefresh: () => void;
  compact?: boolean;
}) {
  const { t } = useT();
  const label = loading
    ? elapsed
      ? `${(elapsed / 1000).toFixed(0)} s`
      : t("scanning")
    : t("refresh");
  return (
    <Button
      onClick={onRefresh}
      disabled={loading}
      size={compact ? "icon" : "default"}
      className={compact ? "shrink-0" : "min-w-32 lg:w-full"}
      aria-label={t("refresh")}
    >
      <RefreshCw className={cn("size-4", loading && "animate-spin")} />
      {compact ? <span className="sr-only">{label}</span> : label}
    </Button>
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

function VenueStrip({
  venues,
}: {
  venues: { id: string; label: string; count: number; error?: string }[];
}) {
  const { t } = useT();
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
      {venues.map((venue) => {
        const href = venueUrl(venue.id);
        const className = cn(
          "shrink-0 rounded-full px-2.5 py-1 font-mono text-xs tabular-nums shadow-border",
          venue.error ? "text-loss" : "text-muted",
          href && "hover:text-fg",
        );
        const label = (
          <>
            {venue.label} {venue.error ? "—" : venue.count}
          </>
        );
        if (!href) {
          return (
            <span
              key={venue.id}
              title={venue.error ?? t("markets", { count: venue.count })}
              className={className}
            >
              {label}
            </span>
          );
        }
        return (
          <a
            key={venue.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={t("openVenue", { venue: venue.label })}
            className={className}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}

function LoadingState() {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{t("loadingBooks")}</p>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ hasMulti }: { hasMulti: boolean }) {
  const { t } = useT();
  return (
    <div className="rounded-xl bg-surface px-5 py-10 text-center shadow-border">
      <p className="font-display text-lg text-fg">{t("emptyTitle")}</p>
      <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted">
        {hasMulti ? t("emptyHasMulti") : t("emptyNoMulti")}
      </p>
    </div>
  );
}
