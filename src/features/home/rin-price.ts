import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export interface RinPrice {
  usdPerRin: number;
  asOf: string;
  stale: boolean;
}

const NESTE_RIN_MONITOR = "https://ir-service.funkton.com/v/nesteoil/monitor/RIN/en";
const CACHE_MS = 15 * 60 * 1000;
let lastQuote: RinPrice | null = null;
let fetchedAt = 0;

export const getRinPriceFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<RinPrice | null> => {
    if (lastQuote && Date.now() - fetchedAt < CACHE_MS) return lastQuote;
    try {
      const response = await fetch(NESTE_RIN_MONITOR, {
        headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error("RIN price feed unavailable");
      const html = await response.text();
      const points = [
        ...html.matchAll(
          /new Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)\},\s*\{v\s*:\s*(\d+(?:\.\d+)?)/g,
        ),
      ];
      const latest = points.at(-1);
      if (!latest) throw new Error("RIN price feed format changed");
      const year = Number(latest[1]);
      const month = Number(latest[2]);
      const day = Number(latest[3]);
      const rawPrice = Number(latest[4]);
      const date = new Date(Date.UTC(year, month, day));
      // The public chart's data points are in US cents even though its series label says USD/RIN.
      const usdPerRin = rawPrice > 10 ? rawPrice / 100 : rawPrice;
      if (
        !Number.isFinite(usdPerRin) ||
        usdPerRin <= 0 ||
        usdPerRin > 5 ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month ||
        date.getUTCDate() !== day
      )
        throw new Error("Invalid RIN quote");
      lastQuote = {
        usdPerRin,
        asOf: date.toISOString().slice(0, 10),
        stale: Date.now() - date.getTime() > 14 * 24 * 60 * 60 * 1000,
      };
      fetchedAt = Date.now();
      return lastQuote;
    } catch {
      return lastQuote ? { ...lastQuote, stale: true } : null;
    }
  },
);

export const rinPriceQuery = queryOptions({
  queryKey: ["rin-d4-price"],
  queryFn: () => getRinPriceFn(),
  staleTime: CACHE_MS,
  refetchInterval: CACHE_MS,
  refetchOnWindowFocus: true,
});
