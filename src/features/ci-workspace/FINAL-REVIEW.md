# Calculator final review — 15 October 2026

Scope: local `/ci-workspace` and `/credit-calculator`, their shared engines, private account history and Excel reports. This review changes the local project. It does not certify the original live website or a regulatory pathway.

## Confirmed corrections

| Area                           | Problem                                                                                                                           | Corrected behavior / example                                                                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dairy example inventory        | Two livestock groups allocated 82.17% to anaerobic storage plus 25.30% elsewhere: 107.47% total.                                  | Example now allocates 74.70% + 25.30% = 100%. Default modeled CI changes from −183.5583865279 to −181.3473711766 gCO2e/MJ. This is an internally consistent example, not a measured inventory. User inputs above 100% are rejected, never silently normalized. |
| Dairy ledger                   | Avoided-methane and diverted-CO2 rows displayed dispensable energy although their inherited formulas use injected RNG LHV energy. | Displayed divisor and sign now match the actual calculation. Each ledger row reconciles with activity × factor ÷ divisor × allocation × sign. This metadata correction alone does not change the inherited core credit formula.                                |
| Methane inventory              | Methane sent to upgrading could exceed raw methane production.                                                                    | Invalid inventory is blocked. Required blank/nonfinite farm values are also blocked.                                                                                                                                                                           |
| Editable stage formulas        | Negative signed direct terms were dropped; zero allocation was treated as one; overflow could silently retain an old row.         | Signed terms remain editable; zero stays zero; invalid physical activity/factors and numeric overflow return errors.                                                                                                                                           |
| Scope display / Excel          | Combined grid electricity and combustion energy were assigned entirely to Scope 2; avoided credits were netted into Scope 3.      | Purchased grid electricity is separated from combustion; gross lifecycle scopes and signed adjustments are separate and reconcile with total CI. This remains indicative lifecycle allocation, not a verified corporate inventory.                             |
| Oregon comparison              | Outdated 2026/2027 standards.                                                                                                     | Gasoline/diesel: 2026 = 84.92 / 90.40; 2027 = 82.99 / 88.34 gCO2e/MJ. California and Washington reference values independently cross-checked.                                                                                                                  |
| Inactive credit programs       | Blank inactive inputs produced NaN-derived outputs and could block a valid single-program calculation/export.                     | LCFS-only and RFS-only runs validate the active program. Inactive derived metrics are null; inactive blank inputs export as null. Positive physical fuel energy remains required for liquids.                                                                  |
| Eligibility / malformed inputs | Truthy strings could act as confirmations; malformed states or inherited fuel-property names could bypass early checks.           | Strict boolean confirmations, own-key fuel lookup, finite-number/range checks and clear errors.                                                                                                                                                                |
| History restore                | A cached iframe could finish before the parent attached its listener; success was reported before restoration was acknowledged.   | Explicit readiness handshake and request-matched acknowledgement. Old invalid inputs restore for review with clear validation; original historical results are retained.                                                                                       |

## Independent arithmetic samples

1. Renewable diesel, 2026, 1,000,000 US gal, 131 MJ/gal, CI 30, diesel benchmark 80.17, EER 1, 100% eligible:
   - Fuel energy = 131,000,000 MJ.
   - LCFS = (80.17 × 1 − 30) × 131,000,000 ÷ 1,000,000 = **6,572.27 tonnes**.
   - D4 assumed from an approved pathway; standard 2026 factor 1.7 gives **1,700,000 RINs**. The energy threshold and eligibility still apply.
   - At USD 75/tonne: **USD 492,920.25**; at USD 1/RIN: **USD 1,700,000**. Combined value remains unavailable until both eligibility assumptions are confirmed.
2. Same fuel quantity, 2027: standard RD factor 1.5 gives **1,500,000 RINs**. LCFS year benchmark changes independently.
3. Corrected dairy example: gross 163.5883575158 + adjustments (−344.9357286923) = **−181.3473711766 gCO2e/MJ**. The five-month energy is annualized by 12/5; it is not incorrectly divided by annual energy in period-specific rows.

