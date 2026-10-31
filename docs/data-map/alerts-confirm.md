# Confirm alerts — `/alerts/confirm`

> **In one line:** The page people land on after clicking the link in the sign-up email. It switches on their daily alert subscription.
> **Route file:** `src/routes/alerts.confirm.tsx`

## Sections (top to bottom, as the user sees them)

### 1. "You're subscribed" or "Link not valid" message
**What the user sees:** A single card with a heading, one sentence and a "Back to the desk" button.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Which message appears | Success or failure | The `?token=` in the link is checked against Supabase `alert_subscribers.confirm_token`. If it matches, `confirmed_at` is set to now and "You're subscribed" is shown | User input (the email link), checked on the server when the page loads | Once per visit | 🟢 |
| Message text | Fixed wording | Written in `alerts.confirm.tsx` | Hand-written | Never | ⚪ |

**Code:** `src/routes/alerts.confirm.tsx`, `src/features/alerts/server-functions.ts` (`confirmAlertSubscription`)

The page is marked `noindex`, so search engines skip it.

## Problems spotted
- **Confirmation links never expire or get used up.** The failure text says the link may be "expired or already used", but the code only looks up the token and sets `confirmed_at` again on every visit. The token is not cleared and has no time limit (`confirmAlertSubscription`). An old link keeps working and keeps resetting the confirmation date.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
