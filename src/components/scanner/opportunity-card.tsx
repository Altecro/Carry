import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Copy } from "lucide-react";
import type { Opportunity } from "@/lib/scanner/types";
import { VENUE_LABEL } from "@/lib/scanner/types";
import { venueUrl, venueAccessCode } from "@/lib/scanner/links";
import { dailyGain } from "@/lib/scanner/engine";
import {
  fmtApr,
  fmtFundingHours,
  fmtHours,
  fmtPct,
  fmtUsd,
  opportunityText,
} from "@/lib/scanner/format";
import { numberLocale, useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

type Props = {
  rank: number;
  opp: Opportunity;
  notional: number;
  /** Levier par jambe, 1–10. */
  leverage: number;
};

function venueName(id: string) {
  return VENUE_LABEL[id] ?? id;
}

export function OpportunityCard({ rank, opp, notional, leverage }: Props) {
  const { locale, t } = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const daily = dailyGain(opp.spread, notional);
  // Capital total = 2 × notionnel / levier (moitié sur chaque DEX).
  const lev = Math.min(10, Math.max(1, leverage || 2));
  const capital = (2 * notional) / lev;
  const capitalEach = capital / 2;
  const capitalApr = (opp.spread * lev) / 2;
  const capitalDaily = dailyGain(capitalApr, capital);
  // Coût A/R en $ : somme des % des deux jambes × taille d’une jambe.
  const costUsd = (opp.cost / 100) * notional;
  // Distance approx. à la liq. = 100 / levier − 1 % (buffer).
  const liqPct = 100 / lev - 1;
  const volumes = [opp.long.volume, opp.short.volume].filter(
    (v): v is number => v != null,
  );
  const volMin = volumes.length ? Math.min(...volumes) : null;
  // Carbon : plafond, pas un OI — on l’écarte du « OI min ».
  const oiValues = [opp.long, opp.short]
    .filter((leg) => !leg.oiIsCap && leg.oi != null)
    .map((leg) => leg.oi!);
  const oiMin = oiValues.length ? Math.min(...oiValues) : null;

  async function copy() {
    const text = opportunityText(
      locale,
      rank,
      opp.symbol,
      opp.spread,
      venueName(opp.long.exchange),
      opp.long.apr,
      venueName(opp.short.exchange),
      opp.short.apr,
      oiMin,
      volMin,
      opp.priceGap,
      opp.cost,
      opp.hours,
      notional,
      opp.long.exchange,
      opp.short.exchange,
      opp.long.fundingHours,
      opp.short.fundingHours,
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article
      className={cn(
        "opp-enter rounded-xl bg-surface p-4 shadow-border sm:p-5",
        "transition-[box-shadow] duration-[var(--motion-quick)] hover:shadow-border-hover",
      )}
      style={{ animationDelay: `${Math.min(rank - 1, 8) * 40}ms` }}
    >
      <header className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-baseline gap-3 text-left"
        >
          <span className="font-mono text-xs text-subtle tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
          <span className="truncate font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
            {opp.symbol}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="font-mono text-xl font-medium text-gain tabular-nums sm:text-2xl">
              {fmtApr(opp.spread, locale)}
            </p>
            <p className="text-xs text-muted">
              ~{fmtUsd(daily, locale)} {t("perDay")}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            className="relative size-11 text-muted hover:text-fg"
            aria-label={t("copy")}
          >
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-[var(--motion-fast)]",
                copied
                  ? "scale-100 opacity-100 blur-none"
                  : "scale-[0.25] opacity-0 blur-[4px]",
              )}
            >
              <Check className="size-4" />
            </span>
            <span
              className={cn(
                "flex items-center justify-center transition-[opacity,transform,filter] duration-[var(--motion-fast)]",
                copied
                  ? "scale-[0.25] opacity-0 blur-[4px]"
                  : "scale-100 opacity-100 blur-none",
              )}
            >
              <Copy className="size-4" />
            </span>
          </button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LegRow
          side="long"
          exchangeId={opp.long.exchange}
          exchange={venueName(opp.long.exchange)}
          apr={opp.long.apr}
          oi={opp.long.oi}
          oiIsCap={opp.long.oiIsCap}
          fundingHours={opp.long.fundingHours}
        />
        <LegRow
          side="short"
          exchangeId={opp.short.exchange}
          exchange={venueName(opp.short.exchange)}
          apr={opp.short.apr}
          oi={opp.short.oi}
          oiIsCap={opp.short.oiIsCap}
          fundingHours={opp.short.fundingHours}
        />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted tabular-nums">
        <div>
          <dt className="inline text-subtle">{t("oiMin")} </dt>
          <dd className="inline">
            {fmtUsd(oiMin, locale)}
          </dd>
        </div>
        <div>
          <dt className="inline text-subtle">{t("vol")} </dt>
          <dd className="inline">{fmtUsd(volMin, locale)}</dd>
        </div>
        <div>
          <dt className="inline text-subtle">{t("priceGapShort")} </dt>
          <dd className="inline">{fmtPct(opp.priceGap, locale)}</dd>
        </div>
        <div>
          <dt className="inline text-subtle">{t("costShort")} </dt>
          <dd className="inline">{fmtPct(opp.cost, locale)}</dd>
        </div>
        <div>
          <dt className="inline text-subtle">{t("breakevenShort")} </dt>
          <dd className="inline">{fmtHours(opp.hours, locale)}</dd>
        </div>
      </dl>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs text-muted tabular-nums sm:grid-cols-4">
        <div>
          <dt className="text-subtle">{t("capitalDeposit")}</dt>
          <dd className="text-fg">
            {fmtUsd(capital, locale)}
            <span className="mt-0.5 block text-subtle">
              {t("capitalPerDex", { amount: fmtUsd(capitalEach, locale) })}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-subtle">{t("capitalApr")}</dt>
          <dd className="text-gain">
            {fmtApr(capitalApr, locale)}
            <span className="mt-0.5 block text-muted">
              ~{fmtUsd(capitalDaily, locale)} {t("perDay")}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-subtle">{t("roundTripCost")}</dt>
          <dd className="text-fg">
            {Math.abs(costUsd) >= 1000
              ? fmtUsd(costUsd, locale)
              : `${costUsd.toLocaleString(numberLocale(locale), {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} $`}
          </dd>
        </div>
        <div>
          <dt className="text-subtle">{t("liqDistance")}</dt>
          <dd className="text-fg">~{fmtPct(liqPct, locale, 0)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-pretty text-xs leading-relaxed text-subtle">
        {t("liqEstimate")}
      </p>
      {lev > 5 ? (
        <p className="mt-1 text-pretty text-xs leading-relaxed text-loss">
          {t("liqWarning", { pct: fmtPct(liqPct, locale, 0) })}
        </p>
      ) : null}

      {open ? (
        <div className="mt-4 grid gap-3 rounded-lg bg-surface-2 p-3 text-sm sm:grid-cols-2">
          <p className="text-muted">
            {t("longPrice")}{" "}
            <span className="font-mono text-fg tabular-nums">
              {opp.long.skipPrice
                ? t("na")
                : opp.long.price.toLocaleString(numberLocale(locale))}
            </span>
          </p>
          <p className="text-muted">
            {t("shortPrice")}{" "}
            <span className="font-mono text-fg tabular-nums">
              {opp.short.skipPrice
                ? t("na")
                : opp.short.price.toLocaleString(numberLocale(locale))}
            </span>
          </p>
          <p className="text-muted">
            {t("longFees")}{" "}
            <span className="font-mono text-fg tabular-nums">
              {fmtPct(opp.long.costPct, locale)}
            </span>
          </p>
          <p className="text-muted">
            {t("shortFees")}{" "}
            <span className="font-mono text-fg tabular-nums">
              {fmtPct(opp.short.costPct, locale)}
            </span>
          </p>
          <p className="text-pretty text-muted sm:col-span-2">
            {t("cardDetail", {
              notional: fmtUsd(notional, locale),
              daily: fmtUsd(daily, locale),
            })}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function LegRow({
  side,
  exchangeId,
  exchange,
  apr,
  oi,
  oiIsCap,
  fundingHours,
}: {
  side: "long" | "short";
  exchangeId: string;
  exchange: string;
  apr: number;
  oi: number | null;
  oiIsCap?: boolean;
  fundingHours?: number;
}) {
  const { locale, t } = useT();
  const href = venueUrl(exchangeId);
  const code = venueAccessCode(exchangeId);
  const interval = fmtFundingHours(fundingHours, locale);
  const Icon = side === "long" ? ArrowUpRight : ArrowDownRight;
  const body = (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-subtle" />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wider text-subtle uppercase">
            {t(side === "long" ? "long" : "short")}
          </p>
          <p className="truncate text-sm text-fg underline-offset-2 group-hover:underline">
            {exchange}
          </p>
          <p className="font-mono text-xs text-muted tabular-nums">
            {oi == null
              ? `${t("oi")} n/d`
              : `${oiIsCap ? "max" : t("oi")} ${fmtUsd(oi, locale)}`}
            {interval ? (
              <>
                {" · "}
                <span title={t("fundingInterval", { hours: interval })}>
                  {interval}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <p
        className={cn(
          "font-mono text-sm tabular-nums",
          apr >= 0 ? "text-gain" : "text-loss",
        )}
      >
        {fmtApr(apr, locale)}
      </p>
    </>
  );
  const box =
    "flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2.5";
  if (!href) {
    return <div className={box}>{body}</div>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("openVenue", { venue: exchange })}
      title={code ? `${exchange} · ${code}` : exchange}
      className={cn(box, "group")}
    >
      {body}
    </a>
  );
}
