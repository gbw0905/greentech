# Country profile — `/countries/$slug`

> **In one line:** One page per tracked country (e.g. `/countries/brazil`) with its biofuel policy summary, mandates, official links and related news.
> **Route file:** `src/routes/countries.$slug.tsx` (checks the country exists) + `src/routes/countries.$slug.index.tsx` (the page)

The same page is also used by `/countries/$slug/mandates` and `/countries/$slug/updates` — those just scroll to a different section.

## Sections (top to bottom, as the user sees them)

### 1. Header: flag, country name and intro sentence
**What the user sees:** The country flag, its name, and a 1–2 sentence description of its biofuel policy.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Flag | Small flag image | Emoji in `taxonomy.ts` turned into an image from flagcdn.com | Hand-written + Live image | Never | 🟢 |
| Country name | e.g. "Brazil" | `COUNTRIES` list in `src/features/policy/taxonomy.ts` | Hand-written | Never | ⚪ |
| Intro sentence | Policy summary ("blurb") | Supabase `country_profiles` table. That table starts as a copy of `taxonomy.ts`, then Gemini rewrites it from recent news headlines. If the table is empty or fails, the text in `taxonomy.ts` is used | AI (Daily job rewrites up to 5 countries per day, each at most once a week) | Re-read when the page opens (cached 5 min) | 🟡 AI |

**Code:** `src/features/countries/components/CountryProfileHeader.tsx`, `src/features/policy/server/country-data.server.ts` (`getCountryProfile`), `src/features/policy/server/country-enrichment.server.ts`

### 2. Shortcut links: "N tracked mandates" and "Live updates"
**What the user sees:** Two buttons that jump to the mandates and news sections lower down. The first one shows how many mandates are tracked.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Mandate count | "3 tracked mandates" | Supabase `country_mandates` table (a copy of `src/features/countries/mandates.ts`), or the file itself if the table is empty | Hand-written (copied to the database by the seed endpoint) | When the page opens (cached 5 min) | ⚪ |

**Code:** `CountryProfileHeader.tsx`, `country-data.server.ts` (`getCountryMandates`)

### 3. "Official sources · N" (first 3 links in the header)
**What the user sees:** Up to three links to government websites.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Source links | Ministry / regulator names + links | The `official_sites` lists of the country's rows in `country_mandates`. If none, the `GOVERNMENT_SITES` list in `mandates.ts` | Hand-written | When the page opens (cached 5 min) | ⚪ |

**Code:** `CountryProfileHeader.tsx`, `country-data.server.ts` (`getGovernmentSites`)

### 4. "Profile snapshot" box (right side of header)
**What the user sees:** A short list of key figures, e.g. "Ethanol blend: E27", with a "View mandates & targets" link.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Label / value pairs | Key policy markers | `country_profiles.mandates` (Gemini can rewrite these). Falls back to `taxonomy.ts` | AI (Daily job, same as the intro sentence) | When the page opens (cached 5 min) | 🟡 AI |

**Code:** `CountryProfileHeader.tsx`, `country-enrichment.server.ts`

### 5. Tabs: "Overview / Mandates & targets / Live updates"
**What the user sees:** Tabs that jump to sections. The highlighted tab follows your scrolling. No data.

**Code:** `CountryProfileHeader.tsx`, `src/features/countries/hooks/useCountrySection.ts`

### 6. Stat strip: "Tracked mandates", "Policy targets", "Official sources"
**What the user sees:** Three number boxes.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Tracked mandates | Count | `country_mandates` / `mandates.ts` (see section 2) | Hand-written | When the page opens | ⚪ |
| Policy targets | Count of "Profile snapshot" rows | `country_profiles.mandates` (see section 4) | AI | When the page opens | 🟡 AI |
| Official sources | Count of links | Same as section 3 | Hand-written | When the page opens | ⚪ |

**Code:** `src/features/countries/components/CountryTrackingStrip.tsx`, `CountryPolicyPage.tsx`

### 7. "At a glance" (Policy briefing)
**What the user sees:** The same intro sentence as the header, plus tags for policy programmes (e.g. "RenovaBio", "RFS2").

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Intro sentence | Blurb | Same as section 1 | AI | When the page opens | 🟡 AI |
| Programme tags | Short names of laws/programmes | `country_profiles.frameworks` (Gemini can rewrite). Falls back to `taxonomy.ts` | AI | When the page opens | 🟡 AI |

**Code:** `src/features/countries/components/CountryPolicyPage.tsx`

