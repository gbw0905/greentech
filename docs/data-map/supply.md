# Supply directory — `/supply`

> **In one line:** A grid of 15 cards. Each card opens one supply dataset (fuel stations, UCO, ethanol, and so on) at `/supply/<slug>`.
> **Route file:** `src/routes/supply.index.tsx`
> **Sign-in / Pro:** Not needed.

Everything you can see on this page is typed into code. No numbers on this page are fetched live. Each dataset page is described in `supply-panel.md`.

## Sections (top to bottom, as the user sees them)

### 1. "Global Biofuel Suppliers and Users" (heading)
**What the user sees:** The page title and one sentence about tracking companies across the bioenergy value chain.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title and intro sentence | "Global Biofuel Suppliers and Users" + description | `TITLE` / `DESCRIPTION` constants in the route file | Hand-written | When code changes | ⚪ |

**Code:** `src/routes/supply.index.tsx`

### 2. Dataset cards (15 cards)
**What the user sees:** One card for each dataset. Each card has a picture, a category badge (Supply / Production / Transport / Bioproducts / Power), a title, a one-line blurb and a headline count such as "69 producers tracked". Clicking a card opens `/supply/<slug>`.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Card picture | Illustration per dataset | Image files in `src/assets/supply-*.jpg` | Hand-written (bundled with the site) | When code changes | 🟢 |
| Category badge | "Supply", "Production", "Transport", "Bioproducts", "Power" | `CATEGORY` map in `SupplyDirectory.tsx` | Hand-written | When code changes | ⚪ |
| Title + blurb | e.g. "UCO suppliers — Used cooking oil collectors and traders…" | `SUPPLY_PANELS` list | Hand-written | When code changes | ⚪ |
| Headline count | e.g. "100+ networks tracked", "65 collectors & traders", "20 listed majors" | `stat` + `statLabel` in `SUPPLY_PANELS`. This is typed text, not counted from the data | Hand-written | Only when someone edits it | ⚪ |
| Card link | Goes to `/supply/stations`, `/supply/uco`, `/supply/ethanol`, `/supply/biopower`, `/supply/rng`, `/supply/biochar`, `/supply/pellets`, `/supply/terminals`, `/supply/marine`, `/supply/oil`, `/supply/saf`, `/supply/carriers`, `/supply/hydrogen`, `/supply/rlpg`, `/supply/methanol` | `id` in `SUPPLY_PANELS` | Hand-written | When code changes | ⚪ |

**Code:** `src/features/supply/components/SupplyDirectory.tsx`, `src/features/supply/components/SupplyProducersSection.tsx` (`SUPPLY_PANELS`)

### Behind the scenes (not shown on screen)
- The page loader also loads the policy news feed (`loadNavigationFeed`). Nothing from it is shown on this page. It only fills the shared cache. The feed is covered in `00-every-page.md` and `home.md`.

## Problems spotted
- **Some card counts are out of date.** The counts are typed by hand and nothing checks them against the data. The "Oil companies" card says **"20 listed majors"**, but the oil page loads **47** companies (`OIL_STOCKS` in `src/features/markets/oil-server-functions.ts`). The "Renewable hydrogen" card says **64**, but `RenewableHydrogenPanel.tsx` lists **66**. The other cards match the lists in their panel files today.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
