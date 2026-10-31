# Dairy RNG carbon intensity calculator — `/dairy-rng-calculator`

> **In one line:** A farm-level CI model for renewable natural gas from dairy manure digesters, scored against regulatory programs.
> **Route file:** `src/routes/dairy-rng-calculator.tsx` (renders `PathwayCiBuilder` with `mode="dairy"`)

**How the page is built:** This is the same React component and engine as `/ci-calculator` (`src/features/calculators/ci-model.ts`), locked to the "rng-dairy" pathway. The farm maths comes from two files: `rng-dairy-lcfs.ts` (the default method) and `rng-dairy.ts`. Everything runs in the browser.

**Important:** As on `/ci-calculator`, only the one hard-coded owner email (`canEdit` in `src/features/premium/server-functions.ts`) can open the input sections. Everyone else sees the default farm result, read-only.

## Sections (top to bottom, as the user sees them)

### 1. "Dairy RNG carbon intensity calculator" heading and the link to the main calculator
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title, subtitle, link | Intro text | Route file | Hand-written | Only when code changes | ⚪ |

**Code:** `src/routes/dairy-rng-calculator.tsx`

### 2. "Fuel pathway"
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Pathway | Fixed to dairy manure RNG | `PATHWAYS` in `ci-model.ts`, filtered to `rng-dairy` | Hand-written | Only when code changes | ⚪ |

**Code:** `src/features/calculators/components/PathwayCiBuilder.tsx`

### 3. "Dairy manure farm model": method picker plus "1. Project background", "2. Herd and baseline manure", "3. Project gas", "4. Project methane losses", "5. Energy use", "6. Delivery"
**What the user sees:** A choice between "CARB LCFS Tier 1 (dairy/swine manure)" (the default) and the Argonne GREET 2024 farm model, then farm inputs.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| CARB Tier 1 factors | Grid gCO₂e/kWh by eGRID region, storage methane factors by temperature, digester leakage, natural gas and diesel factors, GWP 25 | `rng-dairy-lcfs.ts`. The file says these are copied "verbatim" from CARB's "Tier 1 CI Calculator for Dairy and Swine Manure Biomethane" (release 07/01/2025, CA-GREET 4.0). | Hand-written | When CARB releases a new workbook | ⚪ |
| GREET 2024 factors and default herd | Manure per head, RNG yield, methane conversion factors, GWPs | `rng-dairy.ts`, ported from the "GREET 2024_RNG" workbook (Argonne GREET 2024) | Hand-written | Only when code changes | ⚪ |
| Farm inputs | Herd, storage, gas, energy, distance | The visitor (owner only) | User input | Instantly | 🟢 |

**Code:** `src/features/calculators/rng-dairy-lcfs.ts`, `src/features/calculators/rng-dairy.ts`, `src/features/calculators/components/PathwayCiBuilder.tsx`

### 4. "Carbon intensity" result card
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| CI number (often negative) | gCO₂e/MJ | Calculated in the browser | User input / defaults | Instantly | 🟢 |

**Code:** `src/features/calculators/components/PathwayCiBuilder.tsx`

### 5. "Detailed results are a premium feature" (non-Pro) or the Pro sections: "Contribution by emission source", "Emissions from all inputs", "Regulatory program comparison"
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Breakdown and line table | Each stage's share | Calculated in the browser | User input / defaults | Instantly | 🟢 |
| Program benchmarks | 10 programs | `PROGRAMS` in `ci-model.ts` | Hand-written | Only when code changes | ⚪ |
| Pro gate | Show or lock | `getPremiumStatusFn` (email list + `premium_members`) | Live | Every 5 min | 🟢 |

**Code:** `src/features/calculators/ci-model.ts`

### 6. "Export results" and "Save to my results dashboard" (Pro only)
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Excel workbook | Full calculation and factors | Built in the browser | User input | On click | 🟢 |
| Saved result | Scenario on `/my-results` | `saveCiRunFn` → Supabase `ci_runs` | User input | On click | 🟢 |

**Code:** `src/features/calculators/components/SaveCiRunButton.tsx`, `src/features/calculators/server-functions.ts`

### 7. "Dairy RNG questions, answered"
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| FAQs | Three Q&As (also sent to search engines) | `DAIRY_FAQS` in the route file | Hand-written | Only when code changes | ⚪ |

**Code:** `src/routes/dairy-rng-calculator.tsx`

## Problems spotted
- **Duplicate dairy engines.** `rng-dairy-lcfs.ts` and `rng-dairy.ts` also exist as bundled copies inside `public/tools/workspace-engine.mjs`, used by the CI Workspace's dairy option. The copies have already diverged. FINAL-REVIEW.md reports that the example farm allocated 82.17% of manure to anaerobic storage plus 25.30% elsewhere, 107.47% in total. The workspace copy fixes this. This page's default (`DEFAULT_DAIRY_RNG_LCFS` in `rng-dairy-lcfs.ts`) still uses `msAnaerobic: 0.8217`, so the default farm shown here gives a different CI from the same example in the workspace.
- The "Regulatory program comparison" uses the older `ci-model.ts` benchmarks (California LCFS 79.16 / 79.51), not the 2026 values used in the CIVanta tools.
- Only the one hard-coded owner email can change inputs. Every other visitor sees only the default farm.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
