# Add Global UCO (Used Cooking Oil) Suppliers Panel

## What you'll see

A new **"Global UCO suppliers"** panel inside the existing *Biofuel supply at the pump and top users* section (`#production`), stacked with the fuel stations, oil companies, SAF airlines and carriers panels. It shows the world's major used cooking oil collectors, aggregators and traders — the feedstock layer that supplies biodiesel, renewable diesel (HVO) and SAF producers.

The panel behaves exactly like the other entity charts on the site:

- **Heat map view** (default): tiles sized and colored by annual UCO collection/supply volume (thousand tonnes per year), RGB color scale, entity logos where available.
- **Scatter plot view**: volume vs. number of collection countries/sites with regression trend line.
- **Single-line toolbar**: view switch, measure dropdown, country filter, search, Export CSV, Email summary (ChartSummaryAssistant) — same as other panels.
- **Expand-when-filtered**: global top 10 by default; up to 20 matching suppliers when a country or search filter is active.
- **Live quotes**: listed suppliers (e.g. Darling Ingredients, Darling's DAR) show live share price and trend color via the existing entity-quote feed.
- **News links**: clicking a supplier opens its latest biofuel/UCO-related news via the existing entity-news helper.
- **Flags and country labels** on every tile, consistent with the other charts.

## Dataset

Curated list of ~30 major UCO suppliers/collectors worldwide with: name, country, flag, annual UCO volume (kt), collection footprint (sites or countries served), certification notes (ISCC, RED II Annex IX status), and region. Coverage spans:

- **North America**: Darling Ingredients, Mahoney Environmental, Baker Commodities, Restaurant Technologies, Greasezilla / others
- **Europe**: Olleco (UK), MBP Solutions, Brocklesby, Argent Energy feedstock arm, Saria/EEW, Quatra, Biokraft/ScanOcean, MVGM
- **Asia-Pacific**: China UCO exporters (major aggregators), Japanese collectors, Southeast Asia (Indonesia/Malaysia POME-adjacent UCO traders), Australia
- **Latin America / other**: Brazil and Argentina collectors where material

Figures are clearly labeled approximate with data-source references listed in the methodology/data-source registry, same pattern as existing panels.

## Technical details

1. **New file `src/components/UcoSuppliersPanel.tsx`** — mirrors the structure of `CarriersPanel.tsx`: typed `UcoSupplier` dataset, `ChartPanel` wrapper, `ChartHeat`/`ChartScatter`, `ChartFilterBar` with country options derived from the dataset, `useEntityQuotes` for live prices, `openEntityNews` for hyperlinks, `ExportCsvButton`, `ChartSummaryAssistant`.
2. **`src/lib/entity-tickers.ts`** — add `UCO_TICKERS` map (e.g. `Darling Ingredients: "DAR"`, `Bunge: "BG"`, private/unlisted collectors as `null`) and merge into `ALL_ENTITY_TICKERS`.
3. **`src/lib/data-sources.ts`** — add the UCO dataset references (company reports, ISCC certificates database, trade press) so the Email summary assistant cites sources.
4. **`src/routes/index.tsx`** — render `<UcoSuppliersPanel />` in the `#production` section stack below `<BiofuelProductionPanel />` (or alongside the other entity panels).
5. **Fonts, colors, sizing** come from `chart-kit.tsx` so the new panel matches all existing graphs automatically.

No database or backend changes; data is a curated static dataset like the other entity panels.
