# Data map: where every piece of data on the site comes from

One file per page. Each file lists the page's sections **top to bottom as a visitor sees them**, and for every piece of data: what it shows, where it comes from, how it gets there, how often it refreshes, and a status.

Surveyed 1 Nov 2026 from the code (no live production check).

## Status key

| | Meaning |
|---|---|
| 🟢 | Our own data, official/open government data, or a licensed API |
| 🟡 | Allowed with care: RSS headlines + link, AI-written text, figures cited from copyrighted reports |
| 🔴 | Not allowed / risky: Yahoo Finance `query1`, YouTube scraping |
| ⚪ | Hand-written in a code file. Only changes when someone edits it |

## Pages

| Page | URL | File | 🔴 items |
|---|---|---|---|
| **On every page:** header, sliding "Markets" ribbon, footer | all | [00-every-page.md](00-every-page.md) | 1 (ribbon prices) |
| Home | `/` | [home.md](home.md) | Several (prices, stocks, country indices) |
| **Global Markets** | | | |
| Latest policy updates | `/timeline` | [timeline.md](timeline.md) | — |
| Mandate tracker | `/mandates` | [mandates.md](mandates.md) | — |
| Country profile | `/countries/<country>` | [countries-slug.md](countries-slug.md) | — |
| Country mandates | `/countries/<country>/mandates` | [countries-slug-mandates.md](countries-slug-mandates.md) | — |
| Country updates | `/countries/<country>/updates` | [countries-slug-updates.md](countries-slug-updates.md) | — |
| Videos | `/videos` | [videos.md](videos.md) | Only if the YouTube key is missing |
| **Datasets** | | | |
| Suppliers & producers (directory) | `/supply` | [supply.md](supply.md) | — |
| One supply dataset (15 panels) | `/supply/<panel>` | [supply-panel.md](supply-panel.md) | Share prices, Oil page |
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
| Yahoo Finance `query1` (unofficial) | Ribbon prices, home market panels, biofuel stocks, country indices, share prices on supply pages, the whole `/supply/oil` page | 🔴 |
| Google News RSS | Most policy headlines (ribbon, home, timeline, country updates) | 🟡 |
| Official feeds and open data: Federal Register, GOV.UK, EU, EIA, EPA, Ember, data.gov.sg, IMO | Policy headlines, supply parsers | 🟢 |
| Trade magazine RSS feeds (Biofuels Digest, Biomass Magazine, etc.) | Policy headlines | 🟡 |
| Report figures (IATA, IEA, IRENA, Methanol Institute, GM Insights) | Supply charts, home "$151B market" figure | 🟡 |
| YouTube Data API (scraping if the key is missing) | `/videos` | 🟢 (🔴 fallback) |
| Google Gemini | Assistant, document analyzer, market outlook, daily rewrite of country profiles | 🟡 |
| Logo.dev (licensed token) | Company logos | 🟢 |
| Hand-written code files | Mandates, company lists, market caps, tickers, emission factors, benchmarks, preset prices | ⚪ |
| Our own Supabase tables | Visitor counts, saved runs, accounts, alerts, chats | 🟢 |

## Biggest findings (details in each file)

1. **Yahoo Finance is the biggest risk.** Market prices across the whole site depend on it ([00-every-page.md](00-every-page.md), [home.md](home.md), [supply-panel.md](supply-panel.md)).
2. **"Last Updated" always shows today's date.** It is stamped when the page is requested, not when news or prices were last updated ([00-every-page.md](00-every-page.md)).
3. **Editing `mandates.ts` doesn't update the live site.** Country pages read database copies that only change when the seed endpoint is run. Gemini rewrites parts of them daily under a "compiled from government records" note ([countries-slug.md](countries-slug.md)).
4. **The two CI engines disagree.** `/ci-calculator` uses CA LCFS benchmarks 79.16 / 79.51, while `/ci-workspace` uses 75.16 / 80.17 (2026). The dairy 107% allocation fix exists only in the workspace engine ([ci-calculator.md](ci-calculator.md), [dairy-rng-calculator.md](dairy-rng-calculator.md)).
5. **`/ci-calculator` and `/dairy-rng-calculator` are read-only** for everyone except one hard-coded owner email ([ci-calculator.md](ci-calculator.md)).
6. **Supply charts are still mostly hand-written.** Only 7 of the 15 panels put parsed numbers into the main chart, and the "fresh / refresh due" label is never displayed ([supply-panel.md](supply-panel.md)).
7. **Claims on the site that the code doesn't back up:**
   - The home page says AI classifies updates, but it's keyword rules.
   - `/get-alerts` says the emails are "AI-written", but they aren't.
   - `/jobs` advertises a hiring news feed that isn't shown ([home.md](home.md), [get-alerts.md](get-alerts.md), [jobs.md](jobs.md)).
8. **Anyone can trigger paid or heavy jobs without a password:** `/api/public/scheduled-jobs` (news import + Gemini), the supply refresh functions, and video `refresh: true` ([get-alerts.md](get-alerts.md), [supply-panel.md](supply-panel.md), [videos.md](videos.md)).
9. **The Privacy Policy doesn't mention** that chats and uploaded documents are stored and sent to Google Gemini ([legal.md](legal.md)).
