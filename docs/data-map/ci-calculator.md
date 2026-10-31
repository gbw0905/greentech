# Carbon intensity calculator (older) — `/ci-calculator`

> **In one line:** The older React lifecycle CI calculator for many biofuel pathways. It shows a CI score and compares it with 10 regulatory programs.
> **Route file:** `src/routes/ci-calculator.tsx` (renders `src/features/calculators/components/PathwayCiBuilder.tsx`)

**How the page is built:** A React page that runs entirely in the browser. It has its **own engine**, `src/features/calculators/ci-model.ts`, which is separate from the CIVanta workspace engine. The only server calls are the Pro check and "Save to my results dashboard".

**Important:** Only one account can change anything on this page. `canEdit` is true only for the hard-coded owner email in `src/features/premium/server-functions.ts`. Every other visitor, Pro or not, sees the default pathway (renewable diesel from used cooking oil, U.S.-average grid) as a read-only result. They cannot pick a pathway or open the "Edit" sections.

## Sections (top to bottom, as the user sees them)

### 1. "Carbon intensity calculator" heading and the dairy RNG link
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title, subtitle, link to `/dairy-rng-calculator` | Intro text | Route file | Hand-written | Only when code changes | ⚪ |

**Code:** `src/routes/ci-calculator.tsx`

### 2. "Fuel pathway" (pathway picker, "Annual production", "Reset pathway defaults")
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Pathway list and defaults | 42 pathways (dairy is excluded here) with default CI terms | `PATHWAYS` in `ci-model.ts` (header comment: "indicative pathway averages compiled from public GREET / CA-GREET, CARB LCFS…, EU RED II/III…") | Hand-written | Only when code changes | ⚪ |
| Edit rights | Dropdown, or fixed text | `getPremiumStatusFn` → `canEdit` (one hard-coded email) | Live | Every 5 min | ⚪ |

**Code:** `src/features/calculators/components/PathwayCiBuilder.tsx`, `src/features/calculators/ci-model.ts`

### 3. Lifecycle sections: "Feedstock production", "Feedstock transport", "Process energy sources", "Chemicals and fugitive emissions", "Co-products and avoided emissions", "Fuel distribution", "Tailpipe and end use"
**What the user sees:** One card per stage with its gCO₂e/MJ total. Only the owner gets the "Edit" button.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Feedstock production presets | Fertiliser, field energy and similar | `FEEDSTOCK_PRODUCTION_PRESETS` in `ci-model.ts` | Hand-written | Only when code changes | ⚪ |
| Transport factors | g per tonne-km by mode | `TRANSPORT_MODES` in `ci-model.ts` | Hand-written | Only when code changes | ⚪ |
| Grid electricity by region | gCO₂e/kWh | `ELECTRICITY_REGIONS` in `ci-model.ts` (source label: IEA / EPA eGRID) | Hand-written | Only when code changes | ⚪ |
| Energy, chemical and co-product factors | Natural gas, steam, chemicals, co-product credits | `SOURCES`, `CHEMICAL_PRESETS`, `COPRODUCT_PRESETS` in `ci-model.ts` | Hand-written | Only when code changes | ⚪ |
| End-use factors | Tailpipe emissions | `END_USE_MODES` in `ci-model.ts` | Hand-written | Only when code changes | ⚪ |

**Code:** `src/features/calculators/ci-model.ts`

### 4. "Carbon intensity" result card
**What the user sees:** The headline CI with a unit switch. Pro users also see gross emissions, credits, annual energy and annual footprint.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| CI number | gCO₂e/MJ (or other units) | Calculated in the browser by `calculateScenario()` in `ci-model.ts` | User input (owner) / defaults (everyone else) | Instantly | 🟢 |

**Code:** `src/features/calculators/components/PathwayCiBuilder.tsx`

### 5. "Detailed results are a premium feature" (non-Pro) or the Pro sections: "Contribution by emission source", "Emissions from all inputs", "Regulatory program comparison"
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Breakdown chart and line table | Each stage's share | Calculated in the browser | User input / defaults | Instantly | 🟢 |
| Program benchmarks | CA LCFS, Oregon, Washington, Canada CFR, EU RED III, UK RTFO, US RFS, RenovaBio, CORSIA, FuelEU | `PROGRAMS` in `ci-model.ts` (no year attached) | Hand-written | Only when code changes | ⚪ |
| Pro gate | Show or lock | `getPremiumStatusFn` (email list + `premium_members`) | Live | Every 5 min | 🟢 |

**Code:** `src/features/calculators/components/PathwayCiBuilder.tsx`, `src/features/calculators/ci-model.ts`

### 6. "Export results" and "Save to my results dashboard" (Pro only)
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Excel workbook | Calculation, emission factors, keys | Built in the browser from the result and `backgroundFactors()` | User input | On click | 🟢 |
| Saved result | Scenario on `/my-results` | `saveCiRunFn` → Supabase `ci_runs` (regular rows, not `civanta/*` tagged) | User input | On click | 🟢 |

**Code:** `src/features/calculators/components/SaveCiRunButton.tsx`, `src/features/calculators/server-functions.ts`

### 7. "How a biofuel CI score is calculated", "Carbon intensity questions, answered" and the copyright notice
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Steps, FAQs, legal text | Explainer copy (also sent to search engines as FAQ data) | `CI_STEPS`, `CI_FAQS` in the route file | Hand-written | Only when code changes | ⚪ |

**Code:** `src/routes/ci-calculator.tsx`

## Problems spotted
- **Two separate CI engines.** This page uses `src/features/calculators/ci-model.ts`. The CIVanta Workspace uses its own bundled copy in `public/tools/workspace-engine.mjs`. They have drifted apart. For example, the California LCFS benchmark here is gasoline 79.16 / diesel 79.51, while the workspace uses the 2026 values 75.16 / 80.17. The same pathway can give a different program comparison on each page.
- The program benchmarks here have no year and look out of date compared with the CIVanta tools.
- Only the single owner email can change inputs. For every other visitor, including Pro members, this calculator shows one fixed default result. The "Save to my results dashboard" button therefore always saves that default scenario for Pro members.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
