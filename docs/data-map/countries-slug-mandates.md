# Country mandates — `/countries/$slug/mandates`

> **In one line:** The same country profile page, opened scrolled down to the "Mandates & targets" section. It has its own page title for search engines.
> **Route file:** `src/routes/countries.$slug.mandates.tsx` (inside the `countries.$slug.tsx` layout)

This route shows the full country page (`CountryPolicyPage` with `focusSection="mandates"`). Every section and source is the same as in [`countries-slug.md`](./countries-slug.md). Only the starting scroll position and page title are different. The sections that matter most here are below.

## Sections (top to bottom, as the user sees them)

### 1. Header, "Profile snapshot", tabs and stat strip
**What the user sees:** Same as the overview page. The "Mandates & targets" tab is highlighted.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Intro sentence, Profile snapshot | Blurb, key figures | Supabase `country_profiles` (Gemini-rewritten), falls back to `taxonomy.ts` | AI | When the page opens (cached 5 min) | 🟡 AI |
| Mandate count, official links | Count, government links | `country_mandates` table / `mandates.ts` | Hand-written | When the page opens (cached 5 min) | ⚪ |

**Code:** `src/features/countries/components/CountryProfileHeader.tsx`, `CountryTrackingStrip.tsx`

### 2. "Mandates & targets" (Timeline & compliance) — where the page scrolls to
**What the user sees:** One card per obligation (status, fuels, name, current obligation). "View details" opens a pop-up with the timeline, requirements, administrator, how compliance is shown, penalty, tradable unit, source link and "Last reviewed".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Mandate cards + pop-up | All mandate fields | Supabase `country_mandates`, copied from `src/features/countries/mandates.ts` by `/api/public/seed-country-data`. Falls back to the file. Entries say `lastReviewed: "2026-09"` | Hand-written | When the page opens (cached 5 min) | ⚪ |

**Code:** `src/features/countries/components/PolicyProgramme.tsx`, `src/features/policy/server/country-data.server.ts` (`getCountryMandates`)

### 3. "Live updates", "Official sources" side column
Same as sections 10–11 in [`countries-slug.md`](./countries-slug.md). News comes from the `policy_updates` table (RSS, Daily job) and refreshes every 2 min. 🟡. On this route, the news loads only in the browser. Nothing is preloaded on the server.

### Behind the scenes: page title and description
"<Country> Biofuel Mandates & Targets", built from the country name in `taxonomy.ts`. ⚪

## Problems spotted
- **Search engines see no mandates on the mandates page.** Mandates are fetched only in the browser (`useCountryMandates`, no server preload), so the server HTML for this URL says "No active obligations tracked for this jurisdiction yet." The page also scrolls to the section before the data arrives.
- All other problems from [`countries-slug.md`](./countries-slug.md) also apply: AI text under a "government records" note, the database copy getting out of sync with `mandates.ts`, and the daily job having no password check.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
