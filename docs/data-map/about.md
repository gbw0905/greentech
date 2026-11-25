# About pages — `/about`, `/about/mission-vision`, `/about/team`, `/contact`

> **In one line:** Who runs Global Bioenergy Watch, what it does, and who is on the team.
> **Route files:** `src/routes/about.tsx` (wrapper only), `about.index.tsx`, `about.mission-vision.tsx`, `about.team.tsx`, `contact.tsx`
> **Sign-in / Pro:** Not needed.

All text and photos on these pages are typed into the code or stored as image files. Nothing is fetched live.

---

## `/about` — "About Global Bioenergy Watch"

### 1. "What we do" and "How the desk works"
**What the user sees:** Two cards: a description of the site, and numbered method steps.

### 2. "Built for people who follow the sector"
**What the user sees:** Audience list (analysts, researchers, investors, policymakers, journalists) with icons.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| All text | Description, method, audience | `about.index.tsx` | Hand-written | When code changes | ⚪ |

**Code:** `src/routes/about.index.tsx`, `src/components/InformationPage.tsx`

---

## `/about/mission-vision`

### 1. "Our mission" / "Our vision"
### 2. "What guides our coverage"
**What the user sees:** Mission and vision cards, then principles: Sources first, Policy and markets together, Global by default, Honest about AI.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| All text | Mission, vision, principles | `about.mission-vision.tsx` | Hand-written | When code changes | ⚪ |

**Code:** `src/routes/about.mission-vision.tsx`

---

## `/about/team` — "Team members"

### 1. Founder and contributor
### 2. Development and design team
**What the user sees:** Photo cards with name, role and LinkedIn link.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Names, roles, LinkedIn links | 2 leaders, 3 developers/designers | `LEADERSHIP`, `DEVELOPMENT_TEAM` in `about.team.tsx` | Hand-written | When code changes | ⚪ |
| Photos | Portraits | Image files in `public/team/` (code comment: local copies of LinkedIn profile photos) | Hand-written | When files change | ⚪ |

**Code:** `src/routes/about.team.tsx`

---

## `/contact`
No page. Old link that immediately redirects to the contact column in the site footer (`/#footer-contact`, in `src/components/IntelligenceFooter.tsx`).

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
