# Supply dataset page — `/supply/$panel`

> **In one line:** One page for each of the 15 supply datasets. Each page shows a ranked chart of companies (heat map, trend line, map or table) with share prices, a company detail pop-out, and a table of facts pulled from official sources.
> **Route file:** `src/routes/supply.$panel.tsx` (it picks the panel with `SupplyPanelBody` in `src/features/supply/components/SupplyProducersSection.tsx`)
> **Sign-in / Pro:** Not needed to view. Signing in is needed only for "Email summary".

## Read this first: three kinds of numbers on these pages

1. **Hand-written (⚪).** Each panel file has a long list of companies with numbers typed in, such as capacity, plants and volume. These lists are the main chart on **every** panel. The code calls this list "curated fallback data".
2. **Parser (🟢/🟡).** Some datasets have a parser: a program that downloads an official file (EIA spreadsheet, EPA CSV, IMO PDF…) and reads real numbers from it. The numbers are saved in Supabase (`supply_observations`; each run is logged in `supply_ingest_runs`). The page reads them back through `getSupplyDatasetFn` → `supply-data.server.ts`. A parsed number gets into the main chart **only if** the panel code looks for that exact metric name. Otherwise it appears only in the "Source-backed facts" box at the bottom.
3. **Page snapshot (🟢, no numbers).** Every other approved source link gets only a "page snapshot" (`source-page-snapshot.server.ts`). It opens the link, checks that the page loads, and saves the page title plus up to 1,400 characters of page text. **It reads no numbers.** On screen it shows up only as "Approved source reachable = 1" and "Source HTTP status = 200" rows in the "Source-backed facts" box.

The approved sources and which parser each one uses are set in `src/shared/data/provenance.ts` (the source list) and `src/features/supply/source-registry.ts` (which parser to use and how often). Parsers live in `src/features/supply/server/parsers/`.

**When parsers run:** the daily job `/api/public/scheduled-jobs` runs at 00:17 UTC. It calls `refreshStaleSupplyDatasets` and re-runs a dataset **only if it is stale**. "Stale" depends on the fastest source in the dataset (`freshness.server.ts`): "monthly" means every 7 days, "quarterly" every 14 days and "annual" every 30 days. When a dataset re-runs, **all** of its sources run again, snapshots included. In the browser, each panel reloads its Supabase data at most every 15 minutes.

---

## Sections common to every panel (top to bottom)

### 1. Page heading (hero)
**What the user sees:** The dataset name with one word highlighted (e.g. "*Ethanol* production") and a one-line description.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Heading + description | `title` and `blurb` of the panel | `SUPPLY_PANELS` in `SupplyProducersSection.tsx` | Hand-written | When code changes | ⚪ |
| Search-engine title/description (not visible) | SEO text | `src/features/supply/seo.ts` | Hand-written | When code changes | ⚪ |

### 2. Chart panel header and toolbar
**What the user sees:** The chart title (e.g. "Global ethanol production"), a blurb, sometimes a status label at top right, a search box, Country/other filter drop-downs, a **View** picker (Heat map / Trend line (2000–2026) / Location map / Data table), a **Measure** picker, plus **Export CSV** and **Email summary** buttons.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title, blurb, measure names | e.g. "Ethanol output (Ml/yr)" | Each panel file (`TITLE`, `METRICS`) | Hand-written | When code changes | ⚪ |
| Status label (only Ethanol, Biochar, Oil) | "N source-backed entities" / "Curated fallback data"; Oil shows "Company reports" | Counted from the Supabase rows; Oil's label is fixed text | Parser / Hand-written | On page load | 🟢 |
| Search + filter drop-downs | Narrows the list | Visitor typing; options built from the rows shown | User input (browser only, not saved) | Instantly | 🟢 |
| Export CSV | Downloads the rows on screen | Same data as the chart | User input | On click | follows the data |
| Email summary | An analyst-style write-up of the current view, emailed to you | Gemini (`chart-summary.server.ts`) writes it, then it is sent by email. Needs sign-in | AI | On click | 🟡 |

**Code:** `src/components/chart-kit.tsx` (`ChartPanel`, `PanelActions`), `src/features/chart-summary/`

