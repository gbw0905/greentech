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
| "Global bioenergy market" | "$151B", "2025 annual market estimate" | A fixed $151B / 2025 value in `bioenergy-market-value.ts`, cited from a commercial market report (Global Market Insights). There is no live read | Hand-written | Only when someone edits it | 🟡 |

**Code:** `src/features/home/components/HomeHero.tsx`, `src/features/home/components/DottedPolicyGlobe.tsx`, `src/features/home/components/HeroFlow.tsx`, `src/features/home/home-stats.ts`, `src/features/home/bioenergy-market-value.ts`

### 2. "Markets that move biofuel economics"
**What the user sees:** A header "Daily · U.S. EIA" with "Prices for <date of last observation>", and three tabs: **Benchmark markets**, **Credits & ethanol** and **Biofuel stocks**.

**Tab "Benchmark markets"** (the default)

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 5 market cards | WTI Crude, Brent Crude, Henry Hub Gas, Diesel (NY Harbor ULSD), Jet Fuel (US Gulf Coast): daily spot price and day-over-day change | U.S. EIA daily spot prices read from the public tables on eia.gov (`getOilPricesFn`, `official/eia.server.ts`). Pre-loaded on the server for the first view | Live. Kept 6 h in server memory and in Supabase `official_price_cache`; the last good copy is shown if eia.gov is down | Every 30 min in browser | 🟢 |
| Detail panel | Price, unit, "30-day change" | Same EIA data | Live | Same | 🟢 |
| Price chart + range buttons | Daily prices for 1 month. Longer ranges (3 months / 1 year / 5 years / max) are cut from the same EIA history when you pick them. "Max" is weekly | EIA history (`getMarketHistoryFn`) | Live (same cache) | When you change range | 🟢 |
| "Compare with" buttons | Indexed chart of two benchmarks (start = 100) | Same EIA data | Live | When clicked | 🟢 |
| "Recent comparison" slider | % change over 1-30 days | EIA 1-year history | Live | 5 min | 🟢 |
| "Why it matters" text | One fixed sentence per benchmark | Code | Hand-written | Never | ⚪ |
| "AI market outlook" (click to open) | About 150 words of commentary, a "Regenerate" button, and an "AI-generated… may contain errors" note | Google Gemini (`gemini-3.8-flash`), given the latest 30-day EIA price series. You must be signed in, and there's a per-user limit. | AI | Only when clicked. Not saved anywhere. | 🟡 (AI text on 🟢 data) |

**Tab "Credits & ethanol"** (`BioenergyPricesPanel.tsx`)

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| California LCFS credit price | Monthly volume-weighted average price per credit, number of transfers and credits, by month / quarter / year | California Air Resources Board monthly "credit transfer" PDF (`official/carb-lcfs.server.ts`) | Live. Kept 24 h in server memory and `official_price_cache` | Every hour in browser | 🟢 |
| U.S. ethanol (plant gate) | Average $/gal across state quotes, with low / high | USDA AMS "National Weekly Ethanol Report" (AMS 3616) PDF (`official/usda-ethanol.server.ts`) | Live. Kept 12 h in the same cache | Every hour in browser | 🟢 |
| Dried distillers grains (DDGS) and distillers corn oil | Weekly average and year-ago value | Same USDA report | Live | Same | 🟢 |
| Source link and publication date | "Source: USDA AMS…, published <date>", and a note if the copy is stale | Same | Live | Same | 🟢 |

**Tab "Biofuel stocks": "Biofuel company shares"**

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| List of 10 companies | Valero, Bunge, ADM, Darling, Neste, Verbio, Green Plains, Aemetis, Gevo, Alto: name, ticker, "focus" line | `BIOFUEL_STOCKS` list in `oil-server-functions.ts` | Hand-written | Never | ⚪ |
| Company logos | Small logo next to each company | Image files in `public/market-logos/` | Hand-written | Never | ⚪ |
| Share price chart for the selected company | TradingView "symbol overview" chart with price and % change. A note says prices are delayed by the exchanges | Free embeddable widget from TradingView (`TradingViewWidget.tsx`), loaded in the visitor's browser. The site does not store or serve the prices. TradingView's attribution link is kept | Live (third-party embed) | By TradingView | 🟢 (licensed embed) |

