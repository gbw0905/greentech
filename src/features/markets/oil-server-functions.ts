import { MARKET_BENCHMARKS } from "./benchmarks";
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

interface YahooOilChart {
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: Array<number | null> }> };
  meta?: { regularMarketPrice?: number; chartPreviousClose?: number; currency?: string };
}

async function loadSymbol(symbol: string, label: string, unit: string): Promise<OilQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: YahooOilChart[] } };
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
    if (typeof price !== "number" || !Number.isFinite(price)) return null;
    const prevClose = series[series.length - 2]?.c ?? r.meta?.chartPreviousClose ?? price;
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
  const { cacheGet, cacheSet } = await import("./server/market-cache.server");
  const cached = cacheGet<OilQuote[]>("oil-prices");
  const recentComplete = cacheGet<OilQuote[]>("oil-prices-complete");
  if (recentComplete && Date.now() - recentComplete.at < 60_000) {
    return { quotes: recentComplete.value, stale: false, asOf: recentComplete.at };
  }
  const results = await Promise.all(
    MARKET_BENCHMARKS.map(({ symbol, label, unit }) => loadSymbol(symbol, label, unit)),
  );
  const fresh = results.filter((quote): quote is OilQuote => quote !== null);
  if (fresh.length === MARKET_BENCHMARKS.length) {
    cacheSet("oil-prices", fresh);
    cacheSet("oil-prices-complete", fresh);
    return { quotes: fresh, stale: false, asOf: Date.now() };
  }
  // Market feed partially/fully unavailable: keep the most recent good data.
  const merged = (cached?.value ?? []).map(
    (old) => fresh.find((f) => f.symbol === old.symbol) ?? old,
  );
  for (const f of fresh) if (!merged.some((m) => m.symbol === f.symbol)) merged.push(f);
  if (merged.length > 0) cacheSet("oil-prices", merged);
  return { quotes: merged, stale: true, asOf: cached?.at ?? Date.now() };
});

/** Listed oil & gas companies worldwide, by their primary listing (global coverage). */
const OIL_STOCKS: Array<[string, string]> = [
  ["2222.SR", "Saudi Aramco"],
  ["XOM", "ExxonMobil"],
  ["CVX", "Chevron"],
  ["SHEL", "Shell"],
  ["TTE", "TotalEnergies"],
  ["BP", "BP"],
  ["0857.HK", "PetroChina"],
  ["0386.HK", "Sinopec"],
  ["0883.HK", "CNOOC"],
  ["COP", "ConocoPhillips"],
  ["PBR", "Petrobras"],
  ["E", "Eni"],
  ["EQNR", "Equinor"],
  ["RELIANCE.NS", "Reliance Industries"],
  ["ONGC.NS", "ONGC"],
  ["OXY", "Occidental Petroleum"],
  ["PSX", "Phillips 66"],
  ["MPC", "Marathon Petroleum"],
  ["SU", "Suncor Energy"],
  ["CNQ", "Canadian Natural"],
  ["VLO", "Valero Energy"],
  ["EOG", "EOG Resources"],
  ["DVN", "Devon Energy"],
  ["FANG", "Diamondback Energy"],
  ["HES", "Hess Corporation"],
  ["APA", "APA Corporation"],
  ["CVE.TO", "Cenovus Energy"],
  ["IMO.TO", "Imperial Oil"],
  ["REP.MC", "Repsol"],
  ["OMV.VI", "OMV"],
  ["GALP.LS", "Galp Energia"],
  ["PKN.WA", "Orlen"],
  ["MOL.BD", "MOL Group"],
  ["NESTE.HE", "Neste"],
  ["1605.T", "Inpex"],
  ["5020.T", "Eneos Holdings"],
  ["096770.KS", "SK Innovation"],
  ["010950.KS", "S-Oil"],
  ["PTT.BK", "PTT"],
  ["IOC.NS", "Indian Oil"],
  ["BPCL.NS", "Bharat Petroleum"],
  ["HINDPETRO.NS", "Hindustan Petroleum"],
  ["YPF", "YPF"],
  ["EC", "Ecopetrol"],
  ["SOL.JO", "Sasol"],
  ["WDS", "Woodside Energy"],
  ["STO.AX", "Santos"],
];

export const getOilStocksFn = createServerFn({ method: "GET" }).handler(async () => {
  const { cacheGet, cacheSet } = await import("./server/market-cache.server");
  const quotes = await Promise.all(
    OIL_STOCKS.map(([sym, label]) => loadSymbol(sym, label, "per share")),
  );
  const fresh = (quotes.filter(Boolean) as OilQuote[]).sort((a, b) => b.price - a.price);
  const cached = cacheGet<OilQuote[]>("oil-stocks");
  if (fresh.length >= Math.floor(OIL_STOCKS.length * 0.8)) {
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