## Verification

- `npm run test:calculators`: **71 passing tests**. Includes 43 pathway regression cases, custom-emission normalization, unit round trips, dairy allocation/gas bounds, ledger reconciliation, signed/zero overrides, overflow, LCFS deficits/EER, gallon/litre and RNG LHV/HHV conversions, RIN year factors, single-program blanks, strict eligibility and benchmark tables.
- The 43-pathway fixtures establish migration consistency; they do not independently validate every inherited emission factor. The dairy fixture was deliberately updated for its corrected example allocation.
- TypeScript, scoped ESLint, Prettier formatting, production build and diff whitespace checks all passed before handoff.
- Browser: corrected dairy run saved to the account; older invalid dairy run restored with allocation errors; valid current run restored and recalculated. Credit sample saved and visible alongside CI runs in the profile; opening it from the profile restored and recalculated the saved inputs.
- Browser exports: seven-sheet CI report and five-sheet Credit/RIN report downloaded. ExcelJS checks confirm Aptos, frozen headings, numeric precision, matching credit totals and scope/adjustment reconciliation.

## Sources and limits

- [EPA 40 CFR 80.1415](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-80/subpart-M/section-80.1415): current equivalence factors and RNG energy basis.
- [EPA 2026/2027 final rule, amendment 17](https://www.federalregister.gov/documents/2026/04/01/2026-06275/renewable-fuel-standard-rfs-program-standards-for-2026-and-2027-partial-waiver-of-2025-cellulosic): RD change effective January 2027.
- [CARB annual reporting benchmark schedule](https://ww2.arb.ca.gov/sites/default/files/classic/fuels/lcfs/workshops/lcfswebinar_2025_annual_report.pdf), slide 37: California 2026/2027 gasoline/diesel standards.
- [Oregon DEQ 2-2025 adopted filing](https://ormswd2.synergydcs.com/HPRMWebDrawer/Record/6864923/File/document), Tables 1–2; [DEQ standards update explanation](https://ormswd2.synergydcs.com/HPRMWebDrawer/Record/6773512/File/document): Oregon updated schedule. Adopted filing reviewed in the earlier research pass; direct refetch intermittently timed out during final QA.
- [Washington WAC 173-424-900](https://apps.leg.wa.gov/wac/default.aspx?cite=173-424-900), Tables 1–2.
- [GHG Protocol Scope 2 Guidance](https://ghgprotocol.org/scope-2-guidance): purchased electricity classification. [Avoided-emissions accounting guidance](https://ghgptechassistance.zendesk.com/hc/en-us/articles/37994007816340-What-about-accounting-for-reductions-outside-of-scope-3): avoided emissions separate from inventory scopes.

The tests establish the listed software behavior and arithmetic; they do not establish 100% regulatory correctness. Inherited pathway/grid factors, agricultural methane model assumptions, allocation choices, program-specific CI certification, approved D-code, delivery/use and credit ownership still require qualified domain review. Preset prices are illustrative. No credits or serial RINs are issued by this application.

### Calculator usability update — 15 October 2026

- Compact page headers keep the toolbar and first input panel visible immediately.
- CI export action is labeled **Export JSON**. Manual Save/Restore draft actions are removed from both calculators.
- Browser drafts save on typing and committed changes, including blanks, invalid numbers, custom rows, display preferences and the CI baseline. Reload restores these without creating an account-history entry. Account history remains tied to successful Run/Calculate actions.
- Baseline comparison is shown directly after the CI result with an expandable three-step guide. Browser verification: RD-UCO defaults 16.326 → chemicals/fugitives 1 to 0 → 15.326, difference −1 gCO₂e/MJ; baseline stays 16.326 after reload.
- Verified numeric blank persistence and text edited before blur in the browser; Credit example still yields 6,572.27 tonnes and 1,700,000 RINs and saves to account history. Storage failures report an explicit warning rather than claiming a successful save.
- 75 calculator/draft tests, TypeScript, scoped ESLint and production build passed. Calculation engines and workbook formatting were unchanged in this usability update.
