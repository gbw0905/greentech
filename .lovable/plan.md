# Dynamic UI layout options for Global Bioenergy Watch

Goal: make the whole site feel more alive and navigable without breaking the editorial green/navy theme or overwhelming the data.

## Option A — Horizontal swipeable "story" homepage

Turn the homepage into a swipeable horizontal story deck (mouse drag, touch swipe, and keyboard arrows).
- Each "story" slide maps to one existing section: Markets → Map → Supply → Jobs → Alerts → Method.
- A pinned bottom dot/tab bar lets users jump to any section.
- The current masthead nav stays, but clicking a section link smoothly scrolls the horizontal deck to that slide.
- On desktop it can optionally be a 2-column split: left fixed narrative, right scrollable content.
- Pros: dramatic, mobile-native feel, keeps each section focused.
- Cons: hides the full page at once, may hurt SEO scanability if not handled with proper semantic sections and URLs.

## Option B — Scroll-driven pinned storytelling

Keep vertical scrolling, but pin each major section while its content phases in/out.
- As the user scrolls, the Markets strip pins and charts animate in, then the Map pins and regions highlight, then Supply cards cascade in.
- Use Intersection Observer / scroll-progress triggers, not heavy scroll listeners.
- Each pinned section has a subtle progress indicator on the right edge.
- Pros: keeps the long-form page but makes scrolling feel like a guided tour.
- Cons: harder to make fully responsive at 390px; needs careful reduced-motion support.

## Option C — Bento command-center dashboard

Rearrange the homepage into a draggable/resizable bento grid of live widgets.
- Widgets: Latest updates ticker, WTI/Gold mini sparklines, Jurisdiction map thumbnail, top Supply dataset, Jobs badge, Traffic counter.
- Each widget is a card that can be expanded to full focus (like the Supply dataset pages already do).
- On mobile it becomes a single-column stack of widgets.
- Pros: information-dense, feels like a terminal, lets power users customize.
- Cons: more complex state management; drag/resizing may not be worth it for a content site.

## Option D — Live-data marquee + cascaded cards (lightweight)

Keep the current vertical page structure but add motion where data changes.
- A slim top marquee auto-scrolls live prices, latest policy headlines, and recent visitor count.
- Each section heading has a subtle "reveal" animation on scroll.
- The Supply cards keep their flip/tilt but add a "data updated" shimmer pulse when the feed refreshes.
- Chart panels fade/swap datasets with a shared layout animation when switching views.
- Pros: lowest risk, works with current architecture, reinforces "live desk" identity.
- Cons: less of a layout change, more of a motion upgrade.

## Recommendation

Start with **Option D as a foundation** (safe, keeps SEO and mobile intact), then layer **Option A's horizontal swipe only on mobile** so phone users get a story-like browse while desktop keeps the full vertical dashboard. Scroll-story pinned sections (Option B) can be added last if analytics show users are scrolling rather than clicking nav.

## Technical notes
- Use CSS scroll-snap for horizontal swipe, not a custom drag library, to stay lightweight.
- Keep every section in the DOM and accessible; animation must be decorative.
- Respect `prefers-reduced-motion`.
- No backend/data changes needed; all options use existing data and routes.
- Files likely touched: `src/routes/index.tsx`, `src/components/SupplyProducersSection.tsx`, `src/styles.css`, possibly a new `src/components/HorizontalStory.tsx`.
