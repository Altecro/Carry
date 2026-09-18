export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function stripQuoteSuffix(name: string): string {
  let symbol = name.toUpperCase().replaceAll("_", "");
  for (const suffix of ["USDT", "USDC", "USD"] as const) {
    if (symbol.endsWith(suffix) && symbol.length > suffix.length) {
      symbol = symbol.slice(0, -suffix.length);
      break;
    }
  }
  if (symbol.endsWith("-")) symbol = symbol.slice(0, -1);
  return symbol;
}

export function lotAdjust(
  symbol: string,
  price: number | null,
): [string, number | null] {
  if (symbol.startsWith("1000") && /^[A-Z]+$/.test(symbol.slice(4))) {
    return [symbol.slice(4), price == null ? null : price / 1000];
  }
  if (
    symbol.startsWith("K") &&
    symbol.length > 1 &&
    symbol.slice(1) === symbol.slice(1).toUpperCase() &&
    /^[A-Z]+$/.test(symbol.slice(1))
  ) {
    return [symbol.slice(1), price == null ? null : price / 1000];
  }
  return [symbol, price];
}

export function venueSymbol(name: unknown): string | null {
  if (typeof name !== "string") return null;
  let symbol = name.toUpperCase();
  for (const junk of [
    "/USDT-P",
    "/USD-P",
    "_USDC_PERP",
    "_USDT_PERP",
    "-USD-PERP",
    "-USDT-PERP",
    "_PERP",
    "-PERP",
  ]) {
    symbol = symbol.replaceAll(junk, "");
  }
  if (symbol.startsWith("PERP_")) {
    symbol = symbol.slice(5).split("_")[0] ?? "";
  }
  symbol = symbol.replaceAll("/", "");
  const [normalized] = lotAdjust(stripQuoteSuffix(symbol), null);
  return normalized || null;
}

export function intervalApr(rate: number, hours: number): number | null {
  if (hours <= 0) return null;
  return rate * (24 / hours) * 365 * 100;
}

export function carbonNormalize(
  name: unknown,
  price: number | null,
): [string, number | null] | [null, null] {
  if (typeof name !== "string" || !name) return [null, null];
  let symbol = name.toUpperCase();
  if (symbol.endsWith("_PERP")) return [null, null];
  if (symbol.endsWith("_CARBONRWA")) {
    symbol = symbol.slice(0, -"_CARBONRWA".length);
  }
  if (symbol.endsWith("USDT")) symbol = symbol.slice(0, -4);
  else if (symbol.endsWith("USD")) symbol = symbol.slice(0, -3);
  if (symbol.startsWith("1000") && /^[A-Z]+$/.test(symbol.slice(4))) {
    symbol = symbol.slice(4);
    if (price != null) price = price / 1000;
  }
  if (!symbol || !/^[\x00-\x7F]+$/.test(symbol) || !/^[A-Z0-9]+$/.test(symbol)) {
    return [null, null];
  }
  return [symbol, price];
}
