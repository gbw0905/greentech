import { ALL_ENTITY_TICKERS } from "./entity-tickers";
import { cacheGet, cacheSet } from "./market-cache.server";

export type EntityQuote = { symbol: string; price: number; changePct: number; currency: string };

async function quote(symbol: string): Promise<EntityQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const r = json?.chart?.result?.[0];
    if (!r) return null;
    const closes: number[] = (r.indicators?.quote?.[0]?.close ?? []).filter(
      (c: unknown) => typeof c === "number" && Number.isFinite(c),
    );
    const price = r.meta?.regularMarketPrice ?? closes[closes.length - 1];
    const prev = r.meta?.chartPreviousClose ?? closes[closes.length - 2] ?? price;
    if (typeof price !== "number") return null;
    return {
      symbol,
      price,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      currency: (r.meta?.currency as string) ?? "USD",
    };
  } catch {
    return null;
  }
}

export async function loadEntityQuotes() {
  const results = await Promise.all(ALL_ENTITY_TICKERS.map((s) => quote(s)));
  const fresh: Record<string, EntityQuote> = {};
  for (const q of results) if (q) fresh[q.symbol] = q;
  const cached = cacheGet<Record<string, EntityQuote>>("entity-quotes");
  const merged = { ...(cached?.value ?? {}), ...fresh };
  const stale = Object.keys(fresh).length < ALL_ENTITY_TICKERS.length;
  if (Object.keys(merged).length > 0) cacheSet("entity-quotes", merged);
  return { quotes: merged, stale, asOf: stale ? (cached?.at ?? Date.now()) : Date.now() };
}
