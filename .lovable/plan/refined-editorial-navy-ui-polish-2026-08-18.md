# Refined Editorial Navy — UI polish

Keep every section, data source, and behaviour exactly as-is. This is a presentation-only refresh of the existing light navy theme: sharper hierarchy, calmer surfaces, more premium cards.

## What changes visually

**Masthead**
- Slimmer, sticky bar with a hairline bottom rule and subtle blur on scroll.
- Logo + wordmark locked left, nav pills right, live status dot inline.
- Nav pills get a quieter resting state and a clear active state (filled navy, white label) instead of full-colour chips.

**Hero**
- Tighter vertical rhythm: larger display headline, single-line kicker, and the stat row reduced to a thin metric strip with hairline dividers.
- Right column keeps the numbered Top 5 list, with tighter leading and a hover rule that reveals the accent bar.

**Cards and panels**
- One unified card style: white surface, 1px border, soft layered shadow, larger radius, and a subtle lift on hover.
- Consistent internal padding scale so market, chart, and update panels line up.
- Chart panels get a quiet header row (title left, legend/toggles right) on a tinted surface strip.

**Section headings**
- Replace the coloured ribbon blocks with an editorial treatment: small mono eyebrow label in the section colour, large display title, thin coloured rule underneath. Keeps the colour coding, loses the heaviness.

**Type and spacing**
- Display sizes stepped up; body text set to a comfortable measure.
- Consistent 8px spacing scale between sections; more breathing room around the map.

**Colour**
- Same navy/paper palette, slightly deepened primary and softened borders for better contrast.
- Accent used sparingly for interactive state only; section colours stay for identity.

## Technical notes

- Token edits in `src/styles.css`: refine `--border`, `--surface-*`, add shadow/elevation tokens, add a card utility.
- Shared section heading treatment applied where headings are currently rendered (homepage and sub-pages).
- Card style applied through the existing `Card` component variants so all panels update at once.
- Files touched: `src/styles.css`, `src/components/PageShell.tsx`, `src/routes/index.tsx`, `src/components/ui/card.tsx`, plus small class-level passes on the panel components.
- No changes to data fetching, ingestion, alerts, MCP, or chart logic.

## Verification

Screenshot the homepage and one country profile at desktop and mobile widths to confirm the layout holds.
