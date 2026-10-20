# CIVanta Optimizer migration

Source: GBW-owned https://globalbioenergywatch.org/civanta/optimizer, inspected with the existing authenticated Brave session on 15 October 2026. The public application chunk was `civanta.optimizer-Drvi2Gfz.js`.

The 43 screening presets were extracted as literal data into pathways.json. No remote executable code is loaded by the new page. The four-measure engine reproduces reference gas compounding, haul factors, renewable power substitution, capex, incremental opex, capital recovery, credit value, least-cost feasible selection, Pareto comparison and marginal abatement ranking. The native React interface replaces the original duplicate operating forms with one consistent input panel and an operating target solver.

Default RD-UCO parity: baseline 16.326; recommended PPA + tuning 13.548 gCO2e/MJ; capex $150,000; incremental opex $38,000/year; conditional gross credit value $2,498,325/year; net benefit $48,650.568259597/year. All 16 combinations and 9 Pareto-efficient points match the reference.

Regulatory context reuses the existing CI Workspace's reviewed 2026 program references (programs.json), including its corrected Oregon standard, instead of copying the older duplicate reference table. Comparisons do not certify eligibility. There are no generic tonne credit quantities for certificate schemes. Economics explicitly assumes EER 1 and all modeled annual energy eligible; the reference's credit floor at zero is retained, and deficits/RINs are not priced.

Model limitations remain visible in Evidence: simplified fixed term, illustrative cost defaults, zero modeled PPA grid emissions, no standalone upstream PPA term, four discrete measures, and the dairy screening preset rather than the full dairy inventory. Feedstock multiplier changes the fixed calibrated term, which can include signed adjustments.

Target solvers handle zero coefficients and impossible targets. Input validation adds finite-value checks, nonnegative prices/costs and process-gas percentages between 0 and 100. Capital recovery uses a numerically stable equivalent formula. Negative targets remain allowed.

Account history uses the existing ci_runs repository, authentication middleware, user predicates and RLS, with a new civanta/optimizer tag. Browser drafts are versioned and include incomplete numeric inputs. Only explicit successful Run optimizer actions save account history. Excel exports reuse the site's logo and branded workbook formatter; CSV exports neutralize spreadsheet formula text.

Validation: `npm run test:optimizer` (54 checks), `npm run test:calculators` (75 regression checks), changed-file lint and production build. These verify migration behavior and internal arithmetic, not regulatory approval of screening assumptions.
