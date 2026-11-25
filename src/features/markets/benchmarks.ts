/**
 * Benchmark prices shown on the home page and the ribbon. All five are daily
 * U.S. Energy Information Administration spot prices (public domain).
 * `code` is EIA's own series code, shown next to the name.
 */
export const MARKET_BENCHMARKS = [
  { symbol: "eia:wti", code: "EIA RWTC", label: "WTI Crude", unit: "/bbl", color: "#0e2a43" },
  { symbol: "eia:brent", code: "EIA RBRTE", label: "Brent Crude", unit: "/bbl", color: "#ba2849" },
  {
    symbol: "eia:henry-hub",
    code: "EIA RNGWHHD",
    label: "Henry Hub Gas",
    unit: "/MMBtu",
    color: "#8262b5",
  },
  {
    symbol: "eia:nyh-ulsd",
    code: "EIA NYH ULSD",
    label: "Diesel (NY Harbor ULSD)",
    unit: "/gal",
    color: "#178a6b",
  },
  {
    symbol: "eia:usgc-jet",
    code: "EIA USGC Jet",
    label: "Jet Fuel (US Gulf Coast)",
    unit: "/gal",
    color: "#2765a6",
  },
] as const;

export type MarketBenchmarkSymbol = (typeof MARKET_BENCHMARKS)[number]["symbol"];
