import type { Locale } from "@/lib/i18n/messages";
import { t, numberLocale } from "@/lib/i18n/store";
import { venueUrl, venueAccessCode } from "./links";

function nf(locale: Locale, digits: number, minDigits = 0) {
  return new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: digits,
  });
}

export function fmtUsd(
  amount: number | null | undefined,
  locale: Locale = "fr",
): string {
  if (amount == null) return t(locale, "na");
  if (amount >= 1e9) return `${nf(locale, 1).format(amount / 1e9)} ${t(locale, "billion")}`;
  if (amount >= 1e6) return `${nf(locale, 1).format(amount / 1e6)} ${t(locale, "million")}`;
  if (amount >= 1e3) return `${nf(locale, 0).format(amount / 1e3)} ${t(locale, "thousand")}`;
  return `${nf(locale, 0).format(amount)} $`;
}

export function fmtApr(value: number, locale: Locale = "fr"): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${nf(locale, 1).format(value)} %`;
}

export function fmtPct(value: number, locale: Locale = "fr", digits = 2): string {
  return `${nf(locale, digits, digits === 2 ? 2 : 0).format(value)} %`;
}

export function fmtHours(hours: number, locale: Locale = "fr"): string {
  if (!Number.isFinite(hours)) return "∞";
  if (hours < 1) return `${nf(locale, 0).format(hours * 60)} ${t(locale, "minutes")}`;
  if (hours < 48) return `${nf(locale, 0).format(hours)} ${t(locale, "hoursUnit")}`;
  return `${nf(locale, 1).format(hours / 24)} ${t(locale, "dayShort")}`;
}

export function fmtFundingHours(
  hours: number | null | undefined,
  locale: Locale = "fr",
): string | null {
  if (hours == null || hours <= 0 || !Number.isFinite(hours)) return null;
  if (hours < 1) {
    return `${nf(locale, 0).format(hours * 60)} ${t(locale, "minutes")}`;
  }
  const digits = hours % 1 === 0 ? 0 : 1;
  return `${nf(locale, digits).format(hours)} ${t(locale, "hoursUnit")}`;
}

export function fmtTime(ts: number, locale: Locale = "fr"): string {
  return new Intl.DateTimeFormat(numberLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ts);
}

export function opportunityText(
  locale: Locale,
  rank: number,
  symbol: string,
  spread: number,
  longEx: string,
  longApr: number,
  shortEx: string,
  shortApr: number,
  oi: number,
  volume: number | null,
  priceGap: number,
  cost: number,
  hours: number,
  notional: number,
  longId?: string,
  shortId?: string,
  longFundingHours?: number,
  shortFundingHours?: number,
): string {
  const daily = (notional * spread) / 100 / 365;
  const iv = (hours?: number) => {
    const label = fmtFundingHours(hours, locale);
    return label ? ` · ${label}` : "";
  };
  const body = t(locale, "copyBlurb", {
    rank,
    symbol,
    spread: nf(locale, 1).format(spread),
    daily: nf(locale, 2, 2).format(daily),
    notional: fmtUsd(notional, locale),
    longEx,
    longApr: fmtApr(longApr, locale),
    shortEx,
    shortApr: fmtApr(shortApr, locale),
    longIv: iv(longFundingHours),
    shortIv: iv(shortFundingHours),
    oi: fmtUsd(oi, locale),
    volume: fmtUsd(volume, locale),
    priceGap: nf(locale, 2, 2).format(priceGap),
    cost: nf(locale, 2, 2).format(cost),
    hours: nf(locale, 0).format(hours),
  });
  const longHref = longId ? venueUrl(longId) : undefined;
  const shortHref = shortId ? venueUrl(shortId) : undefined;
  if (!longHref && !shortHref) return body;
  const line = (name: string, id?: string, href?: string) => {
    if (!href || !id) return null;
    const code = venueAccessCode(id);
    return code
      ? `   ${name} ${href}  (${t(locale, "accessCode", { code })})`
      : `   ${name} ${href}`;
  };
  return [body, line(longEx, longId, longHref), line(shortEx, shortId, shortHref)]
    .filter(Boolean)
    .join("\n");
}
