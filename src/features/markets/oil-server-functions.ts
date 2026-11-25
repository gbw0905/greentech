import { MARKET_BENCHMARKS } from "./benchmarks";
import { createServerFn } from "@tanstack/react-start";
import type { OfficialSeries, PricePoint } from "./official/types";

/**
 * A benchmark price built from an official daily series.
 *
 * `updatedAt` is the date of the latest observation (UTC midnight), not the
 * time the page was served. `releasedAt` is the publisher's release date.
 */
export type OilQuote = {
  symbol: string;
  code: string;
  label: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  currency: string;
  unit: string;
  series: Array<{ t: number; c: number }>;
  updatedAt: number;
  releasedAt: number | null;
  granularity?: string;
  source: string;
  sourceUrl: string;
};

const DAY = 86_400_000;

function toQuote(
  benchmark: (typeof MARKET_BENCHMARKS)[number],
  series: OfficialSeries,
  points: PricePoint[],
  granularity = "1d",
): OilQuote | null {
  const all = series.points;
  const last = all[all.length - 1];
  if (!last) return null;
  const prev = all[all.length - 2] ?? last;
  return {
    symbol: benchmark.symbol,
    code: benchmark.code,
    label: benchmark.label,
    price: last.c,
    prevClose: prev.c,
    change: last.c - prev.c,
    changePct: prev.c ? ((last.c - prev.c) / prev.c) * 100 : 0,
    currency: "USD",
    unit: benchmark.unit,
    series: points,
    updatedAt: last.t,
    releasedAt: series.releasedAt,
    granularity,
    source: "U.S. Energy Information Administration",
    sourceUrl: series.sourceUrl,
  };
}

/** Keep the last point of each ISO week — used for multi-decade charts. */
function weekly(points: PricePoint[]): PricePoint[] {
  const out: PricePoint[] = [];
  let week = -1;
  for (const p of points) {
    const w = Math.floor((p.t / DAY + 3) / 7);
    if (w === week) out[out.length - 1] = p;
    else {
      out.push(p);
      week = w;
    }
  }
  return out;
}

/** Latest prices for the five EIA benchmarks with the last month of history. */
export const getOilPricesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getEiaSeries } = await import("./official/store.server");
  const { EIA_SERIES } = await import("./official/eia.server");
  const defs = Object.values(EIA_SERIES);
  const results = await Promise.allSettled(
    MARKET_BENCHMARKS.map((b) => getEiaSeries(defs.find((d) => d.id === b.symbol)!)),
  );
  let stale = false;
  const quotes: OilQuote[] = [];
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      stale = true;
      return;
    }
    if (result.value.stale) stale = true;
    const series = result.value.value;
    const cutoff = (series.points.at(-1)?.t ?? 0) - 31 * DAY;
    const quote = toQuote(
      MARKET_BENCHMARKS[index]!,
      series,
      series.points.filter((p) => p.t >= cutoff),
    );
    if (quote) quotes.push(quote);
  });
  const asOf = quotes.length ? Math.max(...quotes.map((q) => q.updatedAt)) : null;
  return { quotes, stale, asOf };
});

/** The ten listed biofuel businesses; quotes come from the TradingView widget. */
export const BIOFUEL_STOCKS = [
  { symbol: "NYSE:VLO", logo: "VLO", label: "Valero Energy", focus: "Ethanol · Renewable diesel" },
  {
    symbol: "NYSE:BG",
    logo: "BG",
    label: "Bunge Global",
    focus: "Biodiesel · Renewable feedstocks",
  },
  {
    symbol: "NYSE:ADM",
    logo: "ADM",
    label: "Archer Daniels Midland",
    focus: "Ethanol · Biodiesel",
  },
  {
    symbol: "NYSE:DAR",
    logo: "DAR",
    label: "Darling Ingredients",
    focus: "Renewable diesel · SAF",
  },
  { symbol: "OMXHEX:NESTE", logo: "NESTE.HE", label: "Neste", focus: "Renewable diesel · SAF" },
  {
    symbol: "FWB:VBK",
    logo: "VBK.DE",
    label: "Verbio",
    focus: "Biodiesel · Ethanol · Biomethane",
  },
  { symbol: "NASDAQ:GPRE", logo: "GPRE", label: "Green Plains", focus: "Ethanol" },
  { symbol: "NASDAQ:AMTX", logo: "AMTX", label: "Aemetis", focus: "Ethanol · Biodiesel · RNG" },
  { symbol: "NASDAQ:GEVO", logo: "GEVO", label: "Gevo", focus: "SAF · Renewable gasoline" },
  { symbol: "NASDAQ:ALTO", logo: "ALTO", label: "Alto Ingredients", focus: "Ethanol" },
] as const;

export const MARKET_HISTORY_RANGES = ["3mo", "1y", "5y", "max"] as const;
export type MarketHistoryRange = (typeof MARKET_HISTORY_RANGES)[number];

const RANGE_DAYS: Record<MarketHistoryRange, number | null> = {
  "3mo": 92,
  "1y": 366,
  "5y": 5 * 366,
  max: null,
};

/** Longer EIA history for one benchmark and timeframe. */
export const getMarketHistoryFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const value = input as { symbol?: unknown; range?: unknown } | null;
    const symbol = value?.symbol;
    const range = value?.range;
    if (
      typeof symbol !== "string" ||
      !MARKET_BENCHMARKS.some((market) => market.symbol === symbol) ||
      !MARKET_HISTORY_RANGES.includes(range as MarketHistoryRange)
    ) {
      throw new Error("Unsupported market or history range");
    }
    return { symbol, range: range as MarketHistoryRange };
  })
  .handler(async ({ data: { symbol, range } }) => {
    const { getEiaSeries } = await import("./official/store.server");
    const { EIA_SERIES } = await import("./official/eia.server");
    const benchmark = MARKET_BENCHMARKS.find((b) => b.symbol === symbol)!;
    const def = Object.values(EIA_SERIES).find((d) => d.id === symbol)!;
    try {
      const { value: series, stale } = await getEiaSeries(def);
      const days = RANGE_DAYS[range];
      const lastT = series.points.at(-1)?.t ?? 0;
      const points =
        days === null
          ? weekly(series.points)
          : series.points.filter((p) => p.t >= lastT - days * DAY);
      return {
        quote: toQuote(benchmark, series, points, days === null ? "1wk" : "1d"),
        stale,
      };
    } catch {
      return { quote: null, stale: true };
    }
  });
