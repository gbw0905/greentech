# Country updates — `/countries/$slug/updates`

> **In one line:** The same country profile page, opened scrolled down to the "Live updates" news list. The news is preloaded on the server.
> **Route file:** `src/routes/countries.$slug.updates.tsx` (inside the `countries.$slug.tsx` layout)

This route shows the full country page (`CountryPolicyPage` with `focusSection="updates"`). Every section is the same as in [`countries-slug.md`](./countries-slug.md). The only difference: this route loads the news feed on the server first (`loadNavigationFeed`), so the news list is already in the HTML.

## Sections (top to bottom, as the user sees them)

### 1. Header, "Profile snapshot", tabs, stat strip, "At a glance", "Mandates & targets"
Same as sections 1–9 of [`countries-slug.md`](./countries-slug.md). The text comes from Supabase `country_profiles` (Gemini-rewritten, 🟡 AI). Mandates and links come from `country_mandates` / `mandates.ts` (⚪). The "Live updates" tab is highlighted.

### 2. "Live updates" (Calendar-filtered changes) — where the page scrolls to
**What the user sees:** News for this country, newest first, with All / Market / Policy buttons and a calendar date-range filter. Each item shows a Policy/Market label, date, outlet name, a headline linking to the original article, and tags naming any matching mandate.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| News items | Headline, date, outlet, link | Supabase `policy_updates` (newest 1,000 rows across all countries). Filled from ~60 RSS feeds in `src/features/policy/sources.ts`, mostly Google News searches, plus Federal Register, GOV.UK, EU and trade magazines. Rows older than 180 days are deleted | Daily job (00:17 UTC). Also a background import when the newest item is over 4 h old. Preloaded on the server for this route | Every 2 min in the browser (and when the tab regains focus) | 🟡 |
| Country filter | Which items appear | Item's country tag (keyword match during import) **or** the country's `updateKeywords` in `taxonomy.ts` found in the headline/summary | Hand-written keyword rules | — | ⚪ |
| Policy / Market label | Category | Keyword rules (`categorise` in `policy-ingest.server.ts`). Official government sources are always "Policy" | Daily job | — | ⚪ |
| Mandate tags | Instrument names | Keyword match against each mandate (`updateMatchesMandate` in `mandates.ts`) | Hand-written keyword rules | — | ⚪ |
| Date-range / category filters | — | Visitor's clicks, kept only on screen | User input (not saved) | — | 🟢 |
| "Updates could not be refreshed" warning | Error notice | Shown if the database read fails | Live | — | 🟢 |

**Code:** `src/features/countries/components/CountryUpdatesPanel.tsx`, `src/features/policy/navigation-feed.ts`, `src/features/policy/feed-query.ts`, `src/features/policy/server-functions.ts` (`getPolicyFeed`), `src/features/policy/server/policy-ingest.server.ts`, `src/features/policy/sources.ts`

### 3. "Official sources" side column
Same as section 11 of [`countries-slug.md`](./countries-slug.md). ⚪

### Behind the scenes: page title and description
"<Country> Bioenergy Policy Updates", built from `taxonomy.ts`. ⚪

## Problems spotted
- **Only the newest 1,000 items site-wide are searched.** The browser gets the latest 1,000 rows from all countries and then filters for this country (`readFeed` in `server-functions.ts`). Smaller countries can lose older items within the 180-day archive.
- **Keyword matching can pull in other countries' news.** An item counts as this country's news if any of the country's `updateKeywords` appears in the headline or summary, even if the item is tagged to a different country.
- **The background refresh may not finish.** When news is over 4 hours old, `getPolicyFeed` starts an import without waiting for it. On Vercel's serverless functions this work can be stopped once the response is sent, so it is not a reliable refresh.
- All problems from [`countries-slug.md`](./countries-slug.md) also apply.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
