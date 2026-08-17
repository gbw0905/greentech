# Reader briefing service: AI policy summaries by email

Turn the site into a news outlet: any reader can request an AI-written brief on a specific policy or market update and receive it in their inbox in a consistent house format.

## What readers get

Every update card and country-profile item gets a "Email me the brief" action. The reader enters (or reuses) their email, and receives:

- Subject: the headline of the policy/market update
- Body, in one fixed house format:
  - Headline
  - Jurisdiction, fuel tags, source outlet and publication date
  - **AI Brief** — a 200-300 word summary of what changed and why it matters
  - "View original" link to the source
  - AI-accuracy disclaimer and unsubscribe link

Unconfirmed addresses get a confirmation email first (existing double opt-in), then the brief.

## Cadence choice

The alerts signup gains a cadence selector: Instant, Daily digest, or Weekly digest. Instant subscribers get each matching update as its own AI brief soon after ingestion; daily and weekly subscribers get one AI-summarised roundup on their schedule. Existing subscribers default to daily.

## Paid tier readiness

No billing now. Subscribers get a `plan` field (`free` today) and every brief send is logged with subscriber, update, tokens and timestamp — so usage caps and a paid tier can be switched on later without a data migration.

## Technical notes

- Migration: add `cadence` (enum-ish text: instant/daily/weekly, default daily), `plan` (default free), `last_weekly_sent_at` to `alert_subscribers`; new `brief_sends` table (subscriber_id, update_id, sent_at, cadence, unique on subscriber+update) with GRANTs and RLS locked to service_role.
- New `src/lib/ai-brief.server.ts`: calls the Lovable AI Gateway (google/gemini-3-flash, streamed, consumed server-side) with the update title, summary, source and country, returning a strict 200-300 word brief. Caches the generated brief on `policy_updates.ai_brief` so the same update is only summarised once.
- New server fn `requestPolicyBrief` in `src/lib/alerts.functions.ts`: validates email + update id, upserts the subscriber, generates/reuses the brief, sends it, records `brief_sends`. Rate-limited per email per hour.
- New email template `policy-brief` in `src/lib/email-templates/` following the house format above; registered in `registry.ts`.
- New `src/components/BriefRequestButton.tsx` mounted in `UpdateCard.tsx` — inline email input, pending/sent/suppressed states.
- Digest endpoint `src/routes/api/public/policy-alert-digest.ts` extended to honour cadence, use AI briefs in the digest items, and skip already-sent updates via `brief_sends`.
- Instant sends run from the existing ingestion path after new rows land.
