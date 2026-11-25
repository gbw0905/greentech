# Data map: where every piece of data on the site comes from

One file per page. Each file lists the page's sections **top to bottom as a visitor sees them**, and for every piece of data: what it shows, where it comes from, how it gets there, how often it refreshes, and a status.

Surveyed 1 Nov 2026 from the code, updated 16 Nov 2026 (no live production check).

## Status key

| | Meaning |
|---|---|
| 🟢 | Our own data, official/open government data, or a licensed API |
| 🟡 | Allowed with care: trade-press RSS headlines + link, AI-written text, figures cited from copyrighted reports |
| 🔴 | Not allowed / risky. Nothing is 🔴 at the moment. Yahoo Finance `query1` and YouTube scraping were removed on 16 Nov 2026 |
| ⚪ | Hand-written in a code file. Only changes when someone edits it |

## Pages

| Page | URL | File | 🔴 items |
|---|---|---|---|
| **On every page:** header, sliding "Markets" ribbon, footer | all | [00-every-page.md](00-every-page.md) — |
| Home | `/` | [home.md](home.md) — |
| **Global Markets** | | | |
| Latest policy updates | `/timeline` | [timeline.md](timeline.md) | — |
| Mandate tracker | `/mandates` | [mandates.md](mandates.md) | — |
| Country profile | `/countries/<country>` | [countries-slug.md](countries-slug.md) | — |
| Country mandates | `/countries/<country>/mandates` | [countries-slug-mandates.md](countries-slug-mandates.md) | — |
| Country updates | `/countries/<country>/updates` | [countries-slug-updates.md](countries-slug-updates.md) | — |
| Videos | `/videos` | [videos.md](videos.md) — (no key means no videos) |
| **Datasets** | | | |
| Suppliers & producers (directory) | `/supply` | [supply.md](supply.md) | — |
| One supply dataset (15 panels) | `/supply/<panel>` | [supply-panel.md](supply-panel.md) — |
| Data sources & methodology | `/data-sources` | [data-sources.md](data-sources.md) | — |
| **Products** | | | |
| CIVanta hub | `/civanta` | [civanta.md](civanta.md) | — |
| CI Scenario Workspace | `/ci-workspace` | [ci-workspace.md](ci-workspace.md) | — |
| Credit & RIN calculator | `/credit-calculator` | [credit-calculator.md](credit-calculator.md) | — |
| CIVanta Optimizer | `/civanta/optimizer` | [civanta-optimizer.md](civanta-optimizer.md) | — |
| CI calculator (older) | `/ci-calculator` | [ci-calculator.md](ci-calculator.md) | — |
| Dairy RNG calculator | `/dairy-rng-calculator` | [dairy-rng-calculator.md](dairy-rng-calculator.md) | — |
| Policy document analyzer | `/document-analyzer` | [document-analyzer.md](document-analyzer.md) | — |
| AI assistant | `/assistant` | [assistant.md](assistant.md) | — |
| Pricing | `/pricing` | [pricing.md](pricing.md) | — |
| **Other** | | | |
| Jobs | `/jobs` | [jobs.md](jobs.md) | — |
| Get alerts / confirm alerts | `/get-alerts`, `/alerts/confirm` | [get-alerts.md](get-alerts.md), [alerts-confirm.md](alerts-confirm.md) | — |
| Account pages | `/auth`, `/profile`, `/my-results`, … | [account.md](account.md) | — |
| About & contact | `/about`, `/about/team`, `/contact`, … | [about.md](about.md) | — |
| Privacy & terms | `/privacy`, `/terms` | [legal.md](legal.md) | — |

## Where the data actually comes from (whole site)

| Source | Used for | Status |
|---|---|---|
| U.S. EIA daily spot prices (eia.gov tables, cached in `official_price_cache`) | Ribbon prices and home "Benchmark markets" (WTI, Brent, Henry Hub, NY Harbor ULSD, US Gulf Coast jet); base for the AI market outlook | 🟢 |
| CARB monthly LCFS credit transfer PDF, USDA AMS National Weekly Ethanol Report (AMS 3616) | Home "Credits & ethanol" tab | 🟢 |
| TradingView free symbol-overview embed (delayed) | Home "Biofuel stocks" tab | 🟢 (licensed embed) |
| Official feeds and open data: Federal Register, GOV.UK, EU, EUR-Lex, US DOE, EIA, CARB, NZ Government, Natural Resources Canada, Ember, data.gov.sg, IMO | Policy headlines, supply parsers | 🟢 |
| Trade and association RSS feeds (Bioenergy International, Canary Media, Energy Monitor, ICCT, Mongabay, ET EnergyWorld, Antara, Clean Fuels Alliance America, Growth Energy) | Policy headlines | 🟡 |
| Report figures (IATA, IEA, IRENA, Methanol Institute, GM Insights) | Supply charts, home "$151B market" figure (fixed cited value) | 🟡 |
| YouTube Data API (no scraping; no key means no videos) | `/videos` | 🟢 |
| Google Gemini | Assistant, document analyzer, market outlook, daily check of country profiles (map colours and pop-ups; a change needs a word-for-word quote from a trusted article, shown as its source) | 🟡 |
| Logo.dev (licensed token) | Company logos | 🟢 |
| Hand-written code files | Mandates, company lists (incl. `/supply/oil`), market caps, tickers, country index names, emission factors, benchmarks, preset prices | ⚪ |
| Our own Supabase tables | Visitor counts, saved runs, accounts, alerts, chats, price cache | 🟢 |

