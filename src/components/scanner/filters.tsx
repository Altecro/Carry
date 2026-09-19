import { useState } from "react";
import type { ReactNode } from "react";
import {
  FILTER_PRESETS,
  VENUES,
  type Filters,
  type PresetId,
} from "@/lib/scanner/types";
import { fmtUsd } from "@/lib/scanner/format";
import { useT } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Props = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  venueErrors: Record<string, string>;
};

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          {label}
        </span>
        <span className="font-mono text-sm text-fg tabular-nums">{value}</span>
      </span>
      {children}
    </label>
  );
}

function activePreset(filters: Filters): PresetId | null {
  return (
    (Object.keys(FILTER_PRESETS) as PresetId[]).find((key) => {
      const preset = FILTER_PRESETS[key];
      return (
        preset.minSpreadApr === filters.minSpreadApr &&
        preset.minOpenInterest === filters.minOpenInterest &&
        preset.minVolume24h === filters.minVolume24h &&
        preset.maxPriceGapPct === filters.maxPriceGapPct &&
        preset.maxBreakevenHours === filters.maxBreakevenHours
      );
    }) ?? null
  );
}

export function FilterPanel({ filters, onChange, onReset, venueErrors }: Props) {
  const { locale, t } = useT();
  const applied = activePreset(filters);
  const [pending, setPending] = useState<PresetId | null>(null);
  const selected = pending ?? applied;
  const canApply = pending != null;

  const presetLabels: Record<PresetId, string> = {
    souple: t("presetLoose"),
    classic: t("presetClassic"),
    strict: t("presetTight"),
    ultra: t("presetUltra"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t("presets")}
        </p>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1">
          {(Object.keys(FILTER_PRESETS) as PresetId[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPending(key)}
              className={cn(
                "h-9 rounded-md text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]",
                selected === key
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              {presetLabels[key]}
            </button>
          ))}
        </div>
        <Button
          className="mt-2 w-full"
          variant={canApply ? "default" : "outline"}
          disabled={!canApply}
          onClick={() => {
            if (!pending) return;
            onChange(FILTER_PRESETS[pending]);
            setPending(null);
          }}
        >
          {t("applyPreset")}
        </Button>
        {selected === "ultra" ? (
          <p className="mt-2 text-pretty text-xs leading-relaxed text-loss">
            {t("ultraWarning")}
          </p>
        ) : null}
      </div>

      <Field label={t("minSpread")} value={`${filters.minSpreadApr} % APR`}>
        <Slider
          min={0}
          max={80}
          step={1}
          value={[filters.minSpreadApr]}
          onValueChange={([v]) => onChange({ minSpreadApr: v ?? 0 })}
        />
      </Field>

      <Field label={t("minOi")} value={fmtUsd(filters.minOpenInterest, locale)}>
        <Slider
          min={0}
          max={2_000_000}
          step={25_000}
          value={[filters.minOpenInterest]}
          onValueChange={([v]) => onChange({ minOpenInterest: v ?? 0 })}
        />
      </Field>

      <Field label={t("minVolume")} value={fmtUsd(filters.minVolume24h, locale)}>
        <Slider
          min={0}
          max={2_000_000}
          step={25_000}
          value={[filters.minVolume24h]}
          onValueChange={([v]) => onChange({ minVolume24h: v ?? 0 })}
        />
      </Field>

      <Field label={t("maxPriceGap")} value={`${filters.maxPriceGapPct} %`}>
        <Slider
          min={0.1}
          max={5}
          step={0.1}
          value={[filters.maxPriceGapPct]}
          onValueChange={([v]) => onChange({ maxPriceGapPct: v ?? 0.1 })}
        />
      </Field>

      <Field
        label={t("maxBreakeven")}
        value={`${filters.maxBreakevenHours} ${t("hoursUnit")}`}
      >
        <Slider
          min={6}
          max={168}
          step={6}
          value={[filters.maxBreakevenHours]}
          onValueChange={([v]) => onChange({ maxBreakevenHours: v ?? 6 })}
        />
      </Field>

      <Field label={t("notional")} value={fmtUsd(filters.notional, locale)}>
        <Slider
          min={100}
          max={10_000}
          step={100}
          value={[filters.notional]}
          onValueChange={([v]) => onChange({ notional: v ?? 100 })}
        />
      </Field>

      <Field
        label={t("leverage")}
        value={`${filters.leverage ?? 2}×`}
      >
        <Slider
          min={1}
          max={10}
          step={1}
          value={[filters.leverage ?? 2]}
          onValueChange={([v]) => onChange({ leverage: v ?? 2 })}
        />
      </Field>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          {t("venues")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {VENUES.map((venue) => {
            const off = filters.disabledVenues.includes(venue.id);
            const err = venueErrors[venue.id];
            return (
              <button
                key={venue.id}
                type="button"
                title={err ?? venue.label}
                onClick={() => {
                  const next = off
                    ? filters.disabledVenues.filter((id) => id !== venue.id)
                    : [...filters.disabledVenues, venue.id];
                  onChange({ disabledVenues: next });
                }}
                className={cn(
                  "h-8 rounded-full px-2.5 text-xs font-medium shadow-border transition-[background-color,color,opacity] duration-[var(--motion-quick)]",
                  off
                    ? "text-subtle opacity-50"
                    : err
                      ? "text-loss"
                      : "bg-surface-2 text-fg",
                )}
              >
                {venue.label}
              </button>
            );
          })}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={onReset} className="self-start">
        {t("reset")}
      </Button>
    </div>
  );
}
