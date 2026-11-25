# Every page (header, ribbon, footer): shared on all routes

> **In one line:** The frame around every page: top menu, the sliding "Markets" ribbon, and the footer with the newsletter sign-up.
> **Route file:** `src/routes/__root.tsx` (wraps every page in `src/components/SiteLayout.tsx`)

## Sections (top to bottom, as the user sees them)

### 1. Header: "Global Bioenergy Watch" logo + menu
**What the user sees:** The logo and site name, five drop-down menus (Global Markets, Datasets, Products, Bioenergy Jobs, About Us), and a Sign In / Sign up button (or your profile picture once signed in). On phones the menus fold into a burger button.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Logo + name | Site logo image and "Global Bioenergy Watch" | `src/assets/logo.png`, text in code | Hand-written | Never | ⚪ |
| Menu items | Global Markets (Benchmarks, Jurisdiction map, Latest policy updates, Mandate tracker, Videos) · Datasets (Suppliers & producers, Data sources) · Products (CIVanta, Policy Document Analyzer) · Bioenergy Jobs (Open roles) · About Us (What we do, Mission & vision, Team members) | `NAV_GROUPS` list in the header file | Hand-written | Never | ⚪ |
| Sign In / Sign up button | "Sign In" on the home page, "Sign up" elsewhere | Fixed text | Hand-written | Never | ⚪ |
| Profile avatar + menu | Your photo or first letter of your name; "View Profile", "Sign Out" | Your account (Supabase login, read via `/api/auth/session`) | User input | When you sign in or out | 🟢 |

There's no search box and there are no live counts in the header.

**Code:** `src/components/SiteHeader.tsx`, `src/features/auth/components/AuthButton.tsx`, `src/features/auth/hooks/useAuthSession.ts`

### 2. Sliding ribbon: "Markets"
**What the user sees:** A thin white bar under the menu. On the left are a green dot, the word "Markets" and "X viewing now · Y total views". In the middle, 5 market prices and 4 policy headlines slide past. On the right (wide screens only) is "News updated <date>".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| "Markets" label | Fixed word with a pulsing dot | Code | Hand-written | Never | ⚪ |
| "X viewing now" | Number of different visitors seen in the last 5 minutes | `site_visits` table, `get_traffic_stats` database function | Own tracking | Every 30 s in browser | 🟢 |
| "Y total views" | Count of every row ever saved in `site_visits` | Same as above | Own tracking | Every 30 s in browser | 🟢 |
| 5 sliding prices | WTI Crude (EIA RWTC), Brent Crude (EIA RBRTE), Henry Hub Gas (EIA RNGWHHD), Diesel (NY Harbor ULSD), Jet Fuel (US Gulf Coast): daily spot price and change since the previous day | U.S. EIA daily spot prices, read from the public tables on eia.gov (`official/eia.server.ts`). EIA data is public domain | Live. Kept 6 h in server memory and in the Supabase table `official_price_cache`. A series is re-read from eia.gov only when its copy is older than 6 h. If eia.gov is down, the last good copy is shown | Every 30 min in browser (the price itself changes once a day) | 🟢 |
| 4 sliding headlines | Country name (or "Global") · headline title, newest 4 | `policy_updates` table, filled from official feeds (Federal Register, GOV.UK, EU, EIA, CARB and others) and trade/association RSS feeds | Daily job. Visitors no longer start imports | Every 60 s in browser | 🟢 official feeds / 🟡 trade-press headlines |
| "News updated <date>" | A date such as "16 Nov 2026" | Newest `updated_at` in `policy_updates`, which is the time the last collection wrote to the table (`lastCollectedAt` in the policy server file) | Live (one small database read) | Every 60 s | 🟢 |

**Code:** `src/features/markets/components/LiveMarquee.tsx`, `src/features/markets/oil-server-functions.ts` (`getOilPricesFn`), `src/features/markets/benchmarks.ts`, `src/features/markets/official/eia.server.ts`, `src/features/markets/official/store.server.ts`, `src/features/traffic/client.ts`, `src/features/traffic/server-functions.ts` (`getTrafficStatsFn`), `src/features/policy/feed-query.ts`, `src/features/policy/server-functions.ts` (`getPolicyFeed`), `src/features/policy/sources.ts`, `src/features/policy/server/policy-ingest.server.ts`

### 3. (Page content goes here, see each page's own file)

### 4. Footer: "Get the daily brief" + links
**What the user sees:** The logo with "Policy, Markets, Sustainability" and a short blurb, a "News updated <date>" line, an email sign-up form ("Get the daily brief") with Country and Fuel type pickers, the Company and Contact link columns, LinkedIn and WhatsApp icons, legal links, and "Back to top".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Logo, tagline, blurb | "A live intelligence desk tracking bioenergy policy…" | Code | Hand-written | Never | ⚪ |
| "News updated <date>" | Same date as the ribbon | Policy feed `fetchedAt`, now the newest `updated_at` in `policy_updates`. Shows the tagline instead if the date is unknown | Live | Every 2 min in browser | 🟢 |
| Country / Fuel type pickers | List of countries and fuel types | `COUNTRIES` and `FUEL_TYPES` in `src/features/policy/taxonomy.ts` | Hand-written | Never | ⚪ |
| Email + Subscribe | Confirmation message after you subscribe | Saved to the `alert_subscribers` table, and a confirmation email is sent | User input | On submit | 🟢 |
| Company / Contact links | About us, Mission & vision, Team members, Careers, Videos, info@globalbioenergywatch.org, LinkedIn, WhatsApp +1 628 246 6503 | Code | Hand-written | Never | ⚪ |
| Legal line | "© 2026 Global Bioenergy Watch", Privacy policy, Terms of use, Cookies | Code (the year is typed in, not calculated) | Hand-written | Never | ⚪ |

**Code:** `src/components/IntelligenceFooter.tsx`, `src/components/FooterNewsletter.tsx`, `src/features/alerts/server-functions.ts` (`subscribeToAlerts`)

## Problems spotted
- **EPA RIN prices are not on the site.** EPA publishes them only in an interactive dashboard, so there is nothing safe to read. The ribbon has the 5 EIA benchmarks only.
- **EIA prices are daily and lag by a few days.** The ribbon says so ("Daily · U.S. EIA", "Prices for <date>" on the home panel). The "% change" is day over day, not live.
- **The `official_price_cache` migration must be applied** (`20261116120000_official_price_cache.sql`). Without it the cache lives in server memory only. Every restart or new Vercel instance then starts empty, and if eia.gov is down at that moment the ribbon has no prices.
- **The EIA tables are read as HTML.** `eia.server.ts` parses the public history pages with regular expressions. If EIA changes the page layout, prices stop updating (the last good copy is kept).
- **Much less news than before.** The Google News searches and the monthly backfill are gone. Only the direct official and trade/association feeds in `sources.ts` remain, so the ribbon and the archive have far fewer items. Old Google News rows stay until they age out (180 days).
- **The news import has no visitor trigger any more.** The daily job (`/api/public/scheduled-jobs`) runs it, and so does the hourly Supabase job that calls `/api/public/ingest-policy`. That second route has no password check, so anyone who calls it runs an RSS sweep.
- **"Total views" leaves out many pages.** Views are recorded only where `useVisitTracker()` is called: home, /videos, /timeline, /jobs, the country pages and the get-alerts page. Visits to /supply, /mandates, /civanta, /about and others are not counted.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
