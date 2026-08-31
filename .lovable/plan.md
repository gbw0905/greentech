# Market Watchlist — "Which stocks are worth watching?"

The site cannot (and legally should not) tell users which stocks to buy. Instead, we add a data-driven **Market Watchlist** feature next to the Crude Oil, Equities & Gold panel that ranks the already-tracked oil, biofuel, airline, and marine companies using live market signals, plus an AI outlook note — all under a clear "educational, not investment advice" notice.

## What users see

A new **Market watchlist** card placed directly beside/below the "Benchmark markets" (Crude Oil, S&P 500, Gold) panel:

1. **Signal-ranked list** of the ~90 tickers already tracked on the site (oil majors, biofuel producers, airlines, marine/shipping), grouped by sector tab (All / Oil / Biofuel / Airlines / Marine):
   - **Momentum**: 1-day and ~1-month price change (from the existing Yahoo Finance chart series).
   - **Relative strength**: each stock's 1-month return vs. WTI crude, S&P 500 and Gold — "outperforming the market" / "lagging" badges.
   - **Trend label**: Rising / Flat / Falling, computed from the price series slope.
   - Sector filter, CSV export, and the existing email-summary assistant reuse (`ChartSummaryAssistant`).
2. **AI market outlook** note (200–300 words) generated on demand via Lovable AI (`google/gemini-3.1-flash-lite`): a neutral sector read using live prices + the latest tracked policy/market updates, explicitly framed as context, not picks. Regenerate button, cached ~1 hour server-side.
3. **Prominent disclaimer bar**: "Educational signals only — not investment advice. Markets carry risk; always do your own research or consult a licensed adviser." placed inside the card and repeated in any emailed summary.

## Data

- Reuses the existing market fetch pipeline: `src/lib/oil.functions.ts` (benchmarks incl. 1-month series) and `src/lib/entity-quotes.server.ts` (all tickers via `ALL_ENTITY_TICKERS`).
- No new external APIs; extends `entity-quotes.server.ts` to also return a 1-month series per ticker (Yahoo `range=1mo`) so momentum/trend can be computed, with the existing last-known-good `market-cache.server.ts` fallback.

## Files

| File | Change |
|---|---|
| `src/lib/entity-quotes.server.ts` | Add 1-month close series to `EntityQuote` |
| `src/lib/market-watchlist.server.ts` (new) | Compute momentum, relative strength, trend; AI outlook generation (gateway call, cached) |
| `src/lib/market-watchlist.functions.ts` (new) | `getMarketWatchlistFn` (quotes+signals) and `getMarketOutlookFn` (AI note) |
| `src/components/MarketWatchlistPanel.tsx` (new) | Sector tabs, ranked signal table, AI outlook card, disclaimer, export/email buttons |
| `src/routes/index.tsx` | Place the panel next to the Benchmark markets section |
| `src/lib/data-sources.ts` | Cite Yahoo Finance + benchmark sources |

## Compliance guardrails

- No "buy/sell" verbs anywhere in UI copy or AI prompts — the prompt instructs the model to describe signals only and never recommend purchases.
- Disclaimer text appears in the panel, the CSV export note, and email summaries.