### 8. "Targets at a glance"
**What the user sees:** The same label/value list as "Profile snapshot", plus a "Full detail" link.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Target list | e.g. "Biodiesel blend: B15" | `country_profiles.mandates` (see section 4) | AI | When the page opens | 🟡 AI |

**Code:** `CountryPolicyPage.tsx`

### 9. "Mandates & targets" (Timeline & compliance)
**What the user sees:** One card per law or obligation: status, fuels, name, current obligation, and a "View details" button. The pop-up shows the timeline, requirements, who enforces it, penalties, the source link and "Last reviewed".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Mandate cards + detail pop-up | Status, fuels, instrument, obligation, timeline, requirements, compliance, source link, "Last reviewed 2026-09" | `country_mandates` table, filled from `src/features/countries/mandates.ts` by the seed endpoint `/api/public/seed-country-data`. Falls back to the file | Hand-written | When the page opens (cached 5 min) | ⚪ |

**Code:** `CountryPolicyPage.tsx`, `src/features/countries/components/PolicyProgramme.tsx`, `src/features/countries/mandates.ts`, `src/features/policy/server/seed-profiles.server.ts`

### 10. "Live updates" (Calendar-filtered changes)
**What the user sees:** A list of news items for this country, with All / Market / Policy buttons and a date-range picker. Each item shows a Policy/Market label, date, outlet name, linked headline, and tags for any matching mandates.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| News items | Headline, date, outlet, link | Supabase `policy_updates` table (newest 1,000 rows). Filled from the direct official and trade/association feeds in `sources.ts` (no Google News). Kept 180 days | Daily job (00:17 UTC). Visitors no longer trigger imports | Every 2 min in the browser | 🟢 official feeds / 🟡 trade-press headlines |
| Which items count as "this country" | — | Item's country tag (set by keyword matching during import) **or** the country's `updateKeywords` from `taxonomy.ts` appearing in the headline/summary | Hand-written keyword rules | — | ⚪ |
| Policy / Market label | Category | Keyword rules in `policy-ingest.server.ts` (`categorise`) | Daily job | — | ⚪ |
| Mandate tags under an item | Instrument names | Keyword match between the headline and each mandate's keywords (`updateMatchesMandate` in `mandates.ts`) | Hand-written keyword rules | — | ⚪ |

**Code:** `src/features/countries/components/CountryUpdatesPanel.tsx`, `src/features/policy/feed-query.ts`, `src/features/policy/server-functions.ts` (`getPolicyFeed`), `src/features/policy/server/policy-ingest.server.ts`, `src/features/policy/sources.ts`

### 11. Side column: "Official sources", jump links and footnote
**What the user sees:** The full list of official links, two jump links ("Mandates & targets", "Live updates"), and the note "Summary snapshot compiled from government records; confirm against the official sources listed."

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Official sources list | All government links | Same as section 3 | Hand-written | When the page opens | ⚪ |
| Jump links + footnote | Fixed text | Written in the component | Hand-written | Never | ⚪ |

**Code:** `CountryPolicyPage.tsx`

### Behind the scenes: page title and search-engine description
Built from the country name and programme list in `taxonomy.ts` (not the AI version). ⚪

## Problems spotted
- **AI text is labelled as government records.** The intro sentence, "Profile snapshot", "Targets at a glance" and programme tags can be rewritten by Gemini from news headlines (`country-enrichment.server.ts`). The page footnote still says "compiled from government records". Nothing on the page says the text is AI-written.
- **Search engines and first page load see empty mandates.** The profile, mandates and official sources are only loaded in the browser after the page opens (`useCountryData.ts`, no server preload). So the first HTML shows "0 tracked mandates", "No active obligations tracked for this jurisdiction yet." and "No official sources linked yet.", and the intro shows the hand-written text before switching to the database/AI text.
- **Editing `mandates.ts` may not change the site.** When the `country_mandates` table has rows, the page reads only the table. A change to `mandates.ts` only appears after someone calls `/api/public/seed-country-data` again. The same goes for country text in `taxonomy.ts` versus `country_profiles`, and the seed overwrites any AI edits.
- **Official sources change depending on where the data comes from.** From the database, the list is every mandate's `official_sites` joined together with no de-duplication, and `GOVERNMENT_SITES` is ignored. From the file fallback, it is only `GOVERNMENT_SITES`. A tidier helper (`governmentSitesForCountry` in `mandates.ts`) exists but is not used.
- `/api/public/scheduled-jobs` requires `CRON_SECRET` or the supply ingest key. The separate hourly policy-ingestion route requires `CRON_SECRET`.
- **The `country_profiles` and `country_mandates` tables have no migration in `supabase/migrations/`.** They exist only in the generated types file, so how they were created is unclear.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
