# CIVanta Optimizer — `/civanta/optimizer`

> **In one line:** Compares four improvement measures (renewable power, rail haul, heat recovery, process tuning) across all 16 combinations. It finds the cheapest mix that meets a CI target.
> **Route file:** `src/routes/civanta_.optimizer.tsx` (renders `src/features/optimizer/OptimizerPage.tsx`)

**How the page is built:** A native React page with no iframe. All maths runs in the browser in `src/features/optimizer/engine.ts`. The only server calls are the Pro check and account history.

## Sections (top to bottom, as the user sees them)

### 1. Header: "Back to CIVanta", "CIVanta Optimizer", "Go for Pro", "History"
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Labels | Title and buttons | `CalculatorHeader.tsx` | Hand-written | Only when code changes | ⚪ |
| "Go for Pro" | Hidden for Pro users | `getPremiumStatusFn`: a hard-coded email list plus the Supabase `premium_members` table | Live, cached 5 min | Every 5 min | 🟢 |

**Code:** `src/features/ci-workspace/CalculatorHeader.tsx`, `src/features/premium/server-functions.ts`

### 2. History panel ("← Back to Optimizer")
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Saved runs | Optimizer scenarios | Supabase `ci_runs`, tag `civanta/optimizer` | User input (signed-in only, saved after a successful Run and "Save scenario") | When the panel opens | 🟢 |

**Code:** `src/features/calculation-history/*`, `src/features/optimizer/OptimizerPage.tsx`

### 3. Toolbar (Save scenario · Load example · Run · Download Excel / "Pro · Download Excel")
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Browser draft | Inputs restored after a reload | `localStorage` key `gbw:civanta:optimizer:draft:v1` | User input (browser only) | On every edit | 🟢 |
| Excel report (Pro) | Full results workbook | Built in the browser. Pro is checked again on the server first. | User input | On click | 🟢 |

**Code:** `src/features/optimizer/OptimizerPage.tsx`, `src/features/optimizer/export-report.ts`

### 4. "01 Inputs & constraints" (with "Economic assumptions" and "Measures to compare")
**What the user sees:** Pathway, CI target, benchmark, gas and power use, grid CI, haul distance, volume, prices, costs and the measures to test.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Pathway list and base CI | 43 screening pathways (e.g. RD-UCO 16.326) | `src/features/optimizer/pathways.json` (copied from the old live optimizer, per `REFERENCE.md`) | Hand-written | Only when code changes | ⚪ |
| Default benchmark | 75.16 gasoline / 80.17 diesel | `defaultInputs()` in `engine.ts` | Hand-written | Only when code changes | ⚪ |
| Model factors | Natural gas 63 g/MJ, grid 400 g/kWh, truck 100 vs rail 22 g/t-km | `engine.ts` | Hand-written | Only when code changes | ⚪ |
| Prices and costs | Credit $75/t, gas $0.004/MJ, PPA premium $0.015/kWh, 8% discount rate, 15-year life, capex/opex per measure | `defaultInputs()` in `engine.ts`. `REFERENCE.md` calls them "illustrative cost defaults". | Hand-written (user can edit) | Never | ⚪ |
| User-entered numbers | Everything above, once edited | The visitor | User input | On each edit | 🟢 |

**Code:** `src/features/optimizer/OptimizerInputs.tsx`, `src/features/optimizer/engine.ts`, `src/features/optimizer/pathways.json`

### 5. "Optimized carbon intensity" card and headline metrics (Net benefit, Scenarios compared)
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Recommended mix, CI, capex, opex, net benefit | The best plan | Calculated in the browser by `engine.ts` | User input | On each Run | 🟢 |

**Code:** `src/features/optimizer/OptimizerResults.tsx`

### 6. Tabs: Overview · Cost & CI (Pro) · Optimization (Pro) · Sensitivity (Pro) · Regulatory · Evidence
**What the user sees:** "Your route to a lower CI", "Abatement cost ranking", "Cost versus carbon intensity" chart, "Find your operating setpoint", "All measure combinations", "What changes the outcome?", "Regulatory context" and "Model evidence & assumptions". The Pro tabs show an upgrade box to non-Pro users.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Charts and tables | Costs, CI and sensitivity | Calculated in the browser | User input | On each Run | 🟢 |
| Regulatory context | 2026/2027 benchmarks for CA, OR, WA, Canada, EU RED, CORSIA, FuelEU, RenovaBio, with links | `src/features/optimizer/programs.json` | Hand-written | Yearly, by hand | ⚪ |
| Pro gate | Locks Cost & CI, Optimization and Sensitivity | `getPremiumStatusFn` | Live | Every 5 min | 🟢 |

**Code:** `src/features/optimizer/OptimizerResults.tsx`, `src/features/optimizer/programs.json`

## Problems spotted
- `programs.json` is a third hand-kept copy of the benchmark table. The others are in `workspace-engine.mjs` and `ci-model.ts`. The values match the workspace today, but each copy must be updated on its own.
- `pathways.json` is another separate copy of the 43 pathway CIs (from the old live site). It is not read from the workspace engine, so changes there do not flow here.
- The default prices and costs are illustrative placeholders, not market data.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
