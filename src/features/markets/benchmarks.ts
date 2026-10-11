/** Shared by the feed and its cards so every displayed benchmark is requested. */
export const MARKET_BENCHMARKS = [
  { symbol: "CL=F", label: "WTI Crude", unit: "/bbl", color: "#0e2a43" },
  { symbol: "BZ=F", label: "Brent Crude", unit: "/bbl", color: "#ba2849" },
  { symbol: "^GSPC", label: "S&P 500", unit: "index", color: "#178a6b" },
  { symbol: "^NYA", label: "NYSE Composite", unit: "index", color: "#2765a6" },
  { symbol: "NG=F", label: "Natural Gas", unit: "/MMBtu", color: "#8262b5" },
] as const;
