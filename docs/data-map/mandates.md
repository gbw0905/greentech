# Mandate tracker — `/mandates`

> **In one line:** A searchable directory of every tracked biofuel/SAF blending obligation worldwide, with timelines, requirements, penalties and source links.
> **Route file:** `src/routes/mandates.tsx`

## Sections (top to bottom, as the user sees them)

### 1. "Biofuel mandate tracker" heading + "Tracked mandates" counter
**What the user sees:** The page title, a short intro, and a big number of tracked mandates.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title + intro | Fixed text | Written in `mandates.tsx` | Hand-written | Never | ⚪ |
| "Tracked mandates" number | Count of all mandates | Supabase `country_mandates` table (a copy of `src/features/countries/mandates.ts`). Falls back to the file if the table is empty or fails | Hand-written (preloaded on the server) | Every 5 min in the browser | ⚪ |

**Code:** `src/routes/mandates.tsx`, `src/features/countries/mandates-query.ts`, `src/features/policy/server/country-data.server.ts` (`getAllMandates`)

### 2. Status cards ("In force", "Phasing in", "Adopted — not yet applicable", "Under revision")
**What the user sees:** One clickable card per status, showing how many mandates have it. Clicking a card filters the list.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Status names | Fixed list | `MANDATE_STATUSES` in `mandates.ts` | Hand-written | Never | ⚪ |
| Counts | Mandates per status | Counted from the mandate list (section 1) | Hand-written | Every 5 min | ⚪ |

**Code:** `src/routes/mandates.tsx`

### 3. Search and filters ("Search jurisdiction or instrument", Fuel, Status)
**What the user sees:** A search box, fuel pills (Ethanol, Biodiesel, SAF…), status pills, and "Showing X of Y tracked mandates" with a "verify against the primary document" warning.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Fuel / status options | Fixed lists | `MANDATE_FUELS`, `MANDATE_STATUSES` in `mandates.ts` | Hand-written | Never | ⚪ |
| Search text, chosen pills | Visitor's choices | Fuel is kept in the URL (`?fuel=`). Status and search stay on screen only | User input (not saved) | — | 🟢 |

**Code:** `src/routes/mandates.tsx`

### 4. "Mandate directory" cards
**What the user sees:** One card per mandate: status, fuel tags, flag, jurisdiction, instrument name, current obligation, and an "Open jurisdiction profile" link. A fold-out ("Timeline, requirements & compliance", open on the first card) shows the timeline steps (ticked when reached), requirements, administrator, how compliance is shown, penalty, tradable unit, the primary source link and "Last reviewed".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| All card text | Every mandate field above | `country_mandates` table, copied from `src/features/countries/mandates.ts` by `/api/public/seed-country-data`. Falls back to the file. All 39 entries in the file say `lastReviewed: "2026-09"` | Hand-written | Every 5 min in the browser | ⚪ |
| Flag | Flag image | Emoji in `taxonomy.ts` → image from flagcdn.com | Hand-written + Live image | Never | 🟢 |
| Primary source link | Link to the law / regulator | `sourceUrl` / `sourceName` in `mandates.ts` | Hand-written | — | ⚪ |

**Code:** `src/routes/mandates.tsx`, `src/features/countries/mandates.ts`, `src/features/countries/components/CountryFlag.tsx`

### Behind the scenes: search-engine data
The page's structured data (JSON-LD list of mandates) is always built from the `mandates.ts` file, not the database. ⚪

## Problems spotted
- **Editing `mandates.ts` may not change what visitors see.** If the `country_mandates` table has rows, the page shows only the table. File edits appear only after someone calls `/api/public/seed-country-data` again. The search-engine data (JSON-LD) always uses the file, so the two can disagree.
- **"Last reviewed 2026-09" is the same on every entry**, and nothing updates it automatically. It is now over a month old (today is 2026-11-01).
- **The `country_mandates` table has no migration in `supabase/migrations/`**, so how it was created is unclear.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
