import { asRecord } from "./symbols";

export class FatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalError";
  }
}

export class TemporaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemporaryError";
  }
}

const UA =
  "Mozilla/5.0 (compatible; CarryScanner/1.0; +https://grok.com) AppleWebKit/537.36";

function buildUrl(
  url: string,
  params?: Record<string, string | number | string[]>,
): string {
  if (!params) return url;
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) parsed.searchParams.append(key, item);
    } else {
      parsed.searchParams.set(key, String(value));
    }
  }
  return parsed.toString();
}

export async function getJson(
  source: string,
  url: string,
  options: {
    payload?: unknown;
    params?: Record<string, string | number | string[]>;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onParentAbort = () => ctrl.abort();
  options.signal?.addEventListener("abort", onParentAbort);

  try {
    const init: RequestInit = {
      method: options.payload === undefined ? "GET" : "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": UA,
        ...(options.payload === undefined
          ? {}
          : { "Content-Type": "application/json" }),
      },
      signal: ctrl.signal,
    };
    if (options.payload !== undefined) {
      init.body = JSON.stringify(options.payload);
    }
    const response = await fetch(buildUrl(url, options.params), init);
    const status = response.status;
    const text = await response.text();
    const detail = text.replace(/\s+/g, " ").slice(0, 150) || "(vide)";
    if (status === 429) {
      throw new TemporaryError(`${source} : trop de requêtes (429)`);
    }
    if (status >= 500) {
      throw new TemporaryError(`${source} a un problème de son côté (${status})`);
    }
    if (status !== 200) {
      throw new FatalError(`${source} a répondu ${status}. Serveur : ${detail}`);
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new TemporaryError(`${source} : réponse illisible (pas du JSON)`);
    }
  } catch (error) {
    if (error instanceof FatalError || error instanceof TemporaryError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new TemporaryError(`${source} : délai dépassé`);
    }
    throw new TemporaryError(
      `${source} injoignable (${error instanceof Error ? error.message : "réseau"})`,
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onParentAbort);
  }
}

export function unwrapCarbon(source: string, payload: unknown): unknown {
  const body = asRecord(payload);
  if (body.success === false) {
    throw new TemporaryError(
      `${source} : ${typeof body.statusMessage === "string" ? body.statusMessage : "échec"}`,
    );
  }
  return body.data;
}

export async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const out: R[] = [];
  let index = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (index < items.length) {
        const current = items[index++]!;
        try {
          const result = await fn(current);
          if (result != null) out.push(result);
        } catch {
          // skip a single failed market
        }
      }
    },
  );
  await Promise.all(workers);
  return out;
}

export async function withDeadline<T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}
