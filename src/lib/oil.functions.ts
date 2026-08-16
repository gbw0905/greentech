import { createServerFn } from "@tanstack/react-start";

export type OilQuote = {
  symbol: string;
  label: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  currency: string;
  unit: string;
  series: Array<{ t: number; c: number }>;
  updatedAt: number;
};

async function loadSymbol(symbol: string, label: string, unit: string): Promise<OilQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const r = json?.chart?.result?.[0];
    if (!r) return null;
    const ts: number[] = r.timestamp ?? [];
    const closes: Array<number | null> = r.indicators?.quote?.[0]?.close ?? [];
    const series: Array<{ t: number; c: number }> = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (typeof c === "number" && Number.isFinite(c)) series.push({ t: ts[i]! * 1000, c });
    }
    const price = r.meta?.regularMarketPrice ?? series[series.length - 1]?.c;
    const prevClose =
      series[series.length - 2]?.c ?? r.meta?.chartPreviousClose ?? price;
    if (typeof price !== "number") return null;
    return {
      symbol,
      label,
      price,
      prevClose,
      change: price - prevClose,
      changePct: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
      currency: r.meta?.currency ?? "USD",
      unit,
      series,
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export const getOilPricesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { cacheGet, cacheSet } = await import("./market-cache.server");
  const [wti, spx, gold] = await Promise.all([
    loadSymbol("CL=F", "WTI Crude", "/bbl"),
    loadSymbol("^GSPC", "S&P 500", "index"),
    loadSymbol("GC=F", "Gold", "/oz"),
  ]);
  const fresh = [wti, spx, gold].filter(Boolean) as OilQuote[];
  const cached = cacheGet<OilQuote[]>("oil-prices");
  if (fresh.length === 3) {
    cacheSet("oil-prices", fresh);
    return { quotes: fresh, stale: false, asOf: Date.now() };
  }
  // Market feed partially/fully unavailable: keep the most recent good data.
  const merged = (cached?.value ?? []).map((old) => fresh.find((f) => f.symbol === old.symbol) ?? old);
  for (const f of fresh) if (!merged.some((m) => m.symbol === f.symbol)) merged.push(f);
  if (merged.length > 0) cacheSet("oil-prices", merged);
  return { quotes: merged, stale: true, asOf: cached?.at ?? Date.now() };
});

/** Twenty of the largest NYSE-listed oil & gas companies. */
const OIL_STOCKS: Array<[string, string]> = [
  ["XOM", "ExxonMobil"],
  ["CVX", "Chevron"],
  ["SHEL", "Shell"],
  ["TTE", "TotalEnergies"],
  ["BP", "BP"],
  ["COP", "ConocoPhillips"],
  ["EOG", "EOG Resources"],
  ["SLB", "SLB"],
  ["PSX", "Phillips 66"],
  ["MPC", "Marathon Petroleum"],
  ["VLO", "Valero Energy"],
  ["OXY", "Occidental Petroleum"],
  ["PBR", "Petrobras"],
  ["E", "Eni"],
  ["EQNR", "Equinor"],
  ["SU", "Suncor Energy"],
  ["CNQ", "Canadian Natural"],
  ["HES", "Hess"],
  ["DVN", "Devon Energy"],
  ["BKR", "Baker Hughes"],
];

export const getOilStocksFn = createServerFn({ method: "GET" }).handler(async () => {
  const { cacheGet, cacheSet } = await import("./market-cache.server");
  const quotes = await Promise.all(
    OIL_STOCKS.map(([sym, label]) => loadSymbol(sym, label, "USD / share")),
  );
  const fresh = (quotes.filter(Boolean) as OilQuote[]).sort((a, b) => b.price - a.price);
  const cached = cacheGet<OilQuote[]>("oil-stocks");
  if (fresh.length >= OIL_STOCKS.length - 2) {
    cacheSet("oil-stocks", fresh);
    return { quotes: fresh, stale: false, asOf: Date.now() };
  }
  const bySym = new Map(fresh.map((q) => [q.symbol, q]));
  const merged = [...(cached?.value ?? []).map((old) => bySym.get(old.symbol) ?? old)];
  for (const f of fresh) if (!merged.some((m) => m.symbol === f.symbol)) merged.push(f);
  merged.sort((a, b) => b.price - a.price);
  if (merged.length > 0) cacheSet("oil-stocks", merged);
  return { quotes: merged, stale: merged.length > 0, asOf: cached?.at ?? Date.now() };
});
