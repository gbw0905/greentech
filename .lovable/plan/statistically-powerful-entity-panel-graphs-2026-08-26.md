# Statistically powerful entity panel graphs

## Goal
Make the entity panels (Top 20 global oil companies, Top 20 SAF airlines, Top 20 biofuel producers, carriers/fuel-station network) visually persuasive and statistically rigorous, so readers can instantly see rankings, trends, uncertainty, and relationships.

## Current state
All entity panels use `ChartHeat` from `src/components/chart-kit.tsx`: a single-row heat map with RGB tile size tied to one metric, plus a share-price overlay. The tool has no trend history, no confidence/error layers, no normalization, and no comparison between two metrics at once.

## Proposed options

### Option A: Dual-metric scatter plots (recommended)
Replace each heat map with an interactive scatter plot where each entity is a bubble.
- X-axis: market-driven metric (e.g., share price, market cap, revenue).
- Y-axis: bioenergy-driven metric (e.g., SAF share %, annual capacity, biofuel production).
- Bubble size: third dimension (e.g., total production capacity, fleet size, number of stations).
- Color: country / region using the existing flag colors.
- Trend line / regression band: shows correlation between market and bioenergy performance.
- Statistically powerful because it exposes leaders, laggards, and outliers in one view.

### Option B: Normalized scorecards + composite index
Build a composite "bioenergy transition score" per entity.
- Normalize each metric to 0-100 (percentile ranking).
- Combine into a weighted score: market size, policy exposure, production/usage volume, and year-over-year momentum.
- Render as a stacked horizontal bar with color-coded segments (finance, policy, volume, momentum).
- Add error bands or data-quality badges where the source is estimated.
- Statistically powerful because it ranks on a defensible, transparent formula rather than a single number.

### Option C: Time-series + nowcast cards
Keep the current heat map but add a sparkline/trend line for each entity.
- Pull 30-day trailing price and 12-month trailing production/uptake estimates where available.
- Show a small sparkline under each entity name.
- Add a "momentum" column: annualized % change or z-score relative to sector median.
- Statistically powerful because it adds direction and volatility, not just a snapshot.

### Option D: Treemap / packed bubble layout with nested sectors
Group entities by country/region, then by sub-sector.
- Tile area = chosen metric (e.g., SAF volume, capacity).
- Color = metric performance (e.g., share price change %, green for up, red for down).
- Labels inside tiles show entity name and key value.
- Statistically powerful because it reveals market share concentration and geographic dominance.

## Recommended implementation plan
1. Pick one option (A is recommended for maximum insight).
2. Add a chart-type switcher (Heat map / Scatter / Scorecard / Trend) so users can toggle rather than losing the current view.
3. Add small info tooltips explaining each metric, source, and date.
4. Add a short "Methodology" note under each panel with the normalization formula or regression source.
5. Export CSV still works for every view.

## Technical details
- Use existing `chart-kit.tsx` as the framework; add one new component per option.
- For scatter plots, Recharts `ScatterChart` is already in the project.
- For composite indices, store weights in `src/lib/entity-scoring.ts` so they are versioned and documented.
- For trend lines, cache 30-day price history in a new table or use Yahoo Finance historical data via server function.
- Mobile: keep responsive by stacking axes or switching to a compact vertical layout below 640px.

## Scope
- Only the entity panels: `OilStocksPanel.tsx`, `SafAirlinesPanel.tsx`, `BiofuelProductionPanel.tsx` (or its successor), and `CarriersPanel.tsx`.
- No changes to policy feed, map, traffic, or subscription flow.
- Add chart-type switcher, not a full redesign of the page.

## Outcome
Entity panels will move from single-metric heat maps to multi-dimensional, statistically grounded visualizations that readers can trust and cite.
