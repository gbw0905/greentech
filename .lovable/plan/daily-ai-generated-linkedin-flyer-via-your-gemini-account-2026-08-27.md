# Daily AI-generated LinkedIn flyer via your Gemini account

Generate a branded, AI-rendered image flyer each day using your own Google Gemini API key, then email it so you can post it on LinkedIn.

## What it does

- Every day at 13:00 UTC the app pulls the top 5 latest global bioenergy policy/market updates (same source list used by the existing LinkedIn draft).
- It builds a detailed visual prompt describing a professional square flyer: Global Bioenergy Watch masthead, date, five numbered headline cards, source/country tags, brand colors, and a footer link.
- It calls Google Gemini image generation directly with **your** API key (billed to your Google account, not the Lovable AI workspace).
- The finished PNG is uploaded to Supabase Storage and emailed to `asifurp09@gmail.com` with a preview and a download link.
- A manual "Generate flyer now" button is added to the existing LinkedIn settings page so you can test before the first scheduled run.

## What you need to provide

1. A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) — stored as the project secret `GEMINI_API_KEY`.
2. The recipient email stays `asifurp09@gmail.com` unless you want a different one (`LINKEDIN_DRAFT_EMAIL` overrides it).

## Technical implementation

- **New secret**: `GEMINI_API_KEY` (server-only).
- **New server module** `src/lib/gemini-flyer.server.ts`:
  - Reuses the existing `topItems()` query for the latest 5 updates.
  - Composes a long, brand-consistent image-generation prompt.
  - Calls `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=<GEMINI_API_KEY>` with `generationConfig.responseModalities: ["TEXT", "IMAGE"]`.
  - Extracts the base64 PNG from the response, uploads it to a Supabase Storage bucket `flyers`, and returns the public URL.
- **New public API route** `src/routes/api/public/daily-gemini-flyer.ts`:
  - Generates the image, records a `flyer_generations` row (idempotent per day), and emails the result.
- **New email template** `src/lib/email-templates/gemini-flyer.tsx`:
  - Branded email body showing the flyer image inline (using the Storage public URL), a download link, source headlines, and an AI-disclaimer.
  - Registered in `src/lib/email-templates/registry.ts`.
- **New database table** `flyer_generations`:
  - `id`, `day_key` (unique), `image_url`, `prompt`, `items_json`, `emailed_to`, `created_at`.
  - GRANTs to `service_role` only; RLS enabled with no public access.
- **LinkedIn settings page update** `src/routes/settings.linkedin.tsx`:
  - Adds a "Generate flyer now" card that calls a new `generateFlyerNowFn` server function behind the same admin-key gate.
- **Supabase cron schedule**: add a daily cron call to `https://globalbioenergywatch.org/api/public/daily-gemini-flyer` at 13:00 UTC, using the same `authenticateCronRequest` helper already in use.

## Error handling

- Missing `GEMINI_API_KEY` returns a clear 500 message and emails nothing.
- Google API errors (rate limit, invalid key, safety filter) are logged and surfaced in the settings page test result.
- If image generation succeeds but storage upload fails, the raw base64 is kept in the error log and no broken URL is emailed.

## Future extension (not in this plan)

Auto-posting the flyer image directly to the Global Bioenergy Watch LinkedIn company page can be added later using the LinkedIn image-upload + UGC post API once the custom app connection is active.
