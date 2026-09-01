# Real datasets for the biofuel panels + a Data Sources page

## Goal
Replace the curated placeholder estimates behind all nine entity panels with verified figures taken from public reports, each carrying a citation and a reporting year, and publish a `/data-sources` page that documents, panel by panel, exactly where every number comes from.

## Part 1 — Verified data for all nine panels

Panels in scope:
1. Top global fuel stations selling biofuels
2. Global UCO suppliers
3. Top global oil companies
4. Top airlines using SAF
5. Carriers (shipping / trucking / rail)
6. Blending terminals and capacity
7. Global ethanol production
8. Marine biofuel suppliers and users
9. Biofuel power generators

For each panel:
- Research the current published figures for every entity from primary public sources — company annual reports and sustainability reports, EIA, IEA, EPA RFS/EMTS, RFA plant registry, ePURE, UNICA/CONAB, ISCC certificate database, MPA Singapore and Port of Rotterdam bunker statistics, IRENA/Ember for generation.
- Replace each entity's metric values with the researched figure.
- Attach per-entity provenance: reporting year, the source organisation, and a link to the source document.
- Drop entities where no defensible public figure exists; add notable entities that the public data shows are missing.
- Where a metric is genuinely an estimate (e.g. a derived blend share), keep it but mark it as an estimate rather than presenting it as a reported figure.

Panel UI changes stay minimal: entity detail sheets and CSV exports gain a "Source" and "Reporting year" field, and each panel footnote states the vintage of its data (e.g. "Figures as reported for FY2025").

Live share prices continue to come from the existing market-data feed — unchanged.

## Part 2 — Data Sources page

New route `/data-sources`, linked from the top navigation and from a "Sources" link on each panel.

Structure — one section per panel:
- Panel name and a one-line description of what the dataset measures
- What each metric means and its unit
- Source list with organisation, document title, link, and publication/reporting year
- Coverage and known limitations (what is excluded, why)
- Last reviewed date

The page opens with a short methodology preamble (how entities are selected, how estimates are marked) and closes with the existing cross-verification disclaimer.

## Technical notes
- Per-entity data moves out of inline component arrays into typed dataset modules under `src/lib/datasets/` (one per panel), each exporting the rows plus a `DatasetMeta` record (sources, reporting year, last reviewed). Panels import from there; their chart, filter, and detail logic is untouched.
- `src/lib/data-sources.ts` becomes a thin re-export over the per-dataset `DatasetMeta`, so exports, AI summaries, and the new page all read the same source list — no duplicated citation text.
- New `src/routes/data-sources.tsx` renders every `DatasetMeta` generically, so adding a future panel automatically adds its section.
- Route gets its own `head()` metadata; nav link added in `PageShell`.
- Research is done with web search against primary sources; no backend, ingestion, or schema changes.

## What this does not do
- No live API for entity-level biofuel volumes — those have no free public feed, so they remain sourced-but-static, refreshed by editing the dataset modules.
