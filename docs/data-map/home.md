# Home: `/`

> **In one line:** The front page. It shows headline counts, live market prices, a clickable world policy map, the newest policy and market news, and an overview of what the site does.
> **Route file:** `src/routes/index.tsx`

Header, sliding ribbon and footer are covered in `00-every-page.md`.

## Sections (top to bottom, as the user sees them)

### 1. "Global bioenergy policy and markets, in one place."
**What the user sees:** A headline, two buttons ("Open the policy map", "Read today's updates"), a spinning dotted globe, and four big numbers.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Headline, intro text, buttons | Marketing copy | Code | Hand-written | Never | ⚪ |
| Spinning globe | Dots, pins, arcs, and the words "Policy / Markets / Prices", "Ethanol, Biodiesel…" | `src/features/home/data/globe-points.json` plus fixed pin positions in code. Decoration only; the code says so. | Hand-written | Never | ⚪ |
| "Updates in archive" | Exact number of rows in `policy_updates` | Supabase `policy_updates` table | Daily job (counted live on page load) | Every 5 min in browser | 🟡 |
| "Jurisdictions" | Number of rows in `country_profiles` | Supabase `country_profiles` table | Live (database count) | Every 5 min | 🟢 |
| "Policy updates" | Rows in `policy_updates` that are not category "market" | Supabase `policy_updates` | Daily job (counted live) | Every 5 min | 🟡 |
| "Global bioenergy market" | "$151B", "2025 annual market estimate" | A fixed $151B / 2025 value in code. Once a day the server also tries to read a newer figure from the GM Insights report web page. | Hand-written + Live scrape (kept in server memory 24 h) | Once a day | 🟡 |

**Code:** `src/features/home/components/HomeHero.tsx`, `src/features/home/components/DottedPolicyGlobe.tsx`, `src/features/home/components/HeroFlow.tsx`, `src/features/home/home-stats.ts`, `src/features/home/bioenergy-market-value.ts`

### 2. "Markets that move biofuel economics"
**What the user sees:** A "Live / Last close" badge with an "Updated hh:mm UTC" time, and two tabs: **Benchmark markets** and **Biofuel stocks**.

**Tab "Benchmark markets"** (the default)

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 5 market cards | WTI Crude, Brent Crude, S&P 500, NYSE Composite, Natural Gas: price and 1-day % | Yahoo Finance `query1` chart API (`getOilPricesFn`). Pre-loaded on the server for the first view. | Live, server memory cache 60 s | Every 60 s in browser | 🔴 |
| Detail panel | Price, unit, "1D change", "30-day change" | Same Yahoo data | Live | Every 60 s | 🔴 |
| Price chart + range buttons | Daily closes for 1 month. Longer ranges (3 months / 1 year / 5 years / max) are fetched when you pick them. | Yahoo `query1` (`getMarketHistoryFn`) | Live, server memory cache 5 min | When you change range | 🔴 |
| "Compare with" buttons | Indexed chart of two benchmarks (start = 100) | Same Yahoo data | Live | When clicked | 🔴 |
| "Recent comparison" slider | % change over 1–30 days, "Latest close", "Previous close" | Yahoo 1-year history | Live | 5 min | 🔴 |
| "Why it matters" text | One fixed sentence per benchmark | Code | Hand-written | Never | ⚪ |
| "AI market outlook" (click to open) | About 150 words of commentary, a "Regenerate" button, and an "AI-generated… may contain errors" note | Google Gemini (`gemini-3.8-flash`), given the Yahoo numbers. You must be signed in, and there's a per-user limit. | AI | Only when clicked. Not saved anywhere. | 🟡 (built on 🔴 data) |

**Tab "Biofuel stocks": "Biofuel company shares"**

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| List of 10 companies | Valero, Bunge, ADM, Darling, Neste, Verbio, Green Plains, Aemetis, Gevo, Alto: name, ticker, "focus" line | `BIOFUEL_STOCKS` list in `oil-server-functions.ts` | Hand-written | Never | ⚪ |
| Company logos | Small logo next to each company | Image files in `public/market-logos/` | Hand-written | Never | ⚪ |
| Share price, 1D %, chart, 30-day change, "Last market quote" | Price per share and history | Yahoo `query1` (`getBiofuelStocksFn`, `getMarketHistoryFn`) | Live, server memory cache 60 s | Every 60 s in browser | 🔴 |

**Code:** `src/features/markets/components/OilPricePanel.tsx`, `src/features/markets/oil-server-functions.ts`, `src/features/markets/benchmarks.ts`, `src/features/markets/outlook-server-functions.ts`, `src/features/markets/server/market-cache.server.ts`

### 3. "Programs & schemes"
**What the user sees:** A sliding row of logos: US EPA (RFS), CORSIA, ISCC, 45Z, Verra, CARB, REDcert, Gold Standard, Puro.earth and others.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Program logos | About 20 third-party program and scheme logos with names | `program-logos.json` + image files in `public/program-logos/` | Hand-written | Never | ⚪ |

**Code:** `src/features/home/components/ProgramRibbon.tsx`, `src/features/home/components/program-logos.json`

