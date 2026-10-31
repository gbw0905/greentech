# Credit and RIN Calculator — `/credit-calculator`

> **In one line:** Turns a fuel's CI and volume into estimates of California LCFS credits and U.S. RFS RINs, and their dollar value.
> **Route file:** `src/routes/credit-calculator.tsx`

**How the page is built:** The React page is only a frame (header, floating bar, save dialog, history). The calculator is a static page, `public/tools/credit-calculator.html` with `public/tools/credit-calculator.js`, loaded in an iframe. All maths runs in the browser in `public/tools/credit-engine.mjs`, which makes **no network calls**. Any URL query string (`?ci=…&fuel=…&quantity=…&energy=…&unit=…`) is passed into the iframe. This is how the CI Workspace hands its result to this page.

## Sections (top to bottom, as the user sees them)

### 1. Header: "Back to CIVanta", "Credit and RIN Calculator", "Go for Pro", "History"
**What the user sees:** The title, a back link, an upgrade button for users without Pro and a History toggle.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Labels | Title and buttons | `CalculatorHeader.tsx` | Hand-written | Only when code changes | ⚪ |
| "Go for Pro" | Hidden for Pro users | `getPremiumStatusFn`: a hard-coded email list plus the Supabase `premium_members` table | Live, cached 5 min | Every 5 min | 🟢 |

**Code:** `src/features/ci-workspace/CalculatorHeader.tsx`, `src/features/premium/server-functions.ts`

### 2. History panel
**What the user sees:** The user's saved credit scenarios, which can be restored.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Saved runs | Name, fuel, results | Supabase `ci_runs`, tag `civanta/credit` | User input (signed-in users only; signed-out users get "Inputs saved in this browser…") | When the panel opens | 🟢 |

**Code:** `src/features/calculation-history/*`

### 3. Toolbar (Save scenario · Load example · Run · Pro · Download Excel) and mode tabs (Both programs · LCFS credits · RFS RINs)
**What the user sees:** Action buttons and a choice of program.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| "Load example" values | 1,000,000 gal renewable diesel, CI 30, 131 MJ/gal | `defaults()` in `credit-engine.mjs` | Hand-written | Only when code changes | ⚪ |
| Browser draft | Inputs restored after a reload | `localStorage` key `gbw-credit-v1` | User input (browser only) | On every edit | 🟢 |
| Values from the URL | CI, fuel, quantity, energy | Link from the CI Workspace | User input | On page open | 🟢 |

**Code:** `public/tools/credit-calculator.html`, `public/tools/credit-calculator.js`

### 4. "01 Fuel & reporting period"
**What the user sees:** Fuel type (renewable diesel, biodiesel, ethanol, RNG), year (2026/2027), quantity, unit and energy content.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Fuel energy densities | RD 131, BD 126.13, ethanol 80.53 MJ/gal | `FUELS` in `credit-engine.mjs`. The page itself calls these "illustrative". | Hand-written | Only when code changes | ⚪ |

**Code:** `public/tools/credit-engine.mjs`

### 5. "02 California LCFS"
**What the user sees:** Pathway CI, displaced fuel, benchmark, EER, eligible share and credit price.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| CARB 2026 benchmark | Gasoline 75.16 / diesel 80.17 | `credit-engine.mjs` (cites the CARB annual reporting webinar and 17 CCR 95486.1) | Hand-written | Yearly, by hand | ⚪ |
| LCFS credit price | Default $75/tonne | `defaults()` in `credit-engine.mjs`. This is a placeholder, not a market price. | Hand-written (user can edit) | Never | ⚪ |

**Code:** `public/tools/credit-engine.mjs`, `public/tools/credit-calculator.js`

### 6. "03 U.S. RFS · RINs"
**What the user sees:** D-code, equivalence value, eligible share and RIN price.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Equivalence values | RD 1.7 (2026) / 1.5 (2027), BD 1.5, ethanol 1.0, RNG 77,000 Btu per RIN | `standardEV()` in `credit-engine.mjs` (cites EPA 40 CFR 80.1415 and 91 FR 16388) | Hand-written | When EPA rules change | ⚪ |
| RIN price | Default $1/RIN | `defaults()` in `credit-engine.mjs`. This is a placeholder, not a market price. | Hand-written (user can edit) | Never | ⚪ |

**Code:** `public/tools/credit-engine.mjs`

### 7. Results: LCFS credits, RIN quantity, "Combined gross value", "Calculation trail", "Equations & sources", "Assumptions to review"
**What the user sees:** Tonnes of credits, the number of RINs, dollar values, the formulas and source links.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Result numbers | Credits, RINs, dollar values | Calculated in the browser from the user's inputs | User input | On each Run | 🟢 |
| Source links | EPA, Federal Register and CARB links | `SOURCES` in `credit-engine.mjs` | Hand-written | Only when code changes | ⚪ |

**Code:** `public/tools/credit-calculator.js`

### 8. "Test more than one price." / "Price sensitivity" (Pro)
**What the user sees:** Pro users see credit and RIN values at ±25% price. Other users see an upgrade box.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Sensitivity table | Values at −25%, base and +25% price | Calculated in the browser | User input | On each Run | 🟢 |

**Code:** `public/tools/credit-calculator.js`

### 9. Excel download (Pro)
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Workbook | Inputs and results | Result data from the iframe. Pro is checked again on the server first. | User input | On click | 🟢 |

**Code:** `src/features/ci-workspace/export-credit-workbook.ts`

## Problems spotted
- The default LCFS price ($75/t) and RIN price ($1) are fixed placeholders. They do not track the market. Users may take them as current prices.
- No 2027 LCFS benchmark is preset here. 2027 users must type one in. The CI Workspace and the Optimizer do include CA 2027 values (73.72 / 78.63), so the three CIVanta tools behave differently.
- Benchmarks and RIN factors are typed by hand and cover only 2026 and 2027.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
