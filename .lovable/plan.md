# Heat map summary assistant

Add an AI "Summarise" assistant to every heat map panel (oil companies, airlines, biofuel producers/stations, carriers). It writes a comprehensive analyst summary of exactly what the user is looking at, shows it on screen, and can email it.

## What the user sees

- A **Summarise** button next to Export CSV in each panel header.
- Clicking it opens a summary card under the chart: a short "what was analysed" line (measure, filters, number of entities), then a streaming 350–450 word analyst write-up covering leaders, laggards, the 1-day market trend, country/type concentration, and what to watch next.
- Buttons in the card: **Copy**, **Regenerate**, and **Email me this summary** (email input + send, confirmation inline).
- Standard AI caution line matching the existing methodology disclosure.

## Scope of the summary

The summary is built from the **current view only**: the selected measure, the active search/country/type filters, and the rows currently shown (Top 10 / 20 / All), including each entity's value, share price and 1-day change where available.

## Technical notes

- New `src/lib/summary.functions.ts` with two server functions:
  - `summariseChartFn` — takes a compact payload (panel title, measure label + unit, filter description, ranked rows with value/price/changePct, trend aggregates) and calls the Lovable AI Gateway, streaming the response back. Model: a current Gemini Flash chat model, same gateway pattern as `src/lib/ai-brief.server.ts`. Prompt rules mirror the existing brief prompt: plain prose, no invented figures, 350–450 words.
  - `emailChartSummaryFn` — validates the address, then sends via the existing `sendTemplateEmail` helper.
- New email template `src/lib/email-templates/chart-summary.tsx` registered in `registry.ts`; subject "Global Bioenergy Market and Policy Updates — <date>" style, consistent with existing templates. Renders the panel title, measure, filter line, the summary prose, and a link back to the site.
- New shared UI component `src/components/ChartSummaryAssistant.tsx` holding the button, result card, copy/regenerate, and email box. Rendered through the existing `actions`/footer slots of `ChartPanel` so all panels get identical styling.
- Each panel passes a `summary` payload builder (same data it already builds for CSV export) — no changes to data fetching or chart logic.
- Rate guard: one in-flight request per panel; gateway 429/402 errors surfaced as a readable message in the card rather than a silent failure.
