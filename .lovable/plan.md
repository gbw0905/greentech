# Make the oil companies chart look professional

The current block reads as a decorative infographic, not market data: bars are thick rounded "blobs" with gradients and glow, rows are ~50px tall with big empty gaps, share prices in different currencies (INR, HKD, USD) are shown with a `$` sign and ranked against each other, and there is a wide dead column between the bars and the numbers.

## What changes

**Rebuild it as a financial data table, not a bar picture.**

- Tight rows (~34px), hairline separators, no gradient/glow/rounded blobs. A single flat 8px bar in one accent tone sitting behind or beside the label, used as a reference cue only.
- Columns, left to right: rank, company name, ticker + exchange (small, muted), listing currency price, 1-day change, annual capacity.
- All numbers right-aligned, mono tabular, same size. Labels in the sans face at one consistent size. No more mismatched font scales.
- Remove the empty gutter: the bar track spans the space it actually needs, numbers sit flush right.

**Fix the misleading ranking.**

- Default sort becomes annual output capacity (comparable across companies), not share price.
- Share price shows its real currency symbol per listing (INR, HKD, USD, GBp, etc.), never a blanket `$`.
- The Measure dropdown keeps price / 1-day change / capacity, but sorting follows the chosen measure and the axis label matches it.

**Header and framing.**

- Shorter, tighter intro line instead of the three-line paragraph.
- Column headers become a real header row (uppercase, small, muted) instead of floating SVG text like "Y AXIS · RANK & COMPANY".

**Same treatment applied to the neighbouring panels** so the page reads consistently: fuel stations, SAF airlines and carriers get the same row height, bar weight, and number alignment. The broken flag glyphs showing as empty boxes in the fuel-station rows get replaced with plain country codes.

## Technical notes

- `src/components/OilStocksPanel.tsx`: replace the SVG bar chart with an HTML table/grid layout (SVG text is what causes the inconsistent font rendering); add a currency map keyed by symbol; sort by the active measure.
- `src/components/BiofuelProductionPanel.tsx`, `SafAirlinesPanel.tsx`, `CarriersPanel.tsx`: align row height, bar style, and numeric alignment to the same shared classes in `src/styles.css`.
- No data-source or backend changes.
