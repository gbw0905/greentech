# CI calculator — blank fields with grey default hints, CI on entry

## What you asked for
- Every numeric field in the carbon intensity calculator starts **blank**, showing its default value as grey placeholder text (so users can see the typical value and the unit, but nothing is pre-filled).
- The result area shows a prompt such as "Enter your values to calculate the carbon intensity" instead of a number until the user types at least one value.
- Once the user enters values, the CI calculates live: entered values are used as typed, and untouched fields silently fall back to their default (placeholder) values so the calculation always works.

## What changes

### 1. `src/components/PathwayCiBuilder.tsx`
- Rework the shared `Num` input component so it tracks "touched" state per field:
  - Field renders empty (`value=""`) until the user types; the current default appears as grey `placeholder` text (with the unit in the label/hint where it isn't already).
  - `onChange` marks the field touched and stores the typed number; clearing the field returns it to blank + placeholder.
  - The calculation keeps receiving the effective value: `touched ? typedValue : defaultValue` — so untouched fields behave exactly as today.
- Touched state lives in a single `Set`/record keyed by field id in `PathwayCiBuilder`, reset when the user switches pathway (new pathway = fresh blank fields with the new pathway's defaults as hints).
- Applies to all numeric inputs: annual volume, process energy quantities, feedstock production inputs, transport leg distances/shares, chemical and co-product doses, distribution and tailpipe fields, and the dairy RNG farm model fields (herd counts, manure rates, distances, energy).
- Non-numeric controls (dropdowns for pathway, units, modes, digester type, toggles) are unchanged — they keep their current selections.

### 2. Result area prompt
- In `PathwayCiBuilder`, gate the CI headline, breakdown charts, emissions table and program comparison on "at least one field touched":
  - Before any entry: show a calm empty state — "Enter your values in any field above to calculate the carbon intensity. Grey values show the defaults that will be used for anything you leave blank."
  - After the first entry: calculate and display everything exactly as now.
- The premium/owner/free access rules are unchanged (free users still see only the headline value, premium the full breakdown, owner the edit controls).

### 3. Excel export
- The export keeps working as today and exports the **effective** values (typed values plus defaults for blank fields) with live formulas — no change needed to `excel-workbook.ts` beyond confirming it reads the effective inputs.

## Verification
- Playwright at 1280px and 390px (signed in as owner): open `/ci-calculator`, confirm all numeric fields are blank with grey hints and the prompt shows instead of a CI number; type into one field and confirm the CI appears and updates; clear a field and confirm it returns to blank with its hint; switch pathway and confirm fields reset to blank with the new defaults; run the Excel export with some fields left blank.
- Check no NaN or 0-division warnings in the console.

## Technical notes
- Only `PathwayCiBuilder.tsx` needs real changes (Num component + touched-set + result gating). `ci-model.ts` and `rng-dairy.ts` stay untouched — they already receive plain numbers.
- Edge cases handled: empty string never reaches the model (defaults substituted), negative/zero entries still validate as today, and the dairy RNG override continues to replace generic sections when enabled.