**Code:** `src/features/markets/components/OilPricePanel.tsx`, `src/features/markets/components/BioenergyPricesPanel.tsx`, `src/features/markets/components/TradingViewWidget.tsx`, `src/features/markets/bioenergy-prices-server-functions.ts`, `src/features/markets/oil-server-functions.ts`, `src/features/markets/benchmarks.ts`, `src/features/markets/outlook-server-functions.ts`, `src/features/markets/official/` (`eia.server.ts`, `carb-lcfs.server.ts`, `usda-ethanol.server.ts`, `store.server.ts`)

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
| Colour / status | Mandated, Policy framework, etc. | `policy_status` in the Supabase `country_profiles` table (starts from `taxonomy.ts`; falls back to it before the data loads) | AI (daily job `enrichStaleProfiles`): Gemini re-checks countries with new trusted news and may change the status only if it quotes, word for word, an article from the archive (`profile-update-rules.ts`) | Up to 10 countries a day | 🟡 |
| Shade strength + "N updates" on hover | Number of news items tagged to that country | Counted in the browser from the latest 1,000 rows of `policy_updates` | Daily job | Every 2 min in browser | 🟡 |
| Hover card "Stock index" | Only the name of that country's main stock index (e.g. DAX, Bovespa), or "—". No levels or daily % any more | Index names in `country-markets.ts`. Countries without their own index (Colombia, Nigeria, Kenya, UAE) are left out | Hand-written | Never | ⚪ |
| Hover card "Region" | e.g. "Europe" | `taxonomy.ts` | Hand-written | Never | ⚪ |
| Summary pop-up | Country name, status, blurb, "Ethanol", "Biodiesel / renewable diesel", "SAF / advanced fuels", "Key instruments", a source line ("Last changed <date> from <outlet>: “quote”" or "Checked … no change found"), and links to "Full policy profile" / "Live updates" | `country_profiles` (blurb, mandates, frameworks, `last_change_*` source columns) via `getLiveCountryProfilesFn` | AI (same rules as the colour) | Up to 10 countries a day | 🟡 |

**Code:** `src/features/countries/components/PolicyMapSection.tsx`, `src/features/countries/components/WorldPolicyMap.tsx`, `src/features/countries/components/CountrySummaryModal.tsx`, `src/features/countries/country-markets.ts`, `src/features/policy/taxonomy.ts`, `src/features/countries/live-profiles.ts`, `src/features/policy/server/country-enrichment.server.ts`, `src/features/policy/profile-update-rules.ts`

### 5. "Latest updates"
**What the user sees:** Filter tabs (all / market / policy) with counts, one big "Newest" card and up to 4 smaller cards, then a "View all updates" button that goes to /timeline.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 5 update cards | Market/Policy tag, date, country, headline, first fuel tag, source name. Clicking opens the original article. | `policy_updates` table (newest 5). Headlines come from official feeds (Federal Register, GOV.UK, EU, etc.) and trade/association RSS feeds. Country, fuel and category come from keyword rules, not AI. | Daily job (visitors no longer trigger imports) | Every 2 min in browser | 🟢 official feeds / 🟡 trade-press headlines |
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
These items are **not** used on `/`. They appear on `/supply` and other pages instead: `OilStocksPanel` (the 47 oil & gas companies), `certifications.ts`, `market-caps.ts` (hand-written market caps) and `entity-logos.ts` (Logo.dev).

## Problems spotted
- **Benchmark prices are daily, not live.** EIA publishes one spot price per day, a few days behind. The header says "Daily · U.S. EIA" and shows the date of the last observation. The `official_price_cache` migration must be applied, or the cache is in server memory only.
- **EPA RIN prices are not included.** EPA publishes them only in an interactive dashboard, so there is no safe file to read.
- **Official pages are read as HTML and PDF.** The EIA tables, the CARB transfer PDF and the USDA AMS 3616 PDF are parsed with custom code. If a publisher changes the layout or the PDF link, that card stops updating and the last good copy (marked stale) is shown.
- **TradingView is a third-party script.** The "Biofuel stocks" tab loads TradingView's embed in the visitor's browser. The Privacy Policy doesn't mention it (see `legal.md`). The prices are delayed and are not stored by us.
- **Map counts and archive count don't match.** The "N updates" per country on the map comes from only the newest 1,000 updates. The hero's "Updates in archive" counts the whole table, so the two can disagree once the archive passes 1,000 items.
- **Archive counts are lower after the news change.** Google News rows stay until they age out (180 days), but nothing new is added from them, so the counts and the "Latest updates" cards will thin out over time.
- **Two sources for the country list.** "Jurisdictions" counts the `country_profiles` database table, but the map colours and pop-ups use the hand-typed `COUNTRIES` list in `taxonomy.ts`. If one is updated without the other, they drift apart.
- **The $151B market figure is a cited value from a commercial report.** It is typed in, with no live read, and never updates on its own. The site doesn't link to or credit the source. 🟡

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
