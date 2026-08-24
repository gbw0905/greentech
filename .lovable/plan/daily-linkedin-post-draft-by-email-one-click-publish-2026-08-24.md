# Daily LinkedIn Post — Draft by Email, One-Click Publish

Every day at **13:00 UTC (9am ET)** the site composes a LinkedIn-ready post from the latest bioenergy policy & market news, emails you the draft at your registered address, and only publishes to the **Global Bioenergy Watch company page** when you click **Approve & publish** in that email. Nothing ever posts without your click.

## How it works

```text
pg_cron (13:00 UTC daily)
   └─> /api/public/daily-linkedin-draft
         1. Pull top 5 updates from last 24–48h (fallback: freshest archive)
         2. AI composes LinkedIn post (hook + headlines + hashtags + site link)
         3. Save draft in linkedin_drafts table (one per day, status: pending)
         4. Email you the full draft text + "Publish to LinkedIn" button

You click "Publish to LinkedIn" in the email
   └─> /api/public/linkedin-publish?token=...
         1. Verify one-time token against the draft
         2. Post to the company page via the LinkedIn connector
         3. Mark draft published; show a confirmation page
```

## Steps

1. **Connect LinkedIn (you)** — a connect card will open; sign in with LinkedIn's own login (your password is never shared with the app or with me). We request the company-page posting permission (`w_organization_social`). You must be an admin of the company page in LinkedIn.
2. **Resolve the company page ID** — one gateway call lists the pages you administer; the Global Bioenergy Watch page ID is stored server-side for posting.
3. **Post composer** (`src/lib/linkedin-draft.server.ts`) — gathers the day's top 5 policy/market updates (same trusted-outlet feed as the tracker), then uses the built-in AI gateway (Gemini) to write a ~150–250 word professional post: opening hook, key headlines with country flags, hashtags, and a link to globalbioenergywatch.org. No invented facts — headlines come from the feed.
4. **Draft storage** — new `linkedin_drafts` table (day, post text, source headline URLs, status, one-time publish token). Service-role only; no public access.
5. **Draft email** — new branded template (matches your existing alert emails) with the full post text in a copy-ready block, the source headlines listed, and a green **Publish to LinkedIn** button.
6. **Publish endpoint** (`/api/public/linkedin-publish`) — validates the one-time token, posts via the LinkedIn connector gateway (`ugcPosts`, author = company page), records the LinkedIn post URL, and shows a simple "Published" confirmation page. Expired/used tokens are rejected.
7. **Daily schedule** — migration adds a `daily-linkedin-draft` pg_cron job at `0 13 * * *` calling the draft endpoint (same pattern as your existing daily email jobs).

## Notes & limits

- If LinkedIn does not grant the company-page scope during connect, the connect card will say so — fallback is posting to your personal profile or keeping it draft-only (copy-paste from the email).
- If a day has no fresh news, the draft falls back to the freshest archive items (same behavior as your daily flyer).
- One draft per day; clicking publish twice is safe (second click reports "already published").

## Technical details

- LinkedIn calls go through the connector gateway from server code only (`LOVABLE_API_KEY` + `LINKEDIN_API_KEY`, never in the browser).
- Publish token: 128-bit random, stored hashed in `linkedin_drafts`, single-use, tied to that day's draft.
- Draft endpoint is idempotent per day (re-running it updates the pending draft, never double-emails).
- Migration grants: no `anon`/`authenticated` access to `linkedin_drafts`; `service_role` only.
