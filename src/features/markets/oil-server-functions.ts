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
  granularity?: string;
};

interface YahooOilChart {
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: Array<number | null> }> };
  meta?: {
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    currency?: string;
    regularMarketTime?: number;
    dataGranularity?: string;
  };
}

async function loadSymbol(
  symbol: string,
  label: string,
  unit: string,
  range = "1mo",
): Promise<OilQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`,
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
      granularity: r.meta?.dataGranularity ?? "1d",
      updatedAt: r.meta?.regularMarketTime
        ? r.meta.regularMarketTime * 1000
        : (series.at(-1)?.t ?? Date.now()),
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

/** The ten listed biofuel businesses shown on the original Global Bioenergy Watch desk. */
export const BIOFUEL_STOCKS = [
  { symbol: "VLO", label: "Valero Energy", focus: "Ethanol · Renewable diesel" },
  { symbol: "BG", label: "Bunge Global", focus: "Biodiesel · Renewable feedstocks" },
  { symbol: "ADM", label: "Archer Daniels Midland", focus: "Ethanol · Biodiesel" },
  { symbol: "DAR", label: "Darling Ingredients", focus: "Renewable diesel · SAF" },
  { symbol: "NESTE.HE", label: "Neste", focus: "Renewable diesel · SAF" },
  { symbol: "VBK.DE", label: "Verbio", focus: "Biodiesel · Ethanol · Biomethane" },
  { symbol: "GPRE", label: "Green Plains", focus: "Ethanol" },
  { symbol: "AMTX", label: "Aemetis", focus: "Ethanol · Biodiesel · RNG" },
  { symbol: "GEVO", label: "Gevo", focus: "SAF · Renewable gasoline" },
  { symbol: "ALTO", label: "Alto Ingredients", focus: "Ethanol" },
] as const;

export const MARKET_HISTORY_RANGES = ["3mo", "1y", "5y", "max"] as const;
export type MarketHistoryRange = (typeof MARKET_HISTORY_RANGES)[number];

/** Load longer history only for a selected market and timeframe. */
export const getMarketHistoryFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const value = input as { symbol?: unknown; range?: unknown } | null;
    const symbol = value?.symbol;
    const range = value?.range;
    const allowed = [...MARKET_BENCHMARKS, ...BIOFUEL_STOCKS] as ReadonlyArray<{
      symbol: string;
      label: string;
      unit?: string;
    }>;
    if (
      typeof symbol !== "string" ||
      !allowed.some((market) => market.symbol === symbol) ||
      !MARKET_HISTORY_RANGES.includes(range as MarketHistoryRange)
    ) {
      throw new Error("Unsupported market or history range");
    }
    return { symbol, range: range as MarketHistoryRange };
  })
  .handler(async ({ data: { symbol, range } }) => {
    const { cacheGet, cacheSet } = await import("./server/market-cache.server");
    const cacheKey = `market-history:${symbol}:${range}`;
    const cached = cacheGet<OilQuote>(cacheKey);
    if (cached && Date.now() - cached.at < 5 * 60_000) {
      return { quote: cached.value, stale: false };
    }
    const market = [...MARKET_BENCHMARKS, ...BIOFUEL_STOCKS].find((item) => item.symbol === symbol);
    const quote = market
      ? await loadSymbol(symbol, market.label, "unit" in market ? market.unit : "per share", range)
      : null;
    if (quote?.series.length) {
      cacheSet(cacheKey, quote);
      return { quote, stale: false };
    }
    return { quote: cached?.value ?? null, stale: true };
  });

export const getBiofuelStocksFn = createServerFn({ method: "GET" }).handler(async () => {
  const { cacheGet, cacheSet } = await import("./server/market-cache.server");
  const cached = cacheGet<OilQuote[]>("biofuel-stocks");
  if (cached?.value.length === BIOFUEL_STOCKS.length && Date.now() - cached.at < 60_000) {
    return { quotes: cached.value, stale: false, asOf: cached.at };
  }
  const fetched = await Promise.all(
    BIOFUEL_STOCKS.map(({ symbol, label }) => loadSymbol(symbol, label, "per share")),
  );
  const fresh = fetched.filter((quote): quote is OilQuote => quote !== null);
  if (fresh.length === BIOFUEL_STOCKS.length) {
    cacheSet("biofuel-stocks", fresh);
    return { quotes: fresh, stale: false, asOf: Date.now() };
  }
  const quotes = BIOFUEL_STOCKS.flatMap(({ symbol }) => {
    const quote =
      fresh.find((item) => item.symbol === symbol) ??
      cached?.value.find((item) => item.symbol === symbol);
    return quote ? [quote] : [];
  });
  if (quotes.length > 0) cacheSet("biofuel-stocks", quotes);
  return { quotes, stale: true, asOf: cached?.at ?? Date.now() };
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
