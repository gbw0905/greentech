# CI Scenario Workspace — `/ci-workspace`

> **In one line:** A calculator that works out a fuel's carbon intensity (CI, in gCO₂e/MJ). Users build a pathway, compare it with a baseline and check it against regulatory benchmarks.
> **Route file:** `src/routes/ci-workspace.tsx`

**How the page is built:** The React page (`src/routes/ci-workspace.tsx`) is only a frame. It shows the header, the floating bar, the save dialog and the history panel. The calculator itself is a separate static page, `public/tools/ci-workspace.html` with `public/tools/ci-workspace.js`, loaded in an iframe. All maths runs in the visitor's browser in `public/tools/workspace-engine.mjs`. The engine makes **no network calls**. The only server calls on this page are the Pro check and account history.

## Sections (top to bottom, as the user sees them)

### 1. Header: "Back to CIVanta", "CI Scenario Workspace", "Go for Pro", "History"
**What the user sees:** The page title, a back link, an upgrade button for users without Pro and a History toggle.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title and labels | Page name and buttons | `CalculatorHeader.tsx` | Hand-written | Only when code changes | ⚪ |
| "Go for Pro" button | Hidden when the user has Pro | `getPremiumStatusFn`: a hard-coded email list plus the Supabase `premium_members` table | Live: checked on page open, cached 5 min | Every 5 min | 🟢 |

**Code:** `src/features/ci-workspace/CalculatorHeader.tsx`, `src/features/premium/hooks/usePremium.ts`, `src/features/premium/server-functions.ts`

### 2. History panel (opens from "History")
**What the user sees:** The user's saved CI scenarios, with a button to restore each one. Signed-out users see "Sign in to save calculations…".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Saved runs | Name, pathway, CI, date | Supabase table `ci_runs`, tag `civanta/ci` (own rows only) | User input: saved after a successful Run and the save dialog | When the panel opens | 🟢 |
| Save status line | "Scenario saved to your account" / "saved on this device…" | `useCalculatorHistory.ts` | User input | After each save | 🟢 |

**Code:** `src/features/calculation-history/HistoryPanel.tsx`, `src/features/calculation-history/useCalculatorHistory.ts`, `src/features/calculation-history/server-functions.ts`

### 3. "Understand your fuel's carbon intensity." toolbar (Save scenario · Load example · Run · Pro · Download Excel)
**What the user sees:** Action buttons. A floating bar repeats the current CI result and the Save and Run buttons while the user scrolls.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| "Load example" values | Default inputs for the chosen pathway | Pathway presets inside `workspace-engine.mjs` | Hand-written | Only when code changes | ⚪ |
| Floating bar result | Current CI value | Calculated in the browser from the user's inputs | User input | On each Run | 🟢 |
| Browser draft | Unsaved inputs restored after a reload | `localStorage` key `gbw-ci-workspace-v1` | User input (browser only) | On every edit | 🟢 |

**Code:** `public/tools/ci-workspace.html`, `public/tools/ci-workspace.js`, `public/tools/browser-draft.mjs`, `src/features/ci-workspace/FloatingCalculatorBar.tsx`

### 4. Input panels: "Pathway & production", "Feedstock & logistics", "Process energy", "Other lifecycle terms"
**What the user sees:** A pathway dropdown (43 pathways) and editable fields for volume, energy use, emission factors and direct gCO₂e/MJ terms. Users can add their own custom emission rows.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Pathway list and default values | 43 pathways with default CI terms | `PATHWAYS` inside the bundled "source/ci-model.mjs" module in `workspace-engine.mjs` (comment: "indicative pathway averages compiled from GREET / CA-GREET, CARB, EU RED") | Hand-written | Only when code changes | ⚪ |
| Grid electricity factors | gCO₂e/kWh by region | `ELECTRICITY_REGIONS` in `workspace-engine.mjs` | Hand-written | Only when code changes | ⚪ |
| Fuel and energy emission factors | Natural gas, diesel, steam and similar | `SOURCES` in `workspace-engine.mjs` | Hand-written | Only when code changes | ⚪ |
| User-entered numbers | Volumes, overrides, custom rows | The visitor | User input | On each edit | 🟢 |

**Code:** `public/tools/ci-workspace.js`, `public/tools/workspace-engine.mjs`

### 5. Dairy RNG farm panels (only when "Dairy RNG — farm calculator" is chosen): "Pathway & farm setup", "Livestock & manure volatile solids", "Climate & manure storage", "Farm methane balance"
**What the user sees:** A herd-and-manure model for dairy digester RNG.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Dairy factors (grid by eGRID region, storage methane factors, digester leakage) | Factors used in the farm model | Bundled "rng-dairy-lcfs.mjs", "rng-dairy.mjs" and "rng-dairy-cfr.mjs" modules in `workspace-engine.mjs` (ported from the CARB Tier 1 workbook and Argonne GREET 2024) | Hand-written | Only when code changes | ⚪ |
| Example herd inventory | Default farm numbers | `workspace-engine.mjs`. FINAL-REVIEW.md says it is "not a measured inventory". | Hand-written | Only when code changes | ⚪ |

