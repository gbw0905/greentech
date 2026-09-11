# Add charts to the CI Excel export

## What will change
- Add a lifecycle contribution chart to the Calculation sheet, using the exported emission line items and preserving negative credits below zero.
- Add a regulatory comparison chart showing pathway CI beside each applicable program benchmark.
- Keep both charts branded and positioned after the calculation tables without changing the existing three-sheet structure.

## Technical details
- Extend the workbook specification to accept chart data for selected sheets.
- Build native Excel column charts with labeled axes, legends, and RGB series colors.
- Use the same calculated values already shown in the website and workbook tables.
- Verify the generated workbook opens correctly and contains both charts.
