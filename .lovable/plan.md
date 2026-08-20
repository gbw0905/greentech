# Full country list in heat-map filters, top 10 leaders by default

## What changes for users

**1. Country dropdown covers every tracked jurisdiction**

Today each heat map's "Country" dropdown only lists countries that happen to appear in that panel's own dataset (for example the oil panel lists only the home countries of the 20 majors). It will instead list every jurisdiction the tracker follows — all countries with a biofuel mandate, policy framework or in-development framework, plus every country that appears as a producer, station network, airline or carrier.

- Options show the country flag with the name, e.g. `🇧🇷 Brazil`.
- Countries with no listed entity in that panel are still shown, grouped under a "No listed entities" group and marked, so users can see the jurisdiction is tracked without a confusing empty result.
- Picking such a country shows a short empty-state line pointing to that country's profile page instead of a blank chart.

**2. Heat map shows the top 10 global market leaders by default**

Each heat map renders the top 10 entities by the selected measure instead of the full 20+ list, so tiles stay large and readable.

- A new "Show" dropdown next to the measure selector offers **Top 10 (default) / Top 20 / All**.
- Changing the measure re-ranks the top 10 for that measure, so the dropdown becomes an exploration tool.
- When a country or fuel filter is applied, ranking happens inside the filtered set.
- The counter in the filter bar reads `showing 10 of 34 matches` so it is clear the view is trimmed.

## Technical notes

- `src/lib/policy-taxonomy.ts` already exports `COUNTRIES` (with `name`, `flag`, `status`) and `COUNTRY_FLAG`. Add a small helper that returns the merged, sorted country option list: tracked jurisdictions ∪ dataset countries.
- `src/components/chart-filters.tsx`: extend `SelectFilter` to accept richer options (`{ value, label, disabled?, group? }`) so flags and the "no listed entities" group can render via `<optgroup>`; keep the existing plain-string form working. Extend `useChartFilter` to accept an `extraOptionsA` list merged into `optionsA`.
- `src/components/chart-kit.tsx`: add an optional `limit` control to `ChartPanel`'s header (reuse the existing dark `chart-select` styling) and let panels slice their sorted item list before passing it to `ChartHeat`. Trend strip, colour scale and CSV export continue to reflect the rows actually shown, with the export offering the full filtered set.
- Apply in `OilStocksPanel.tsx`, `SafAirlinesPanel.tsx`, `BiofuelProductionPanel.tsx`, `CarriersPanel.tsx` — all four use the same filter hook, so the change is uniform.
- Presentation-only; no data model, ingestion or backend changes.