### 3. The chart itself
**What the user sees:** By default the top 10 companies for the chosen measure (top 20 when filtered; all rows in Map/Table view).

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Company rows and their main numbers | Capacity, volume, plants, etc. | Hand-written list in the panel file, with parser rows mixed in where the panel supports it (see each panel below) | Hand-written + Parser | When code changes / when the daily job re-parses | ⚪ / 🟢 |
| Meta line under each name | Ticker and approximate market cap (e.g. "XOM · $450bn"), or "Private / state-owned" | `listingMeta()` in `src/features/markets/lib/listing.ts`. Ticker per company is typed in `entity-tickers.ts`, market cap comes from `market-caps.ts`. **Live share prices and 1-day changes were removed from all 15 panels** | Hand-written | Only when someone edits it | ⚪ |
| Measure "Market cap (approx.)" | USD billions | `MARKET_CAP_USD_BN` in `src/features/markets/market-caps.ts` | Hand-written | Only when someone edits it | ⚪ |
| Measure "GHG savings (reported)" | Mt CO₂e avoided. Only about 10 named companies have a figure; the rest show "Not reported" | `src/shared/ghg-savings.ts` | Hand-written | Only when someone edits it | ⚪ |
| Company logos | Brand logo in tiles | Logo.dev (`img.logo.dev`) via `entity-logos.ts`. If there is no Logo.dev key, falls back to Google's favicon service, then a plain building icon | Live (image link) | Each view | 🟢 (Google favicon fallback 🟡) |
| "Trend line (2000–2026)" view | Yearly line per country/region, or a sector total | `src/features/markets/history-series.ts`. A few published years are typed in and the years in between are **filled in by straight-line estimates**. Only 8 datasets have a series: stations, ethanol, SAF, bio-power, pellets, RNG, oil, marine. The other 7 show "No official body publishes a consistent yearly series…" | Hand-written | When code changes | ⚪ |
| "Location map" view | Bubbles per country | Country from the rows; world outline from `/world-110m.json` (bundled with the site) | Hand-written | When code changes | 🟢 |

### 4. Company detail pop-out (click any tile, bar, dot or row)
**What the user sees:** A side sheet with logo, country, note, key stats, ticker, market cap, an "Environmental compliance & certification" block, "Graph values for this entry" (rank, share, range), "Active filters when clicked", and a **"More news for <company>"** button.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Key stats, note | Same numbers as the chart row | Panel file (or parser row) | Hand-written / Parser | — | ⚪ / 🟢 |
| Ticker / market cap | as above | `entity-tickers.ts`, `market-caps.ts` | Hand-written | Only when someone edits it | ⚪ |
| Certification block | Schemes such as ISCC, RSB, SBP, or "No published certification found" | `src/features/markets/certifications.ts` | Hand-written | Only when someone edits it | ⚪ |
| Rank / share / range / standing | Worked out from what is on the chart | Calculated in the browser (`EntityDetailSheet.tsx`) | Calculated from the data shown | Instantly | follows the data |
| "More news for …" button | Opens a **Google News search in a new tab**. No headlines are shown on our page | `openEntityNews` in `src/features/markets/open-news.ts` | Link only | — | 🟢 |

Note: the Google News RSS headline fetcher (`fetchEntityNews` / `getEntityNewsFn`) was deleted. The button above is a plain link only.

**Code:** `src/features/markets/components/EntityDetailSheet.tsx`

### 5. Footnote, provenance line, "Data sources & references"
**What the user sees:** A grey footnote under the chart, then "Figures as reported for 2024 · last reviewed 2026-09-01 · Sources & method", then a fold-out list of source citations.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Footnote text | Where the numbers come from + market-cap disclaimer. In most panels it switches wording once parser rows exist | Panel file | Hand-written | When code changes | ⚪ |
| "Figures as reported for … · last reviewed …" | Reporting year and review date | `reportingYear`, `lastReviewed` in `provenance.ts` | Hand-written | Only when someone edits it | ⚪ |
| "Data sources & references" list | Org, title, year, link for each source (Yahoo Finance is no longer listed; `provenance.ts` has no market-quote source) | `provenance.ts` via `sourcesFor()` in `src/shared/data/data-sources.ts` | Hand-written | When code changes | ⚪ |

### 6. "Source-backed facts (N entities, M observations)" (fold-out box at the bottom)
**What the user sees:** A collapsed box. Opened, it is a table with columns Entity, Metric, Value, Year, Confidence, Source (web domain), Basis. It is hidden when there is no data in Supabase.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Parser rows | Real numbers read from official files (see each panel) | `supply_observations` + `supply_entities` tables, filled by parsers | Parser (Daily job, when stale) | Read on page load (browser keeps it 15 min) | 🟢 / 🟡 by source |
| Snapshot rows | "<Org> source snapshot — Approved source reachable: 1" and "Source HTTP status: 200" | `source-page-snapshot.server.ts` | Parser (snapshot only, no numbers) | Same | 🟢 |

