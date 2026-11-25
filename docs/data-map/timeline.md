# Policy update timeline — `/timeline`

> **In one line:** The full news feed of biofuel policy and market updates, newest first, with filters by country, fuel, category and search.
> **Route file:** `src/routes/timeline.tsx`

## Sections (top to bottom, as the user sees them)

### 1. "Policy update timeline" heading + "Updates tracked" counter
**What the user sees:** Title, short intro, and a big number of updates.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title + intro | Fixed text | Written in `timeline.tsx` | Hand-written | Never | ⚪ |
| "Updates tracked" | Number of news items loaded | Count of rows read from Supabase `policy_updates` (at most 1,000) | Daily job (preloaded on the server) | Every 2 min in the browser | 🟡 |

**Code:** `src/routes/timeline.tsx`, `src/features/policy/navigation-feed.ts`, `src/features/policy/feed-query.ts`

### 2. Filters: search box, "Jurisdiction" dropdown, "Fuel type" chips
**What the user sees:** A search box ("Search headlines, countries or topics…"), a country dropdown, and fuel chips each with a count.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Country list | All tracked countries | `COUNTRIES` in `src/features/policy/taxonomy.ts` | Hand-written | Never | ⚪ |
| Fuel chips | Ethanol, Biodiesel, Renewable Diesel, SAF, Biogas, Feedstock | `FUEL_TYPES` in `taxonomy.ts` | Hand-written | Never | ⚪ |
| Chip counts | Items per fuel | Counted from the loaded news | Daily job | Every 2 min | 🟡 |
| Search / selections | Visitor's choices | Kept on screen only | User input (not saved) | — | 🟢 |

**Code:** `src/routes/timeline.tsx`

### 3. Tabs "All updates / Policy / Market" + "N updates" count
**What the user sees:** Category tabs, a result count and "Clear filters".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Category of each item | Policy or Market | Keyword rules in `categorise` (`policy-ingest.server.ts`). Official government sources are always "Policy" | Daily job | — | ⚪ |

**Code:** `src/routes/timeline.tsx`, `src/features/policy/server/policy-ingest.server.ts`

### 4. Update cards (grouped under date headings)
**What the user sees:** For each item: a stock photo, a Policy/Market label, country flag + name (links to the country page), date, the headline linking to the original article, a summary, fuel tags and "Read source". 24 per page.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Headline, summary, link, date | News item | Supabase `policy_updates`, filled from the direct RSS/Atom feeds in `src/features/policy/sources.ts`: official bodies (Federal Register, US DOE, EIA, CARB, Natural Resources Canada, GOV.UK, European Commission, EUR-Lex, NZ Government) and trade/association feeds (Bioenergy International, Canary Media, Energy Monitor, ICCT, Mongabay, ET EnergyWorld, Antara, Clean Fuels Alliance America, Growth Energy). Google News searches are gone. Only outlets on the trusted list in `outlets.ts` are kept. Summary is the feed's own text, cut to 320 characters. Rows older than 180 days are deleted | Daily job (00:17 UTC). Visitors no longer trigger imports, not even on an empty table | Every 2 min in the browser | 🟢 official feeds / 🟡 trade-press headlines |
| Country + fuel tags | Flag, country name, fuels | Keyword matching on the headline/summary during import (`classify` in `policy-ingest.server.ts`) | Daily job | — | ⚪ |
| Photo | Topic photo | One of 8 stock images bundled in `src/assets/`, picked by the first fuel or the category (`update-images.ts`). Not the article's own image | Hand-written | Never | ⚪ |
| Flag image | Flag | flagcdn.com, from emoji in `taxonomy.ts` | Live image | Never | 🟢 |

**Code:** `src/routes/timeline.tsx`, `src/features/policy/server-functions.ts` (`getPolicyFeed`), `src/features/policy/server/policy-ingest.server.ts`, `src/features/policy/sources.ts`, `src/features/policy/outlets.ts`, `src/features/policy/update-images.ts`

### 5. Page numbers
**What the user sees:** Pagination at the bottom. No data of its own.

**Code:** `src/components/TimelinePagination.tsx`

## Problems spotted
- **The "Updates tracked" number can never go above 1,000.** The feed reads at most 1,000 rows (`.limit(1000)` in `server-functions.ts`), so the counter and filters ignore anything older, even within the 180-day archive.
- **Much less news than before.** With the Google News searches and the monthly backfill removed, only the direct feeds add items. Old Google News rows stay until they age out (180 days), then the archive gets smaller. Several useful sources (EPA, USDA, IEA, IRENA, ICAO, IMO, Biofuels Digest and the biofuel magazines) have no working public feed and are not covered.
- **An empty archive stays empty until the next import.** The first-visit import was removed, so a fresh database shows no news until the daily job runs.
- **Trade-press headlines and summaries are copied from other outlets** and shown on our page with a link. That is fine with care (🟡). Official feeds are 🟢.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
