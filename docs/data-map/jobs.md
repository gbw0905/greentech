# Jobs — `/jobs`

> **In one line:** A careers desk that builds ready-made searches on outside job boards (LinkedIn, Indeed, etc.) from your filters. It does not list jobs itself.
> **Route file:** `src/routes/jobs.tsx`
> **Sign-in / Pro:** Not needed.

## Sections (top to bottom, as the user sees them)

### 1. "Biofuel and bioenergy jobs, worldwide." (hero)
**What the user sees:** Headline, intro text, "Browse jobs" and "Get email alerts" buttons, and an animated floating-cards scene with labels "Global opportunities", "N employers", "N trusted sources", "N job categories".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Headline and intro text | Marketing copy | Written in the component | Hand-written | When code changes | ⚪ |
| Floating card labels | Job function names (e.g. Engineering) | `JOB_CATEGORIES` in `data.ts` | Hand-written | When code changes | ⚪ |
| "N employers" / "N trusted sources" | Counts | Length of the `EMPLOYERS` and `JOB_BOARDS` lists in `data.ts` | Hand-written | When code changes | ⚪ |

**Code:** `src/features/jobs/components/JobsHero.tsx`, `src/features/jobs/components/JobsHuntScene.tsx`, `src/features/jobs/data.ts`

### 2. Search bar (keyword, Region, Function, Seniority, Remote only)
**What the user sees:** A keyword box and three dropdowns plus a "Remote only" toggle; chosen filters appear as removable chips with "Reset all".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Dropdown options | 8 regions, job functions, seniority levels | `JOB_REGIONS`, `JOB_CATEGORIES`, `SENIORITY_LEVELS` in `data.ts` | Hand-written | When code changes | ⚪ |
| Your choices | Filters and keyword | You | User input (on screen only, not saved) | — | 🟢 |

**Code:** `src/features/jobs/components/JobsPanel.tsx`

### 3. Coverage stats strip
**What the user sees:** Four numbers: Bioenergy employers, Regional searches, Trusted sources, Career functions.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Four counts | List sizes | Lengths of lists in `data.ts` | Hand-written | When code changes | ⚪ |

**Code:** `src/features/jobs/components/JobsPanel.tsx`

### 4. "Browse job sources"
**What the user sees:** 8 cards (LinkedIn Jobs, Indeed, Google Jobs, Climatebase, EURES, UN / IRENA careers, Glassdoor, Idealist / NGO), each with a logo, a one-line note and a "Search opportunities" link.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Card name and note | Board name and description | `JOB_BOARDS` in `data.ts` | Hand-written | When code changes | ⚪ |
| Card link | A search on that job board pre-filled with your filters (biofuel keywords + function + seniority + "remote" + your keyword; location only for boards that support it) | Built in the browser from `JOB_BOARDS[].url(...)` | Hand-written link pattern + User input | Instantly | 🟢 |
| Logos | Board logo | Logo.dev (`VITE_LOGO_DEV_API_KEY`), or Google favicon service if no key; initials if the image fails | Live | — | 🟢 |

**Code:** `src/features/jobs/components/JobsPanel.tsx`, `src/features/jobs/data.ts`, `src/features/markets/entity-logos.ts`

### Behind the scenes
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Page-view counter | Nothing visible | Anonymous visit record | Own tracking (`useVisitTracker`) | Each visit | 🟢 |
| Search-engine data (JSON-LD) | Hidden list of the job boards for Google | `JOB_BOARDS` | Hand-written | When code changes | ⚪ |

## Problems spotted
- **The hiring news feed is gone.** The Google News scraper (`search-jobs.server.ts`, `getHiringNewsFn`) was deleted and the hero label "Hiring news feed" now reads "N job categories". Nothing on this page comes from news.
- **The employer list is not shown either.** `EmployerDirectory.tsx` is not used anywhere, but the hero and stats strip still advertise "N employers" / "Bioenergy employers".
- **Region filter is narrower than its name.** Each region sends one country to the job boards, e.g. "Asia" → India, "Middle East & Africa" → United Arab Emirates, "Latin America" → Brazil (`JOB_REGIONS` in `data.ts`).

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
