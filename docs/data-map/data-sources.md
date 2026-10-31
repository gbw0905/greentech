# Data sources & methodology — `/data-sources`

> **In one line:** Explains each supply/producer dataset on the site: what it measures, which documents it is based on, what it covers and its limits.
> **Route file:** `src/routes/data-sources.tsx`
> **Sign-in / Pro:** Not needed.

Everything on this page is typed into code. Nothing is fetched live.

## Sections (top to bottom, as the user sees them)

### 1. "Data sources & methodology" (hero)
**What the user sees:** Title, intro and three counters: Datasets, Metrics, Source citations.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Intro text | Page description | Written in the route file | Hand-written | When code changes | ⚪ |
| Datasets / Metrics / Source citations counts | 15 datasets, and totals of metrics and citations | Counted from `DATASETS` in `provenance.ts` | Hand-written | When code changes | ⚪ |

**Code:** `src/routes/data-sources.tsx`, `src/shared/data/provenance.ts`

### 2. "Browse datasets" (side menu)
**What the user sees:** A numbered list of dataset names that jump to each section (a fold-out menu on phones).

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Dataset names | e.g. "Top global oil companies", "Global UCO (used cooking oil) suppliers" | `DATASETS[].panel` | Hand-written | When code changes | ⚪ |

**Code:** `src/routes/data-sources.tsx`

### 3. One card per dataset ("Dataset 01" … "Dataset 15")
**What the user sees:** Name, description, "Figures as reported for <year>", "Last reviewed <date>", then **Metrics** (with "Estimate" tags), **Sources** (links to the original documents), **Coverage** and **Known limitations**.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Description, reporting year, last-reviewed date | e.g. 2024 / 2026-09-01; newer ones 2026 / 2026-10-08 | `DATASETS[]` | Hand-written | Only when someone edits the file | ⚪ |
| Metrics (label, unit, basis, "Estimate") | How each number is defined | `DATASETS[].metrics` | Hand-written | When code changes | ⚪ |
| Sources (org, year, title, link) | Citations to annual reports, regulators, statistics agencies | `DATASETS[].sources` | Hand-written | When code changes | ⚪ |
| Coverage / Known limitations | Scope rules and caveats | `DATASETS[].coverage`, `.limitations` | Hand-written | When code changes | ⚪ |

**Code:** `src/shared/data/provenance.ts`

### 4. "How we compile the panels"
**What the user sees:** Four numbered principles (Primary documents, Transparent estimates, Reporting periods, Market quotes).

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Four principles | Method text | `COMPILATION_NOTES` in the route file | Hand-written | When code changes | ⚪ |

**Code:** `src/routes/data-sources.tsx`

### 5. Reference note (bottom)
**What the user sees:** One sentence warning to cross-check figures against primary sources.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Note | Disclaimer | `REFERENCE_NOTE` (also reused in CSV exports and AI summaries) | Hand-written | When code changes | ⚪ |

**Code:** `src/shared/data/data-sources.ts`

## Problems spotted
- "Last reviewed" dates are typed by hand. They do not update by themselves, so they only stay true if someone edits `provenance.ts` after each review.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