Removed on 16 Nov 2026: Yahoo Finance `query1`, all Google News RSS searches (and the monthly news backfill), the Google News hiring scraper, both YouTube scraping fallbacks, the GM Insights live scrape, and the unused Neste/Argus RIN scraper.

## Biggest findings (details in each file)

Resolved on 16 Nov 2026: Yahoo Finance prices everywhere, "Last Updated" showing today's date (now "News updated", the real collection time), the AI claims on the home hero and `/get-alerts` and in alert emails, the open `/api/public/scheduled-jobs` route (needs `CRON_SECRET` or the admin key), YouTube scraping and `refresh: true`, the unshown hiring news feed, and the GM Insights scrape.

1. **Editing `mandates.ts` doesn't update the live site.** Country pages read database copies that only change when the seed endpoint is run. Gemini rewrites parts of them daily under a "compiled from government records" note, and that still publishes automatically ([countries-slug.md](countries-slug.md)). Since 16 Nov 2026 the home map reads these database copies too, so the map and country pages match. Automatic changes now need a quoted source (migration `20261116150000_country_profile_change_source.sql` must be applied, or every change is refused). Known wrong statuses from the original list (e.g. Indonesia "Policy framework" despite B40; New Zealand "Mandated" after repeal) are only corrected when news about that country arrives.
2. **The two CI engines disagree.** `/ci-calculator` uses CA LCFS benchmarks 79.16 / 79.51, while `/ci-workspace` uses 75.16 / 80.17 (2026). The dairy 107% allocation fix exists only in the workspace engine ([ci-calculator.md](ci-calculator.md), [dairy-rng-calculator.md](dairy-rng-calculator.md)).
3. **`/ci-calculator` and `/dairy-rng-calculator` are read-only** for everyone except one hard-coded owner email ([ci-calculator.md](ci-calculator.md)).
4. **Supply charts are still mostly hand-written.** Only 7 of the 15 panels put parsed numbers into the main chart, and the "fresh / refresh due" label is never displayed. Market caps and the `/supply/oil` list are also typed by hand now ([supply-panel.md](supply-panel.md)).
5. **The Privacy Policy doesn't mention** that chats and uploaded documents are stored and sent to Google Gemini, or that the home "Biofuel stocks" tab loads a third-party TradingView script ([legal.md](legal.md)).
6. **News volume is much lower.** Without Google News, only the direct official and trade feeds add items. Old Google News rows stay until they age out (180 days), so the archive will shrink. Several useful sources (EPA, USDA, IEA, IRENA, ICAO, Biofuels Digest) have no working public feed ([timeline.md](timeline.md)).
7. **EPA RIN prices are not on the site.** EPA publishes them only in an interactive dashboard. The unused `src/features/home/rin-trading-value.ts` shows the dashboard's public engine can be read (yearly dollar value of RIN trades, about $47B for 2026 to 21 Sep). The "Credits & ethanol" tab has LCFS and ethanol prices only ([home.md](home.md)).
8. **The `official_price_cache` migration must be applied** (`supabase/migrations/20261116120000_official_price_cache.sql`). Without it, prices are cached in server memory only and vanish on restart ([00-every-page.md](00-every-page.md), [../backend-tables.md](../backend-tables.md)).
9. **Official prices are read from web pages and PDFs.** EIA tables, the CARB PDF and the USDA PDF are parsed by custom code and can break if the publisher changes the layout. The last good copy is shown meanwhile ([home.md](home.md)).
10. **Some routes and functions are still open.** `/api/public/ingest-policy` (news import, called hourly by Supabase), the supply refresh functions, and `/api/public/policy-alert-digest` have no password check ([00-every-page.md](00-every-page.md), [supply-panel.md](supply-panel.md), [get-alerts.md](get-alerts.md)).
11. **No video key means an empty `/videos` page.** Check that `YOUTUBE_API_KEY` is set on Vercel ([videos.md](videos.md)).
