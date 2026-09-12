# Fix negative CI in regulatory comparison chart

## Goal
Make net-negative pathways, such as dairy RNG, visually accurate in the Regulatory program comparison chart.

## Changes
- Replace the positive-only chart scale with a signed range covering both the lowest pathway CI and highest program benchmark.
- Draw an explicit zero baseline, with positive bars extending upward and negative pathway bars extending downward.
- Position tick labels and bars from the same plot dimensions so values align correctly with the axis.
- Preserve the existing paired pathway-versus-benchmark layout, labels, colors, and below/above comparison summaries.

## Validation
- Verify a dairy RNG scenario shows a clearly visible negative bar below zero.
- Verify a positive-CI pathway still renders correctly against program benchmarks.
- Check desktop and 390px mobile layouts for overflow and label overlap.
- Resolve the confirmed monitoring finding after validation.

## Technical details
The chart will derive a shared signed domain, convert values to pixel positions through one scale function, and use the calculated zero position as each bar's anchor. No lifecycle-calculation values or regulatory benchmark data will change.
