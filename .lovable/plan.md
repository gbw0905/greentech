# Professional Redesign — Editorial Navy

Goal: make Global Bioenergy Watch read as a credible research desk (think an energy-institute publication or a financial terminal's public site), not a neon demo. Same features, new visual system and homepage hierarchy, applied across every page.

## Design system (locked)

- Palette: deep navy `#0A1730` base, `#12294F` panels, `#F4F6FA` paper, `#2E9BD6` signal blue. Muted slate text tiers, thin hairline borders, one restrained accent for data.
- Typography: Sora for headings (tight tracking, weights 600–800), Manrope for body and UI. Mono only for tickers, dates and metric labels.
- Surfaces: flat panels with 1px borders and soft, low-spread shadows. Remove neon glows, gradient ribbons, drop-shadow text, aurora animation and rainbow section pills.
- Motion: subtle only — 150–200ms fades and 2–4px lifts on hover. No pulsing or drifting backgrounds.
- Charts: single-hue blue scale with one contrast accent, gridlines at low opacity, clear axis labels retained.

## Homepage — magazine structure

```text
[ slim masthead: logo · nav · last scan · rescan ]
[ LEAD: headline + standfirst + 3 KPI stats | latest policy update ]
[ MARKETS strip: WTI · S&P 500 · Gold — compact ticker cards ]
[ MAP (wide) | side rail: policy-status legend + top movers ]
[ PRODUCTION: stations & volumes | oil majors | SAF airlines ]
[ ALERTS signup | LIVE AUDIENCE ]
[ AI disclaimer — quiet note, not a warning box ]
[ footer ]
```

- Replace numbered gradient section ribbons with editorial section headers: small uppercase kicker, large Sora title, thin rule.
- Hero becomes a lead story block instead of a glowing banner; drop the whitespace-nowrap hacks so it scales cleanly on mobile.
- Nav pills become a quiet horizontal section nav in the masthead.

## Subpages

Same system applied to `/countries/$slug`, `/timeline`, `/profiles`, `/videos` and the shared page shell: matching masthead, editorial headers, restyled cards and tables. Country profile gets a proper article-style header (flag, name, policy status chip, mandate summary) above its updates list.

## Technical notes

- Rewrite the token layer in `src/styles.css`: OKLCH values for the navy palette, new `--font-display`/`--font-body`, replace glow/aurora utilities with flat panel + hairline utilities. Load Sora + Manrope via `<link>` in `src/routes/__root.tsx`; update `theme_color` in the manifest.
- Update presentation only in: `src/routes/index.tsx`, `src/components/PageShell.tsx`, `UpdateCard.tsx`, `OilPricePanel.tsx`, `OilStocksPanel.tsx`, `BiofuelProductionPanel.tsx`, `SafAirlinesPanel.tsx`, `AlertSignup.tsx`, `TrafficPanel.tsx`, `WorldPolicyMap.tsx`, `CountryFocusPanel.tsx`, `VideoLibrary.tsx`, and the four route pages.
- No changes to data ingestion, server functions, database, email or MCP logic.
- Map keeps its policy-status color coding, retuned to the new palette (mandated = deep teal-green, framework = amber, target = blue, none = slate).
