# Get alerts — `/get-alerts`

> **In one line:** A sign-up page for a free daily email digest of biofuel policy news, filtered by the countries and fuels the visitor picks.
> **Route file:** `src/routes/get-alerts.tsx`

## Sections (top to bottom, as the user sees them)

### 1. "Never miss a biofuel policy change again" heading
**What the user sees:** Title and a one-line pitch (now "…tagged by country and fuel type").

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Title + subtitle | Fixed marketing text | Written in `GetAlertsPage.tsx` | Hand-written | Never | ⚪ |

**Code:** `src/features/alerts/components/GetAlertsPage.tsx`

### 2. Four benefit cards ("Worldwide coverage", "Every fuel that matters", "One daily digest", "Official sources first")
**What the user sees:** Four short selling points.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Card text | Fixed claims | `BENEFITS` list in `GetAlertsPage.tsx` | Hand-written | Never | ⚪ |

**Code:** `GetAlertsPage.tsx`

### 3. "Prefer to explore first?" box
**What the user sees:** Links to the home dashboard and `/data-sources`. No data.

**Code:** `GetAlertsPage.tsx`

### 4. "Subscribe free — Daily bioenergy policy digest" form
**What the user sees:** "Country" and "Fuel type" multi-select dropdowns, chips for the choices, an email box and a "Subscribe" button. After submitting: "Check your inbox…", "You're already subscribed…", "This address previously unsubscribed or bounced…" or an error.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Country / fuel options | Countries with flags, fuel types with colours | `COUNTRIES`, `FUEL_TYPES`, `COUNTRY_FLAG`, `FUEL_ACCENT` in `src/features/policy/taxonomy.ts` | Hand-written | Never | ⚪ |
| Email + choices | Visitor's input | Saved to Supabase `alert_subscribers` (email, fuels, countries, cadence "daily"). Not active until the email link is clicked | User input | — | 🟢 |
| Confirmation email | "Confirm your subscription" email with a link to `/alerts/confirm?token=…` | Sent via Resend (`alert-confirm` template) | Live (when Subscribe is clicked) | — | 🟢 |
| Result message | Which message appears | Server reply: already confirmed / email blocked (unsubscribed or bounced) / sent | Live | — | 🟢 |

**Code:** `src/features/alerts/components/AlertSignup.tsx`, `src/features/alerts/server-functions.ts` (`subscribeToAlerts`), `src/infrastructure/email/send-email.ts`, `src/infrastructure/email/templates/alert-confirm.tsx`

### What subscribers then receive (not on this page)
The daily digest email is sent by a **Supabase scheduled job (pg_cron) at 08:00 UTC**. It calls `/api/public/policy-alert-digest`, not the Vercel cron. It takes `policy_updates` rows added in the last 24 h (max 60). For each confirmed subscriber it keeps items matching their fuels and countries (max 12) and emails them via Resend (`policy-alert` template). The items are the RSS headline and RSS summary. **No AI is used in the daily digest.** The email footer says the summaries are the publisher's own feed text. 🟡 for trade-press items, 🟢 for official ones

**Code:** `src/features/alerts/server/send-daily-digest.server.ts`, `src/routes/api/public/policy-alert-digest.ts`, `supabase/migrations/20260819154552_4947a64a-672f-4b66-b58e-730f7d656cf7.sql`

## Problems spotted
- **The AI claims were fixed.** The subtitle, the benefit card, the form text, the confirmation email and the digest email no longer say "AI-written" or "AI-classified". They say items are tagged by country and fuel type with a link to the source. That matches the code: country, fuel and category come from keyword rules (`policy-ingest.server.ts`, no Gemini), and the digest uses the RSS feed's own summary text. Only the separate on-demand "brief" email (`requestPolicyBrief` → Gemini) uses AI, and its button (`BriefRequestButton.tsx`) is not used on any page.
- **"Official sources first … scanned continuously" is closer to true now, but still strong.** The feeds in `sources.ts` are official bodies plus trade/association feeds (no Google News). The import runs from the daily job and a Supabase hourly job, not on page visits. Volume is lower than before, so digests may be thin.
- **Choosing countries drops items with no country tag.** If a subscriber picks any country, items without a detected country (for example global or EU-wide items the keyword rules missed) are never emailed to them (`send-daily-digest.server.ts`).
- The digest endpoint requires the cron bearer credential. The Supabase schedule reads it from Vault, and the daily email key still prevents repeat sends.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
