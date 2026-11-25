# CIVanta hub — `/civanta`

> **In one line:** The landing page for the CIVanta tools. It links to the CI Workspace, the Credit & RIN Calculator and the Optimizer.
> **Route file:** `src/routes/civanta.tsx`

## Sections (top to bottom, as the user sees them)

### 1. "CIVanta." heading and "Calculation history" link
**What the user sees:** The CIVanta title, a one-line tagline and a button to the user's saved calculations.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title and tagline | "Understand your footprint. Explore its value. Find a better pathway." | Text in the route file | Hand-written | Only when code changes | ⚪ |
| Calculation history link | Link to `/calculation-history` | Route file | Hand-written | Only when code changes | ⚪ |

**Code:** `src/routes/civanta.tsx`

### 2. Tool cards (CI Scenario Workspace · Credit and RIN Calculator · CIVanta Optimizer)
**What the user sees:** Three cards. Each has a title, a short description, a detail tag and an "Open …" button.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Card text | Titles, descriptions, button labels | `TOOLS` list in the route file | Hand-written | Only when code changes | ⚪ |
| Detail tags | "43 fuel pathways", "LCFS & RFS programmes", "Cost, CI & sensitivity" | `TOOLS` list in the route file | Hand-written | Only when code changes | ⚪ |

**Code:** `src/routes/civanta.tsx`

## Problems spotted
- The "43 fuel pathways" tag is typed by hand. It matches the engine today (43 pathways, including dairy RNG, in `public/tools/workspace-engine.mjs`). It will not update if pathways are added or removed.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
