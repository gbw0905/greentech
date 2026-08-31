# Cascading "Supply & producers" section

## Goal
Replace the current stack of five always-open panels (fuel stations, UCO suppliers, oil companies, SAF airlines, carriers) with a cascading drill-down: users first see a compact overview of the five datasets, click one, and get a focused workspace for that dataset alone with several ways to look at the data.

## Level 1 — Overview grid
A responsive grid of five selector cards, one per dataset:
- Icon + title (Fuel stations, UCO suppliers, Oil companies, SAF airlines, Carriers)
- One-line description, entity count, and a headline stat (e.g. top entity by the default metric)
- A tiny inline preview (mini bar strip of the top 5) so each card already says something
- Hover/active states use the existing section tone colours; nothing expanded by default

## Level 2 — Focused workspace
Clicking a card cascades open a full-width workspace below the grid (the grid collapses to a compact row of tabs so switching datasets is one click, plus a "Back to all" control). The workspace shows only that dataset, with:
- View switcher: Heat map, Scatter, Ranked bars, Table
- Existing controls kept in one line: measure dropdown, country filter, search, Export CSV, Email summary
- The existing "expand when filtered" behaviour (top 10 default, up to 20 when filtered) stays
- Source citations and the AI Chart Summary Assistant stay attached to the focused panel

## Level 3 — Entity detail
Clicking a tile/point/bar opens a slide-over with that entity's logo, all metrics, live share price where listed, country, and links to its latest news — instead of navigating away.

## Behaviour details
- Selection is reflected in the URL (e.g. `?supply=uco`) so a view can be linked and survives refresh
- Smooth expand/collapse transition; on mobile the grid becomes a single column and the workspace stacks full width
- Keyboard accessible: cards are buttons, tabs use arrow keys, slide-over closes on Escape

## Technical notes
- New `src/components/SupplyProducersSection.tsx` holds the registry of the five panels, the overview grid, tab row, and workspace shell.
- Existing panels (`BiofuelProductionPanel`, `UcoSuppliersPanel`, `OilStocksPanel`, `SafAirlinesPanel`, `CarriersPanel`) are kept but refactored to expose their dataset + metric config so the shell can render overview stats without duplicating data.
- Two new views added to `src/components/chart-kit.tsx`: `ChartRankedBars` and `ChartTable`, matching current typography, height, and colour tokens.
- `src/routes/index.tsx` `#production` section renders the new shell instead of the five stacked panels.
- No data-source, ingestion, or backend changes.
