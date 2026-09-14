# Train the Dairy RNG calculator on the CARB LCFS Tier 1 method

Your upload is the official **CARB LCFS Tier 1 CI Calculator for Dairy and Swine Manure Biomethane** (release 07/01/2025). It is a different, far more rigorous method than the GREET-based farm model currently behind the Dairy RNG page — it is the one regulators actually certify pathways with, and it produces the deeply negative scores real dairy projects earn (the example workbook lands at **-171.74 gCO2e/MJ**).

## What changes for you

The Dairy RNG calculator page gets a **method switch** at the top:

- **CARB LCFS Tier 1 (dairy/swine manure)** — new, and the default
- **GREET farm model** — the existing herd-and-digester model, kept so nothing you already saved breaks

In the new method you enter what a real applicant enters, grouped the same way the official workbook groups it:

1. **Project background** — digester type (covered lagoon, enclosed vessel, plug flow, mixed), state, average annual temperature, electricity region (all 29 eGRID regions plus US average, Brazil, Canada).
2. **Herd and baseline manure** — up to three livestock categories (milking cows, non-milking cows, heifers) with population, average mass, volatile-solids excretion rate, maximum methane potential, fraction of manure sent to the anaerobic lagoon, and the non-anaerobic storage split (daily spread, solid storage, dry lot, etc.).
3. **Project gas** — raw biogas flow, methane content, gas to upgrading, flared gas, biomethane injected into the pipeline.
4. **Project methane losses** — venting, effluent ponds, non-digester sources, digester leakage, upgrading fugitives (2% floor enforced as CARB requires).
5. **Energy use** — grid electricity, utility natural gas, diesel, propane, raw biogas and biomethane used as process fuel, for the digester and for upgrading separately.
6. **Delivery** — pipeline miles to the fuelling station, CNG compression, tailpipe.

Results keep the layout you already have: a single CI number, the line-by-line breakdown, the contribution chart, the comparison against every regulatory benchmark, saving to **My results**, and the Excel export.

## How the numbers are produced

The engine reproduces the workbook's chain:

- **Baseline lagoon methane** month by month, using the Livestock Protocol Van't Hoff-Arrhenius temperature factor with volatile-solids carryover between months and the September full-cleanout rule.
- **Baseline non-anaerobic methane** from the storage-system methane conversion factor table.
- **Project methane** as the sum of venting, effluent ponds, non-BCS sources, digester leakage, upgrading fugitives and flared biomethane.
- **Avoided methane credit** = (project − baseline) methane, allocated to the RNG actually sold, converted at CARB's GWP of 25; plus the **diverted CO2 credit** on the same allocation factor.
- **Process emissions** from the CA-GREET 4.0 factors in the workbook's own EF table (for example FRCC grid 500.09 gCO2e/kWh, natural gas 75,495.75 gCO2e/MMBtu, diesel 12,308.35 gCO2e/gal, propane 7,345.28 gCO2e/gal, on-site biogas electricity 641.43 gCO2e/kWh).
- **Pipeline transmission** at 0.00388751 gCO2e/MJ-mile plus 3.25e-06 %/mile evaporative loss, **CNG compression** at 2.96364 gCO2e/MJ, **tailpipe** at 64,948.85 gCO2e/MMBtu.

## Technical notes

- New `src/lib/rng-dairy-lcfs.ts`: types, the full CA-GREET 4.0 factor tables from the EF Table sheet, the eGRID region list, digester and storage MCF tables, and `computeDairyRngLcfs()` returning the same `ModuleResult` shape (`gPerMj`, `DetailRow[]`) plus annual energy and tonnage, so charts, export and My results work unchanged.
- `src/lib/ci-model.ts`: `dairyMethod: "greet" | "lcfs"` on the scenario; when `lcfs`, that module overrides all other terms exactly as the GREET dairy module does today. Row-to-category map added for the new line items.
- `src/components/PathwayCiBuilder.tsx` (dairy mode only): method selector plus the six input sections above; general mode untouched.
- Validation: rebuild the uploaded workbook's own inputs as a test case and confirm the engine lands on -171.74 gCO2e/MJ (within rounding), then check both pages at desktop and 390px.
