Switch calculator labels from uppercase to sentence case

The `label-mono` CSS utility (`src/styles.css`) is used for most calculator labels, buttons and small meta text, and it currently sets `text-transform: uppercase`. This makes the Carbon Intensity calculator look shouty and harder to read.

Change
- Remove `text-transform: uppercase;` from the `.label-mono` utility in `src/styles.css`.

Keep
- The mono font family, small size and letter-spacing.
- Any labels that are intentionally uppercase through other classes or explicit styling.

Verify
- Run a TypeScript check.
- Open `/ci-calculator` in the preview and confirm labels like "Fuel pathway", "Feedstock source", "Process energy sources", "Quantity", "Unit", and the detailed-section totals now render in normal/sentence case.
- Check one other page (e.g., a Supply & Producers panel) to make sure `label-mono` labels there also read normally and remain readable.
