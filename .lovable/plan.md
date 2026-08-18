# Fix Top 5 latest updates spacing and density

## Problem
The "Top 5 latest updates" cards feel too tall and spaced out, making the hero section look unbalanced and the list hard to scan quickly.

## Goal
Tighten the density of the Top 5 list so it looks like a compact news digest that fits cleanly beside the hero on desktop and stacks neatly on mobile.

## Changes
1. **Compact the UpdateCard variant for the Top 5 list**
   - Add an optional `compact` prop to `UpdateCard.tsx`.
   - When compact: reduce padding (`p-3 pl-4`), shrink title to `text-base`, summary to `line-clamp-2`, fuel tags to smaller pills, and tighten internal gaps.
   - Keep the left region border and category badge.

2. **Tighten the list container**
   - In `src/routes/index.tsx`, change the Top 5 wrapper gap from `space-y-3` to `space-y-2`.
   - Add a subtle numbered index (1–5) to each card for scanability.

3. **Balance the hero two-column layout**
   - Reduce the right-column vertical footprint so it no longer overwhelms the left headline.
   - On desktop keep the two-column split; on tablet/mobile stack with the list below the hero stats.

4. **Verify responsive behavior**
   - Screenshot desktop (1280 px) and tablet/mobile (862 px) after the change.
   - Confirm no overflow, no clipped text, and the section no longer looks too tall.

## Files to edit
- `src/components/UpdateCard.tsx`
- `src/routes/index.tsx`

## Out of scope
- No content changes (still top 5 updates).
- No new sections or data sources.