**Code:** `public/tools/workspace-engine.mjs`, `src/features/ci-workspace/FINAL-REVIEW.md`

### 6. Results: "Net lifecycle carbon intensity", baseline comparison, "Indicative scope allocation", "Annual impact & comparison", "Emission-factor sensitivity"
**What the user sees:** The CI result, gross emissions and credits, a comparison with the saved baseline, a Scope 1/2/3 split, annual tonnes and a ±25% sensitivity table.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| All result numbers | CI, scopes, annual tonnes, sensitivity | Calculated in the browser by `workspace-engine.mjs` from the user's inputs and the hand-written factors | User input | On each Run | 🟢 |
| Baseline | The scenario saved with "Use as baseline" | Browser draft (`gbw-ci-workspace-v1`) | User input (browser only) | When the user sets it | 🟢 |
| "User comparator" | Default 100 gCO₂e/MJ | `newScenario()` in `workspace-engine.mjs` | Hand-written default, user can edit | Only when code changes | ⚪ |

**Code:** `public/tools/ci-workspace.js`, `public/tools/workspace-engine.mjs`

### 7. "Regulatory benchmark comparison" and "Credit sensitivity to CI"
**What the user sees:** Benchmarks for 2026 and 2027 for California LCFS, Oregon CFP, Washington CFS, Canada CFR, EU RED III, CORSIA, FuelEU Maritime and RenovaBio, each with an "Official source" link. Conditional credit estimates appear when the user enters an eligible share.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Program benchmarks | e.g. CA 2026 diesel 80.17, Oregon 2026 diesel 90.40 | `PROGRAMS` in the bundled "programs.mjs" module in `workspace-engine.mjs`. Citations are in `src/features/ci-workspace/FINAL-REVIEW.md` (reviewed 1 Oct 2026; Oregon corrected 15 Oct 2026). | Hand-written | Only when code changes (yearly at least) | ⚪ |

**Code:** `public/tools/workspace-engine.mjs`, `public/tools/ci-workspace.js`

### 8. "U.S. RFS · RIN estimate" and "Next: credit & RIN estimates"
**What the user sees:** A RIN count based on the D-code and eligible share. A link passes the modelled CI and volume to `/credit-calculator` through the URL.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| RIN equivalence values | 1.7 / 1.5 for RD, 1.5 for BD, 1.0 for ethanol | `standardEV()` in `public/tools/credit-engine.mjs` (cites EPA 40 CFR 80.1415 and the 2026/27 final rule) | Hand-written | Only when code changes | ⚪ |

**Code:** `public/tools/credit-engine.mjs`, `public/tools/ci-workspace.js`

### 9. Lifecycle flow, "Stage breakdown", "Detailed lifecycle ledger" and "Line-by-line calculation ledger" (Pro)
**What the user sees:** Pro users get a feedstock-to-fuel flow diagram and full calculation tables. Other users see the "Inspect every stage and factor." upgrade box.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Flow diagram and ledgers | Every stage, factor and formula | Calculated in the browser (`ci-flow.mjs`, `ci-workspace.js`) | User input | On each Run | 🟢 |
| Pro gate | Show or hide | `getPremiumStatusFn`, passed into the iframe by `postMessage` | Live | Every 5 min | 🟢 |

**Code:** `public/tools/ci-flow.mjs`, `public/tools/ci-workspace.js`, `src/routes/ci-workspace.tsx`

### 10. "Run history" (on this device)
**What the user sees:** A list of recent runs in this browser, with a CSV download for Pro users.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Device run list | Run name, pathway, CI, time | `localStorage` key `gbw-ci-workspace-history-v1` (up to 100 runs) | User input (browser only) | On each Run | 🟢 |

**Code:** `public/tools/ci-workspace.js`

### 11. "What this model includes" and footer
**What the user sees:** Notes on the model scope, the snapshot date ("29 September 2026") and a GREET documentation link.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Notes and dates | Model description and version | `ci-workspace.html` | Hand-written | Only when code changes | ⚪ |

**Code:** `public/tools/ci-workspace.html`

### 12. Excel / text report download (Pro)
**What the user sees:** "Download Excel" builds a workbook in the browser.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Workbook | Inputs, results, factors | Result data from the iframe. Pro is checked again on the server first. | User input | On click | 🟢 |

**Code:** `src/features/ci-workspace/export-workbook.ts`, `src/features/ci-workspace/download-text.ts`

## Problems spotted
- **Two separate CI engines.** This page uses a bundled copy of the model in `public/tools/workspace-engine.mjs`. The `/ci-calculator` and `/dairy-rng-calculator` pages use `src/features/calculators/ci-model.ts`. The two copies have already drifted apart. For example, the California LCFS benchmark is gasoline 75.16 / diesel 80.17 in the workspace copy, but gasoline 79.16 / diesel 79.51 in `ci-model.ts`. A factor fix in one place does not reach the other.
- Regulatory benchmarks exist only for 2026 and 2027, typed by hand. Someone must update them every year.
- The pathway defaults are labelled as "not newly verified emission-factor datasets" (page note and FINAL-REVIEW.md). They have not been independently checked against current sources.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
