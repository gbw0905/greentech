# Heat map for oil companies + live stock prices on the other charts

## What changes

**Top global oil companies** becomes a heat map instead of a bar list: a grid of tiles, one per company, where tile colour intensity encodes the selected measure (share price, 1-day change, annual capacity). Each tile shows the company name, ticker, price and 1-day change. Positive/negative days keep the existing green/red treatment for the change measure. Clicking a tile still opens that company's latest news, and the measure dropdown, status ("Live"/"Last close") and footnote stay as they are.

**Every other entity chart** (SAF airlines, shipping/trucking/rail carriers, fuel-station networks) gains a live stock price:
- Each listed company is mapped to its primary-listing ticker.
- The right-hand secondary line under the bar value shows the live price and 1-day change, coloured green/red.
- A new "Share price" option is added to each chart's measure dropdown so the bars themselves can be ranked by price.
- Companies with no public listing (state-owned, private, or subsidiaries such as Emirates, Girteka, Indian Railways, Pertamina, Indian Oil retail arms) show "Private / state-owned" instead of a price and are ranked last when sorting by price.

Prices refresh on the same five-minute cycle as the existing market data, and fall back to the last known good values when the feed is unavailable.

## Technical notes

- Add a generic `getEntityQuotesFn` server function (same Yahoo Finance loader and `market-cache.server` fallback already used by `oil.functions.ts`) that takes no input and returns quotes for the combined airline/carrier/station ticker set, cached server-side.
- Add ticker maps next to each dataset (`SafAirlinesPanel`, `CarriersPanel`, `BiofuelProductionPanel`), keyed by entity name.
- Add a `ChartHeat` component to `src/components/chart-kit.tsx` so the heat map shares the panel frame, fonts, formatter and news-click behaviour with the bar charts; `OilStocksPanel` switches from `ChartBars` to `ChartHeat`.
- Heat colour uses existing chart tokens (light-to-deep primary ramp) rather than hardcoded colours, with a small legend strip under the grid.
- Responsive: 2 columns on mobile, 4 on tablet, 5 on desktop.
