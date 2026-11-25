import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export interface BioenergyMarketValue {
  usd: number;
  year: number;
}

// Annual global market estimate, not a trade price or an intraday quote.
// Cited from the publisher's public report summary (Global Market Insights,
// "Bioenergy Market" report). The figure is typed in by hand and only changes
// when someone re-checks the report — we do not scrape the publisher's site.
export const BIOENERGY_MARKET_VALUE_SOURCE =
  "https://www.gminsights.com/industry-analysis/bioenergy-market";
const VERIFIED: BioenergyMarketValue = { usd: 151_000_000_000, year: 2025 };
export const BIOENERGY_MARKET_VALUE_BASELINE = VERIFIED;
const CACHE_MS = 24 * 60 * 60 * 1000;

export const getBioenergyMarketValueFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<BioenergyMarketValue> => VERIFIED,
);

export const bioenergyMarketValueQuery = queryOptions({
  queryKey: ["global-bioenergy-market-value"],
  queryFn: () => getBioenergyMarketValueFn(),
  staleTime: CACHE_MS,
  refetchInterval: CACHE_MS,
});
