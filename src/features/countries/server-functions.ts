import { createServerFn } from "@tanstack/react-start";
import { COUNTRY_MARKETS } from "./country-markets";

export interface IndexQuote {
  symbol: string;
  index: string;
  price: number;
  changePct: number;
  currency: string;
}

interface YahooChartResult {
  indicators?: { quote?: Array<{ close?: Array<number | null> }> };
  meta?: {
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    currency?: string;
  };
}

async function quote(symbol: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: YahooChartResult[] } };
    const r = json?.chart?.result?.[0];
    if (!r) return null;
    const closes: Array<number | null> = (r.indicators?.quote?.[0]?.close ?? []).filter(
      (c: unknown) => typeof c === "number" && Number.isFinite(c),
    );
    const price = r.meta?.regularMarketPrice ?? closes[closes.length - 1];
    const prev = r.meta?.chartPreviousClose ?? closes[closes.length - 2] ?? price;
    if (typeof price !== "number") return null;
    return {
      price,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      currency: (r.meta?.currency as string) ?? "USD",
    };
  } catch {
    return null;
  }
}

export const getCountryIndicesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { cacheGet, cacheSet } = await import("@/features/markets/server/market-cache.server");
  const symbols = Array.from(new Set(Object.values(COUNTRY_MARKETS).map((m) => m.symbol)));
  const results = await Promise.all(symbols.map(async (s) => [s, await quote(s)] as const));
  const bySymbol = new Map(results);
  const out: Record<string, IndexQuote> = {};
  for (const [slug, m] of Object.entries(COUNTRY_MARKETS)) {
    const q = bySymbol.get(m.symbol);
    if (!q) continue;
    out[slug] = {
      symbol: m.symbol,
      index: m.index,
      price: q.price,
      changePct: q.changePct,
      currency: m.currency,
    };
  }
  const cached = cacheGet<Record<string, IndexQuote>>("country-indices");
  // Fall back to the most recent successful quote for any market that failed.
  const merged: Record<string, IndexQuote> = { ...(cached?.value ?? {}), ...out };
  const stale = Object.keys(out).length < Object.keys(merged).length;
  if (Object.keys(merged).length > 0) cacheSet("country-indices", merged);
  return { indices: merged, fetchedAt: stale ? (cached?.at ?? Date.now()) : Date.now(), stale };
});
