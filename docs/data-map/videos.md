# Videos — `/videos`

> **In one line:** A YouTube-style "briefing room": search recent bioenergy videos, filter by country and fuel, watch them on the site, and see your own watch history.
> **Route file:** `src/routes/videos.tsx`
> **Sign-in / Pro:** Not needed. Open to everyone.

The page has three views on the same URL: the **video grid** (default), the **watch view** (`/videos?watch=<id>`), and **Watch history** (`/videos?view=history`).

## Sections (top to bottom, as the user sees them)

### 1. Filter rail — "Country" and "Fuel type"
**What the user sees:** Two lists of checkboxes on the left. Ticking boxes changes which videos are searched for.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Country list | Country names ("Show all N countries") | Site's own country list `COUNTRIES` | Hand-written | When code changes | ⚪ |
| Fuel type list | Ethanol, Biodiesel, Renewable Diesel, Sustainable Aviation Fuel, Biogas, Feedstock | `FUEL_TYPES` in the same file | Hand-written | When code changes | ⚪ |
| Ticked boxes | Your choices | You | User input (kept only on screen, not saved) | — | 🟢 |

**Code:** `src/features/videos/components/VideoFilters.tsx`, `src/features/policy/taxonomy.ts`

### 2. "Latest bioenergy videos"
**What the user sees:** A heading, a line "Recent uploads for: …" listing the search phrases, a **History** button, and a grid of video cards (8 at a time, "Load more videos").

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| "Recent uploads for:" line | The search phrases used | Built in the browser: 5 default phrases (e.g. "bioenergy policy", "biofuel mandate") or one phrase per ticked fuel, each prefixed with each ticked country name | Hand-written phrase list + User input | Instantly when filters change | ⚪ |
| Video cards (title, channel, upload age, duration, thumbnail) | Newest YouTube videos for those phrases | **YouTube Data API v3** (`search` + `videos` endpoints, key `YOUTUBE_API_KEY`) | Live: server fetches, then saves a copy in Supabase table `video_cache` for **2 hours**; everyone gets the cached copy in that window | Browser re-asks every 5 min (cache usually answers) | 🟢 |
| Video cards — **if `YOUTUBE_API_KEY` is not set** | Same | **Scraped from the YouTube search web page** (`youtube.com/results`, reads hidden `ytInitialData`) | Live, same 2 h cache | Same | 🔴 |
| Thumbnails | Video preview images | YouTube image server `i.ytimg.com` | Live | — | 🟢 |
| "You're up to date · N videos" | Count of results | Computed from the list | — | — | 🟢 |

**Code:** `src/features/videos/components/LiveMediaFeed.tsx`, `src/features/videos/server-functions.ts` (`getLiveMediaFn`), `src/features/videos/server/search-videos.server.ts` (`fetchLiveMedia`)

### 3. Watch view (after clicking a video)
**What the user sees:** "All videos" / "History" buttons, the embedded YouTube player, the video title, channel, age · duration, an "Open on YouTube" link, and a "More to watch" column that keeps loading as you scroll.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Player | The video itself | Official YouTube embed (`youtube.com/embed/<id>`) | Live | — | 🟢 |
| Title / channel / age / duration | Video details | Copied from the card you clicked (or your history). If you open a shared `?watch=` link for a video not in the list, the title shows the placeholder "Bioenergy video" | — | — | 🟢 |
| "More to watch" — first items | The videos already in the grid | Same as section 2 | — | — | 🟢 |
| "More to watch" — extra items | More videos on the same search phrase, by relevance, 12 per page | YouTube Data API v3 `search` (with `YOUTUBE_API_KEY`) | Live, cached 2 h in `video_cache` | When you scroll | 🟢 |
| "More to watch" — **if no `YOUTUBE_API_KEY`** | Same | Scraped YouTube search page, then YouTube's **internal `youtubei/v1/search` endpoint** for further pages | Live, cached 2 h | When you scroll | 🔴 |

**Code:** `src/features/videos/components/VideoWatchView.tsx`, `src/features/videos/server/recommendations.server.ts` (`fetchRecommendationPage`)

### 4. "Watch history"
**What the user sees:** "Videos you opened on this browser", grouped as Today / Yesterday / date, with remove and "Clear history" buttons.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| History list | Up to 100 videos you opened | Your own browser (`localStorage` key `gbw.video-history.v1`) | User input (saved in this browser only, never sent to the server) | When you open/remove a video | 🟢 |

**Code:** `src/features/videos/components/VideoHistory.tsx`, `src/features/videos/hooks/useWatchHistory.ts`, `src/features/videos/watch-history.ts`

### Behind the scenes
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Page-view counter | Nothing visible | Anonymous visit record | Own tracking (`useVisitTracker`) | Each visit | 🟢 |

## Problems spotted
- **Scraping fallback is built in.** If `YOUTUBE_API_KEY` is missing on Vercel, both the grid and "More to watch" silently switch to scraping YouTube pages and the internal `youtubei` API (🔴). Whether the key is set in production is unclear from code — check Vercel env vars.
- **Anyone can skip the cache.** The server function accepts `refresh: true` from the browser and then re-calls YouTube. The site itself always sends `false`, but an outsider could use this to burn the YouTube API quota.
- **Wasted API calls when nothing is found.** With the API key, if the first search returns no videos the code runs the exact same API searches a second time (the "older videos" fallback only differs for the scraper).
- **Hand-written "official video hubs" list is not on this page.** `src/features/videos/video-library.ts` (IEA Bioenergy, IRENA, US DOE…) is only shown on country pages, not here. `VideoHero.tsx` is not used anywhere.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