**Code:** `src/features/supply/components/SupplySourceFacts.tsx`, `src/features/supply/server/supply-data.server.ts`

---

## `/supply/stations` — Fuel station networks
Chart: **"Top global fuel stations selling biofuels"** · file `BiofuelProductionPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 102 station networks, retail sites, volume sold, fuels | Main chart | `STATIONS` list in the panel file | Hand-written | When code changes | ⚪ |
| "Volume per site" | Volume ÷ sites | Calculated from the two hand-written numbers | Hand-written | — | ⚪ |
| UK total renewable fuel supplied | One "UK RTFO renewable transport fuel market" row (`renewableFuelVolumeMl`) | GOV.UK RTFO annual report (`rtfo-annual-report` parser) | Parser, re-run every 30 days | Daily job | 🟢 |
| ↳ in the chart? | **No.** The panel only looks for `biofuelVolumeMl` / `volumeMnL` / `biofuelVolumeSoldMl`, so the UK row appears only in "Source-backed facts" | | | | |
| Snapshot only | US EPA RIN page, Brazil ANP, European Commission RED page | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | Yes (US EIA, IEA, Fediol/EBB figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |
| Tickers | `STATION_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/uco` — UCO suppliers
Chart: **"Global UCO (used cooking oil) suppliers"** · file `UcoSuppliersPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 65 collectors/traders, "UCO collected (kt/yr)", "Collection countries" | Main chart | `SUPPLIERS` list | Hand-written | When code changes | ⚪ |
| UK UCO feedstock by origin country | "UK RTFO UCO feedstock from <country>" (`ucoFeedstockVolumeMl`) | GOV.UK RTFO annual report (`rtfo-annual-report`) | Parser, every 30 days | Daily job | 🟢 |
| ↳ in the chart? | **No.** The panel looks for `ucoCollectedKt` etc., so this appears only in "Source-backed facts" | | | | |
| Snapshot only | Darling Ingredients SEC filings, Greenergy 2024 annual report PDF, ISCC certificates, USDA FAS GAIN | `source-page-snapshot` | Parser (no numbers) | Daily job (every 14 days, because PDF sources count as "quarterly") | 🟢 |
| Trend line | None (message shown) | — | — | — | — |
| Tickers | `UCO_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/ethanol` — Ethanol production
Chart: **"Global ethanol production"** · file `EthanolProductionPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 69 producers, "Ethanol output (Ml/yr)", "Plants / distilleries", feedstock | Main chart | `PRODUCERS` list | Hand-written | When code changes | ⚪ |
| US producer capacity + plant count | Replaces or adds US producer rows in the chart (`capacityMl`, `plants`). Matched by exact company name | US EIA ethanol plant capacity spreadsheet (`ethanol-eia-capacity` parser) | Parser, every 14 days (dataset counts as "quarterly" because of its PDF snapshot sources) | Daily job | 🟢 |
| ↳ in the chart? | **Yes.** Status label reads "N source-backed entities" | | | | |
| Snapshot only | RFA Pocket Guide PDF, FTC ethanol report PDF, ePURE, UNICA/CONAB | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | Yes (EIA, RFA, UNICA, F.O. Licht figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |
| Tickers | `ETHANOL_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/biopower` — Biofuel power generators
Chart: **"Global electricity generators using biofuel"** · file `BioPowerGeneratorsPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 74 generators, "Biofuel capacity (MW)", "Biofuel generation (GWh/yr)" | Main chart | `GENERATORS` list | Hand-written | When code changes | ⚪ |
| Country-level bioenergy capacity + generation | "<Country> bioenergy power market" rows (`capacityMw`, `generationGwh`) | Ember yearly electricity global CSV (`release_generation_yearly_global.csv`; the old long-format file stopped updating and was replaced 16 Nov 2026), each country's latest year (`biopower-ember-yearly`) | Parser, every 7 days | Daily job | 🟢 |
| ↳ in the chart? | **No.** The chart stays 100% hand-written. Ember rows appear only in "Source-backed facts"; the footnote says so | | | | |
| Snapshot only | IRENA capacity statistics 2025, IEA Bioenergy country reports | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | Yes (IRENA, IEA figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |
| Tickers | `BIOPOWER_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/rng` — RNG producers
Chart: **"Global renewable natural gas (RNG) producers"** · file `RngProducersPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 59 producers, "RNG output (million MMBtu/yr)", "Production facilities" | Main chart | `PRODUCERS` list | Hand-written | When code changes | ⚪ |
| US RNG market total | One "U.S. RFS renewable natural gas market" row (`outputMmbtu`, worked out from EPA gallons × 77,000 Btu) | EPA RFS fuel-type CSV (`rng-epa-rfs-fuel-type`) | Parser, every 7 days | Daily job | 🟢 |
| ↳ in the chart? | **Yes.** It is added as one extra row next to the companies, with facilities shown as "not reported" | | | | |
| Snapshot only | EPA RIN page, RNG Coalition facilities page, European Biogas Association report | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | Yes (EIA, RNG Coalition, EBA figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |
| Tickers | `RNG_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/biochar` — Biochar producers
Chart: **"Global biochar producers"** · file `BiocharProducersPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 44 producers, "Biochar capacity (t/yr)", "Durable CO₂ removal (tCO₂e/yr)" | Main chart | `PRODUCERS` list | Hand-written | When code changes | ⚪ |
| Member directory listing | Each Biochar Europe member ("memberListed = 1") | biochareurope.eu/members page (`biochar-biochar-europe-members`) | Parser, every 7 days | Daily job | 🟡 (scraped association site) |
| Member capacity (only when the profile text states one) | `capacityT`, plus `co2RemovalT` **estimated as 2 × capacity** | Same page | Parser | Daily job | 🟡 |
| ↳ in the chart? | **Only rows with a stated capacity.** Status label reads "N source-backed capacity rows" or "N source-backed directory rows" | | | | |
| Snapshot only | International Biochar Initiative, European Biochar Certificate, Puro.earth registry | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | None | — | — | — | — |
| Tickers | `BIOCHAR_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/pellets` — Wood pellet producers
Chart: **"Global wood pellet producers"** · file `WoodPelletProducersPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 60 producers, "Pellet capacity (kt/yr)", "Pellet plants" | Main chart | `PRODUCERS` list | Hand-written | When code changes | ⚪ |
| WPAC producing members | One row per member ("producerListed = 1"), no capacity | pellet.org → WPAC members page (`wood-pellet-wpac-members`) | Parser, every 7 days | Daily job | 🟡 (scraped association site) |
| ↳ in the chart? | **No.** Shown only in "Source-backed facts" | | | | |
| Snapshot only | FAOSTAT forestry, Bioenergy Europe statistical report | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | Yes (FAO, Bioenergy Europe figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |
| Tickers | `PELLET_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/terminals` — Blending terminals & capacity
Chart: **"Global blending terminals and capacity"** · file `BlendingTerminalsPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 71 terminal operators, "Blending capacity (k m³/yr)", "Blending terminals" | Main chart | `TERMINALS` list | Hand-written | When code changes | ⚪ |
| US bulk-terminal storage tank size | 5 rows: "U.S. bulk terminals — fuel ethanol / motor gasoline / distillate / jet fuel / **total** storage" (`capacityKm3`, converted from barrels) | EIA Working & Net Available Shell Storage Capacity workbook, March 2024. That report is discontinued, so this is the final data | Parser, every 30 days | Daily job | 🟢 |
| ↳ in the chart? | **Yes.** All 5 rows are added to the operator chart | | | | |
| Snapshot only | US EPA fuels page, port authorities (Rotterdam facts page) | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | None | — | — | — | — |
| Tickers | `TERMINAL_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/marine` — Marine biofuels
Chart: **"Global marine biofuel suppliers and users"** · file `MarineBiofuelPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 68 suppliers/users, "Marine biofuel (kt/yr)", "Ports / vessels covered", "Typical blend level (%)" | Main chart | `ENTITIES` list | Hand-written | When code changes | ⚪ |
| Singapore bio-blended bunker sales | One "Singapore marine biofuel bunker market" row (`volumeKt`, year-to-date volume, reach) | MPA Singapore via the data.gov.sg API (`marine-mpa-bunker-sales`) | Parser, every 7 days | Daily job | 🟢 |
| ↳ in the chart? | **Yes.** Added as one "Port market" row; blend % is shown as not reported | | | | |
| Snapshot only | Port of Rotterdam, ISCC certificates, IMO DCS page | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | Yes (MPA, Rotterdam figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |
| Tickers | `MARINE_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/oil` — Oil companies
Chart: **"Top global oil companies"** · file `src/features/markets/components/OilStocksPanel.tsx` (lives in the markets feature, not in supply)

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Which companies appear (47) | Company names + tickers. **The rows now come from this hand-written list**, not from a live call | `OIL_COMPANIES` in `src/features/markets/oil-companies.ts` | Hand-written | When code changes | ⚪ |
| Metrics | "Annual capacity", "Market cap (approx.)", "GHG savings (reported)". No share price or 1-day change | See the rows below | Hand-written | When code changes | ⚪ |
| "Annual capacity (MMboe/yr)" | Output per company | `CAPACITY` map in the panel file | Hand-written | When code changes | ⚪ |
| Country, market cap | Country / USD bn | `COMPANY_COUNTRY`, `MARKETCAP_TICKER` in the panel → `market-caps.ts` | Hand-written | When code changes | ⚪ |
| Logos | Logo per ticker | Logo.dev via `entityLogo()` | Live (image link) | — | 🟢 |
| Parser | **None.** Only snapshots: SEC EDGAR search, OPEC statistical bulletin, IEA oil market report | `source-page-snapshot` | Parser (no numbers) | **Never by the daily job** (see Problems) | 🟢 |
| Trend line | Yes (EIA figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |

## `/supply/saf` — SAF airlines
Chart: **"Top airlines using SAF globally"** · file `SafAirlinesPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 52 airlines, "SAF uplift (Ml/yr)", "SAF share of fuel burn (%)" | Main chart | `AIRLINES` list | Hand-written | When code changes | ⚪ |
| Global SAF production + share of jet fuel | One "Global SAF production market" row (`globalSafProductionMl`, `globalSafSharePct`) | IATA SAF web page text (`saf-iata-production`) | Parser, every 14 days | Daily job | 🟡 (figures copied from IATA's page) |
| ↳ in the chart? | **No.** The panel looks for `safUpliftMl` etc., so this appears only in "Source-backed facts" | | | | |
| Snapshot only | United Airlines SAF page, Lufthansa factsheet PDF, Air France-KLM results PDF, ICAO CORSIA page | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | Yes (IEA, IATA figures typed in) | `history-series.ts` | Hand-written | — | ⚪ |
| Tickers | `AIRLINE_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/carriers` — Freight carriers
Three charts on one page · file `CarriersPanel.tsx`

**Sections in order:** (1) "Source-backed IMO fleet aggregate" box → (2) "Top global shipping carriers using biofuel" → (3) "Top global trucking carriers using biofuel" → (4) "Top global rail carriers using biofuel" → (5) "Source-backed facts".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| IMO fleet aggregate box (top) | "kt biofuel", "fleet share %", "Mt fuel, <year>" for the whole world shipping fleet (anonymous). Hidden until parsed | IMO Data Collection System annual PDF (`carriers-imo-dcs`). It also saves methanol, ethanol and LNG totals, which appear only in "Source-backed facts" | Parser, every 30 days | Daily job | 🟢 |
| Shipping / trucking / rail charts (76 carriers total), "Biofuel volume used (Ml/yr)", "Biofuel share of fuel burn (%)" | Main charts | `SHIPPING`, `TRUCKING`, `RAIL` lists | Hand-written | When code changes | ⚪ |
| ↳ parser in the charts? | **No.** A parsed number would replace a carrier only if its name matched exactly, and IMO data has no company names | | | | |
| Snapshot only | European Commission shipping-emissions page | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | None (message shown) | — | — | — | — |
| Tickers | `CARRIER_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/hydrogen` — Renewable hydrogen producers
Chart: **"Global renewable hydrogen producers"** · file `RenewableHydrogenPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 66 producers, "Renewable H₂ output (kt/yr)", "Electrolyser capacity (MW)" | Main chart | `PRODUCERS` list | Hand-written | When code changes | ⚪ |
| Project capacity + electrolyser MW, by company | `capacityKtY`, `electrolyserMw` per project | IEA Hydrogen Production & Infrastructure Projects workbook (`hydrogen-iea-projects`) | Parser, every 30 days | Daily job | 🟡 (IEA licence terms) |
| ↳ in the chart? | **Yes.** Rows with `capacityKtY` replace or add producers by company name | | | | |
| Snapshot only | IEA Hydrogen Tracker page | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | None | — | — | — | — |
| Tickers | `HYDROGEN_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/rlpg` — Renewable LPG suppliers
Chart: **"Global renewable LPG suppliers"** · file `RenewableLpgPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 48 producers/distributors, "Renewable LPG supplied (kt/yr)", "Production capacity (kt/yr)" | Main chart | `SUPPLIERS` list | Hand-written | When code changes | ⚪ |
| European outlook scenario figures | One "European renewable liquid gas outlook" row (`renewableLiquidGasPotentialKtY`) | Liquid Gas Europe renewables outlook (`renewable-lpg-lge-outlook`) | Parser, every 30 days | Daily job | 🟡 (report figures) |
| ↳ in the chart? | **No.** The panel looks for `supplyKtY` etc., so this appears only in "Source-backed facts" | | | | |
| Snapshot only | World Liquid Gas Association renewable page | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | None | — | — | — | — |
| Tickers | `RLPG_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

## `/supply/methanol` — Bio-methanol producers
Chart: **"Global bio-methanol producers"** · file `BioMethanolPanel.tsx`

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| 46 producers, "Methanol capacity (kt/yr)", "Fossil CO₂ displaced (kt/yr)" | Main chart | `PRODUCERS` list | Hand-written | When code changes | ⚪ |
| Renewable-methanol plant capacities | `capacityKtY` per named plant/producer | IRENA "Innovation Outlook: Renewable Methanol" PDF (2021), found through the Methanol Institute publications page (`bio-methanol-mi-irena-outlook`) | Parser, every 30 days | Daily job | 🟡 (report figures, 2021) |
| ↳ in the chart? | **Yes.** Rows replace or add producers by name; CO₂ displaced stays hand-written | | | | |
| Snapshot only | IRENA publication page | `source-page-snapshot` | Parser (no numbers) | Daily job | 🟢 |
| Trend line | None | — | — | — | — |
| Tickers | `METHANOL_TICKERS` | `entity-tickers.ts` | Hand-written | — | ⚪ |

---

## Problems spotted
- **The freshness line never shows.** Ethanol, Bio-power, Biochar, Marine, RNG and Pellets build a line like "EIA rows: reporting year 2024 · ingested 12 Oct 2026 · fresh · fallback rows reviewed …". They pass it as a `sourceMeta` prop, but `ChartPanel` in `src/components/chart-kit.tsx` does not accept or display that prop. Visitors never see when parsed data was last updated or whether it is "refresh due".
- **The Oil companies sources are never refreshed by the daily job.** All of its sources are snapshot-only "manual" pages. `supplyFreshness` treats "manual" as never stale, so `refreshStaleSupplyDatasets` always skips `oil-companies`.
- **The Oil page no longer uses Yahoo Finance.** Rows come from the hand-written `oil-companies.ts`. The trade-off: everything on it (capacity, market cap, GHG) only changes when someone edits code.
- **Share prices are gone from every supply panel.** The old feed was unlicensed. Charts and detail sheets show ticker and approximate market cap only, and the data-sources page and email summaries were reworded to match.
- **Snapshot parser no longer keeps page text.** `source-page-snapshot` stores the page title, size and a SHA-256 content hash (to spot changes), not a text excerpt of the publisher's page.
- **The Hydrogen footnote is wrong.** It says "chart capacities remain fallback data until a dedicated project-capacity parser is wired", but the `hydrogen-iea-projects` parser exists and its `capacityKtY` rows are merged into the chart.
- **The Terminals chart mixes two different kinds of number.** The EIA rows measure tank **storage size** (a one-time stock, March 2024, report discontinued). They are plotted on the same "Blending capacity (k m³/yr)" scale as the hand-written annual operator figures, and they include a "total" row that adds up the other four.
- **The snapshot rows clutter the facts box.** On every panel, "Source-backed facts" lists rows like "U.S. Securities and Exchange Commission source snapshot — Approved source reachable — 1 — boolean". These are website-uptime checks, not supply facts.
- **Some "source-backed" counts include snapshot rows.** On Biochar, "N source-backed directory rows" counts every Supabase row, including the 3 snapshot rows. On Bio-power and Pellets, the footnote switches to "Ember … rows are ingested" / "WPAC … listings are ingested" when **any** row exists, even if only snapshot rows are there.
- **Two refresh functions have no secret check.** `refreshSupplyDatasetFn` and `refreshStaleSupplyDatasetFn` in `src/features/supply/server-functions.ts` start ingestion runs without the ingest secret that the `/api/public/*` routes require (`ingest-auth.server.ts`). Nothing on the site calls them, but they are still server functions in a module the pages load.
- **Some card counts on `/supply` are out of date:** Oil says "20 listed majors" but 47 are loaded; Hydrogen says 64 but 66 are listed (see `supply.md`).

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
