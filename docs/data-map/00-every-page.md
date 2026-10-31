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
**What the user sees:** A thin white bar under the menu. On the left are a green dot, the word "Markets" and "X viewing now · Y total views". In the middle, 5 market prices and 4 policy headlines slide past. On the right (wide screens only) is "Last Updated <date>".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| "Markets" label | Fixed word with a pulsing dot | Code | Hand-written | Never | ⚪ |
| "X viewing now" | Number of different visitors seen in the last 5 minutes | `site_visits` table, `get_traffic_stats` database function | Own tracking | Every 30 s in browser | 🟢 |
| "Y total views" | Count of every row ever saved in `site_visits` | Same as above | Own tracking | Every 30 s in browser | 🟢 |
| 5 sliding prices | WTI Crude (CL=F), Brent Crude (BZ=F), S&P 500 (^GSPC), NYSE Composite (^NYA), Natural Gas (NG=F): price and % change since the previous close | Yahoo Finance `query1` chart API (unofficial; sends a fake browser "Mozilla/5.0" User-Agent) | Live. The server keeps a copy in memory for 60 s. If Yahoo fails, it shows the last good copy. | Every 60 s in browser | 🔴 |
| 4 sliding headlines | Country name (or "Global") · headline title, newest 4 | `policy_updates` table, filled from Google News RSS searches + official feeds such as the Federal Register | Daily job. Also re-run in the background when a visitor arrives and the newest item is more than 4 h old. | Every 60 s in browser | 🟡 |
| "Last Updated <date>" | A date such as "01 Nov 2026" | `fetchedAt` from the policy feed, which is simply the moment the server read the database | Live | Every 60 s | ⚪ |

**Code:** `src/features/markets/components/LiveMarquee.tsx`, `src/features/markets/oil-server-functions.ts` (`getOilPricesFn`), `src/features/markets/benchmarks.ts`, `src/features/markets/server/market-cache.server.ts`, `src/features/traffic/client.ts`, `src/features/traffic/server-functions.ts` (`getTrafficStatsFn`), `src/features/policy/feed-query.ts`, `src/features/policy/server-functions.ts` (`getPolicyFeed`), `src/features/policy/sources.ts`, `src/features/policy/server/policy-ingest.server.ts`

### 3. (Page content goes here, see each page's own file)

### 4. Footer: "Get the daily brief" + links
**What the user sees:** The logo with "Policy, Markets, Sustainability" and a short blurb, a "Last Updated <date>" line, an email sign-up form ("Get the daily brief") with Country and Fuel type pickers, the Company and Contact link columns, LinkedIn and WhatsApp icons, legal links, and "Back to top".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Logo, tagline, blurb | "A live intelligence desk tracking bioenergy policy…" | Code | Hand-written | Never | ⚪ |
| "Last Updated <date>" | Same date as the ribbon | Policy feed `fetchedAt` (the time of the request, see Problems) | Live | Every 2 min in browser | ⚪ |
| Country / Fuel type pickers | List of countries and fuel types | `COUNTRIES` and `FUEL_TYPES` in `src/features/policy/taxonomy.ts` | Hand-written | Never | ⚪ |
| Email + Subscribe | Confirmation message after you subscribe | Saved to the `alert_subscribers` table, and a confirmation email is sent | User input | On submit | 🟢 |
| Company / Contact links | About us, Mission & vision, Team members, Careers, Videos, info@globalbioenergywatch.org, LinkedIn, WhatsApp +1 628 246 6503 | Code | Hand-written | Never | ⚪ |
| Legal line | "© 2026 Global Bioenergy Watch", Privacy policy, Terms of use, Cookies | Code (the year is typed in, not calculated) | Hand-written | Never | ⚪ |

**Code:** `src/components/IntelligenceFooter.tsx`, `src/components/FooterNewsletter.tsx`, `src/features/alerts/server-functions.ts` (`subscribeToAlerts`)

## Problems spotted
- **"Last Updated" always shows today's date.** `readFeed()` sets `fetchedAt = new Date()` at the moment it reads the database. So the date in the ribbon and the footer is "when you opened the page". It is not the time the news was last collected, and not the time of the prices beside it.
- **Market prices come from Yahoo Finance's unofficial `query1` API** and pretend to be a browser (`User-Agent: Mozilla/5.0`). There's no licence for this. 🔴
- **The price cache lives in server memory only** (`market-cache.server.ts`). Every restart or new Vercel instance starts empty. If Yahoo is down at that moment, the ribbon has no prices at all.
- **Visitors can trigger news collection.** `getPolicyFeed` starts a full ingest in the background when the newest headline is more than 4 h old, on top of the 00:17 UTC daily job. The 4-hour limit is also held in server memory only.
- **"Total views" leaves out many pages.** Views are recorded only where `useVisitTracker()` is called: home, /videos, /timeline, /jobs, the country pages and the get-alerts page. Visits to /supply, /mandates, /civanta, /about and others are not counted.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
