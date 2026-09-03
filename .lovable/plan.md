# Dark Green Theme for Headers & Sections

Move the site's header surfaces from the current dark navy/charcoal-teal to a dark green palette that fits the bioenergy identity. Content, data, and behavior stay untouched.

## What changes

**Color tokens (src/styles.css, light + dark blocks):**
- `--ink` → deep forest green (oklch hue ~150–155, similar lightness/chroma to today so contrast is preserved). This drives every dark section header panel (`ink-bar`) used by homepage sections and `PageHeading` on subpages.
- `--ink-foreground` / `--ink-muted` → warm off-white and soft sage-tinted muted text for legibility on the green.
- `--menubar-bg` / `--menubar-nav` → dark green tones (menubar currently charcoal-teal/petrol); keep the white bold text and rectangular pills as-is.
- `--accent` → a fresh leaf/emerald green so kickers, rules, and hover states inside the dark headers read green instead of blue.

**Explicitly kept unchanged:**
- Policy updates stay red, market updates stay blue (site-wide rule).
- Chart RGB color scale, entity logos, and axis labels untouched.
- Card surfaces, backgrounds, borders, shadows, and layout untouched.

## Scope

- Single token edit in `src/styles.css` (light and `:root`/dark variants) — every header, section bar, and the top menubar update at once because they all consume these tokens.
- No component, data, ingestion, alert, or chart-logic changes.

## Verification

- Screenshot homepage top (menubar + hero + a section header), one country profile header, and the About page header at desktop and 390px mobile to confirm the green reads well, text contrast holds, and nothing overflows.
