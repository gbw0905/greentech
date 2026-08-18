# Full-width jurisdiction map + deeper, EU-inclusive coverage

## What's wrong today

- The jurisdiction section still uses a two-column grid (map + a side column that was removed), so the map renders in ~63% of the page width with dead space beside it.
- The archive currently holds only 51 stored updates spanning roughly 16 Jul – 17 Aug. Every news sweep is capped at `when:7d`/`when:14d`, so nothing older than about two weeks can ever enter the database, and there is no month-by-month history.
- The European Union has only 2 stored items. Two causes: there is no dedicated EU institutional source (only one Google News sweep for "RefuelEU"), and 36 of 51 rows have no country attached at all — EU items that say "Brussels", "RED III", "ReFuelEU", "Fit for 55" or name a member state are not being matched to the EU jurisdiction.

## Fixes

### 1. Map fills the section
Drop the leftover two-column wrapper so the map panel spans the full content width, and let the map's aspect ratio scale with the container (taller on wide screens, still readable on mobile). No behaviour change: clicking a country still opens its profile.

### 2. Track mandates, frameworks and market updates across all months
- Widen every sweep window from 7/14 days to a rolling long window, and add explicit month-by-month backfill sweeps so the archive builds out history instead of only "this fortnight".
- Keep the 180-day retention window, so the tracker settles at roughly six months of continuous mandate, framework and market history rather than two weeks.
- Add a one-time backfill pass triggered on the next ingest run that walks back month by month and stores what it finds.

### 3. Fix European Union coverage
- Add EU institutional feeds: European Commission energy/press releases, EU Official Journal search for renewable fuel acts, and the European Parliament news feed.
- Add EU policy sweeps: RED III, ReFuelEU Aviation, FuelEU Maritime, Fit for 55, EU biofuel blending obligation, EU Delegated Act on renewable fuels.
- Improve country matching so an item is attributed to the EU when it names EU instruments or institutions (RED II/III, ReFuelEU, FuelEU, Official Journal, Brussels, Fit for 55), and so a named member state maps to that country instead of falling through to "unattributed".
- Re-run attribution over rows already stored with no country, so the existing 36 unattributed items get placed on the map.

## Technical notes

- `src/routes/index.tsx` — remove the `xl:grid-cols-[1.7fr_1fr]` wrapper around the map panel.
- `src/components/WorldPolicyMap.tsx` — responsive height/viewBox so the projection uses the full width.
- `src/lib/policy-sources.ts` — widen windows, add EU institutional feeds and EU instrument sweeps, add dated monthly backfill sweeps.
- `src/lib/policy-taxonomy.ts` — extend EU aliases with instrument and institution names.
- `src/lib/policy-ingest.server.ts` — re-classify stored rows with `country_slug IS NULL` and update them in place during ingest.
