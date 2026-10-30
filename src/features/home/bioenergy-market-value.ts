import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export interface BioenergyMarketValue {
  usd: number;
  year: number;
}

// Annual global market estimate, not a trade price or an intraday quote.
const SOURCE = "https://www.gminsights.com/industry-analysis/bioenergy-market";
const VERIFIED: BioenergyMarketValue = { usd: 151_000_000_000, year: 2025 };
export const BIOENERGY_MARKET_VALUE_BASELINE = VERIFIED;
const CACHE_MS = 24 * 60 * 60 * 1000;
let cached = VERIFIED;
let checkedAt = 0;

export const getBioenergyMarketValueFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<BioenergyMarketValue> => {
    if (Date.now() - checkedAt < CACHE_MS) return cached;
    try {
      const response = await fetch(SOURCE, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error("Market report unavailable");
      const text = (await response.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
      const match = text.match(/valuation of USD\s*([\d,.]+)\s*billion in\s*(20\d{2})/i);
      if (match) {
        const usd = Number(match[1]!.replaceAll(",", "")) * 1_000_000_000;
        const year = Number(match[2]);
        if (
          Number.isFinite(usd) &&
          usd > 0 &&
          year >= cached.year &&
          year <= new Date().getUTCFullYear()
        )
          cached = { usd, year };
      }
    } catch {
      // Retain the dated, verified estimate when the publisher cannot be reached.
    }
    checkedAt = Date.now();
    return cached;
  },
);

export const bioenergyMarketValueQuery = queryOptions({
  queryKey: ["global-bioenergy-market-value"],
  queryFn: () => getBioenergyMarketValueFn(),
  staleTime: CACHE_MS,
  refetchInterval: CACHE_MS,
});
