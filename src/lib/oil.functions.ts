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
  const [wti, brent, spx] = await Promise.all([
    loadSymbol("CL=F", "WTI Crude", "/bbl"),
    loadSymbol("BZ=F", "Brent Crude", "/bbl"),
    loadSymbol("^GSPC", "S&P 500", "index"),
  ]);
  return { quotes: [wti, brent, spx].filter(Boolean) as OilQuote[] };
});