### 4. "Policy activity by jurisdiction"
**What the user sees:** A zoomable world map coloured by policy status (Mandated / Policy framework / In development / No framework). Hovering over a country shows a small card. Clicking opens a country summary pop-up.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Country shapes | World outline | `public/world-110m.json` (open Natural Earth data) | Hand-written (static file) | Never | 🟢 |
| Colour / status | Mandated, Policy framework, etc. | Worked out from the `mandates` list typed into `COUNTRIES` in `taxonomy.ts` | Hand-written | Never | ⚪ |
| Shade strength + "N updates" on hover | Number of news items tagged to that country | Counted in the browser from the latest 1,000 rows of `policy_updates` | Daily job | Every 2 min in browser | 🟡 |
| Hover card "Index", "Last", "1D" | That country's stock index (e.g. DAX, Bovespa), its level and daily % | Index names in `country-markets.ts`; prices from Yahoo `query1` (`getCountryIndicesFn`) | Live | Every 5 min in browser | 🔴 |
| Hover card "Region" | e.g. "Europe" | `taxonomy.ts` | Hand-written | Never | ⚪ |
| Summary pop-up | Country name, status, blurb, "Ethanol", "Biodiesel / renewable diesel", "SAF / advanced fuels", "Key instruments", and links to "Full policy profile" / "Live updates" | `COUNTRIES` (blurb, mandates, frameworks) in `taxonomy.ts` | Hand-written | Never | ⚪ |

**Code:** `src/features/countries/components/PolicyMapSection.tsx`, `src/features/countries/components/WorldPolicyMap.tsx`, `src/features/countries/components/CountrySummaryModal.tsx`, `src/features/countries/server-functions.ts`, `src/features/countries/country-markets.ts`, `src/features/policy/taxonomy.ts`

### 5. "Latest updates"
**What the user sees:** Filter tabs (all / market / policy) with counts, one big "Newest" card and up to 4 smaller cards, then a "View all updates" button that goes to /timeline.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 5 update cards | Market/Policy tag, date, country, headline, first fuel tag, source name. Clicking opens the original article. | `policy_updates` table (newest 5). Headlines come from Google News RSS + official feeds (Federal Register, etc.). Country, fuel and category come from keyword rules, not AI. | Daily job (also triggered by visitors when stale, see `00-every-page.md`) | Every 2 min in browser | 🟡 |
| Card pictures | Stock photo picked by fuel type or category (not the article's own image) | Images in `src/assets/topic-*.jpg` | Hand-written | Never | ⚪ |
| Tab counts | Counts among those 5 cards only | Same as above | Daily job | Every 2 min | 🟡 |
| "Live scan issue: …" box | Only shown if the database read fails | Error message from `getPolicyFeed` | Live | Every 2 min | 🟢 |

**Code:** `src/features/home/components/LatestUpdatesSection.tsx`, `src/features/policy/update-images.ts`, `src/features/policy/server-functions.ts`, `src/features/policy/sources.ts`, `src/features/policy/server/policy-ingest.server.ts`

### 6. "Bioenergy industries in action"
**What the user sees:** A photo carousel with 8 slides (Biogas, Ethanol, Biodiesel, Policy, Markets, Feedstock, SAF, Renewables), each with a title and a short description.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Slide text | Titles and descriptions | `SLIDES` list in code | Hand-written | Never | ⚪ |
| Slide photos | Large photos | Loaded directly from `images.unsplash.com`. If one fails, a local `src/assets` image is used instead. | Hand-written (fixed photo IDs) | Never | 🟢 |

**Code:** `src/features/home/components/IndustryCarousel.tsx`

### 7. "One sector. Every signal."
**What the user sees:** Six feature cards (Global policy intelligence, Fuel and feedstock markets, Live development tracker, Sector company intelligence, AI-powered briefings, Bioenergy careers) next to an animated diagram that cycles through them every 8 seconds.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Feature cards, tags, links | Descriptions and links to other pages | `CAPABILITIES` list in code | Hand-written | Never | ⚪ |
| Animated pipeline | Decoration | Code | Hand-written | Never | ⚪ |

**Code:** `src/components/IntelligenceSection.tsx`, `src/components/IntelligencePipeline.tsx`

### Not on this page
These items are **not** used on `/`. They appear on `/supply` and other pages instead: `OilStocksPanel` (the 47 oil & gas stocks), `certifications.ts`, `market-caps.ts` (hand-written market caps), `entity-logos.ts` (Logo.dev), and `entity-quotes.server.ts`.

## Problems spotted
- **Yahoo Finance `query1` feeds three sections:** the 5 benchmarks, the 10 biofuel stocks plus all chart histories, and the country index hover cards. 🔴 (`oil-server-functions.ts`, `countries/server-functions.ts`)
- **Country index prices skip the cache.** `getCountryIndicesFn` calls Yahoo for every index on every request and only uses its memory copy as a fallback. Every open home page asks again every 5 minutes, and there's no request timeout.
- **The hero text overstates the AI.** It says the site "uses AI to classify and summarise each … update". The news collection code (`policy-ingest.server.ts`) uses keyword rules and the RSS description; it never calls Gemini.
- **"Live" badge.** The markets header shows "Live" whenever Yahoo answered. Yahoo's data can be delayed, and the stock panel itself says "Prices may be delayed".
- **Map counts and archive count don't match.** The "N updates" per country on the map comes from only the newest 1,000 updates. The hero's "Updates in archive" counts the whole table, so the two can disagree once the archive passes 1,000 items.
- **Two sources for the country list.** "Jurisdictions" counts the `country_profiles` database table, but the map colours and pop-ups use the hand-typed `COUNTRIES` list in `taxonomy.ts`. If one is updated without the other, they drift apart.
- **The $151B market figure is lifted from a commercial report page.** The server fetches the GM Insights web page and pulls the number out with a regular expression. The site doesn't link to or credit the source. 🟡

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
