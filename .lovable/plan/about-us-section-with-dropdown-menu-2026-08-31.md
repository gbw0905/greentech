# About Us section with dropdown menu

## What we're building
Add an "About Us" entry to the top menu bar that opens a dropdown with three sub-pages:
- **About** (`/about`) — who we are and what Global Bioenergy Watch does
- **Mission & Vision** (`/about/mission-vision`) — mission statement and vision
- **Team** (`/about/team`) — founder card for Syed Asiful Alam, PhD with LinkedIn link

## Changes

1. **Top menu bar** (`src/components/PageShell.tsx` / homepage nav): add an "About Us" menu item with a dropdown (hover on desktop, tap on mobile) linking to the three sub-pages. Style it to match the existing black/bold rectangular navigation.

2. **`src/routes/about.tsx`** — overview page: what the tracker is, how it works (auto-ingested policy & market updates from trusted outlets, AI summaries), with links to Mission/Vision and Team.

3. **`src/routes/about.mission-vision.tsx`** — two clearly separated sections: Mission (what we do daily) and Vision (long-term goal: transparent global bioenergy policy intelligence for everyone).

4. **`src/routes/about.team.tsx`** — Team Members section with a founder card (Syed Asiful Alam, PhD — Founder & Editor, LinkedIn link to the existing profile URL used in the footer) and placeholder-friendly layout for future members.

5. **SEO**: each new page gets its own `head()` with unique title/description; new routes are included in the dynamic sitemap automatically.

6. **Design**: keep the current editorial style (white cards, dark headers, bold typography) consistent with the rest of the site.

## Technical notes
- Standard TanStack file routes; no database or auth changes needed.
- Dropdown uses a small accessible component (keyboard focus + aria-expanded), no new dependencies.
