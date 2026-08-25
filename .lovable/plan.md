# Paid AI Summary Subscriptions — $2.99/month

Turn the existing free alert list into a two-tier product: a free taster, and a paid
$2.99/month plan that delivers AI-written bioenergy briefs by email, with the subscriber
choosing daily or weekly cadence plus a Sunday weekly deep-dive.

## What readers get

**Free tier (unchanged signup)**
- Occasional headline alerts, no AI briefs.

**Paid tier — $2.99/month**
- Choice of cadence: daily digest, weekly deep-dive, or both.
- Daily digest: AI-written 200–300 word briefs on the top 5 policy + market updates,
  filtered by the countries and fuel types they already pick in the signup form.
- Weekly deep-dive (Sunday): a longer AI synthesis of the whole week — what moved,
  by jurisdiction, what to watch next.
- Manage/cancel link in every email.

## Payment approach

You want your own payment system rather than Lovable's built-in integration. That means
the site talks to a payment processor account you own directly. Recommended: a direct
Stripe (or Paddle) account, connected through their API with your own keys, so all money,
invoices and customer records live in your account.

Practically the site will:
1. Create a checkout session when a reader picks the paid plan.
2. Send them to the processor's hosted payment page (so no card data ever touches this site).
3. Receive a signed webhook when payment succeeds, renews, fails, or is cancelled, and
   flip that subscriber's `plan` between `free` and `pro` automatically.

## What you need to provide

**Business / legal documents for the processor account**
- Legal business name and registered address (or your own name/address if you sell as an individual).
- Government-issued photo ID for identity verification.
- Tax identification number (EIN/SSN in the US, or the local equivalent).
- Bank account details for payouts (account + routing/IBAN).
- A business website URL — this site qualifies.
- Expected volume and a short description of what's being sold.

**Documents that must exist on the site before a processor approves a subscription product**
- Terms of Service.
- Privacy Policy (you already collect emails and traffic data, so this is needed regardless).
- Refund / cancellation policy.
- Contact page with a working support email.
- Clear pricing disclosure: "$2.99 per month, recurring, cancel anytime."

**Credentials I'll need from you afterwards**
- Publishable key, secret key, and webhook signing secret from the processor dashboard.
- The price/product ID for the $2.99 monthly plan created in their dashboard.

I'll request the secret values through the secure secrets form — never paste them in chat.

## Build steps

1. **Legal pages** — add `/terms`, `/privacy`, and `/refunds` routes in the site's editorial
   style, linked from the footer. These are prerequisites for processor approval.
2. **Pricing section** — a subscription card on the homepage and a `/subscribe` page showing
   free vs. $2.99 pro, with cadence selection (daily / weekly / both) and the existing
   country + fuel filters.
3. **Database** — extend `alert_subscribers` with subscription state (status, processor
   customer + subscription id, current period end) and add a `subscription_events` table for
   an auditable webhook log. Both stay admin-only with no direct client access, matching the
   existing tables.
4. **Checkout** — a server function that creates a hosted checkout session for the reader's
   email and returns the redirect URL.
5. **Webhook** — a public route at `/api/public/billing/webhook` that verifies the signature
   before doing anything, then activates, renews, or downgrades the subscriber.
6. **Email jobs** — a daily job and a Sunday weekly job that select each pro subscriber's
   matching updates, generate the AI brief, and send it. Both reuse the existing brief
   generator and email templates, and skip anyone not in `active` status.
7. **Self-service** — a `/account` page where a subscriber enters their email, gets a signed
   magic link, and can change cadence, change filters, or cancel.

## Technical notes

- New email templates `weekly-deepdive` and `daily-digest` in `src/lib/email-templates/`,
  registered in `registry.ts`, sent through the existing `sendTemplateEmail` helper.
- The weekly synthesis extends `src/lib/ai-brief.server.ts` with a multi-update prompt
  rather than the current single-update prompt.
- Scheduling reuses the existing pattern: a `pg_cron` job hitting a public route guarded by
  a shared secret header, same as the daily LinkedIn draft job.
- Webhook handler verifies the signature with `timingSafeEqual` before parsing the body, and
  is idempotent on the processor's event id so retries don't double-apply.
- Nothing paid is gated in the browser — plan checks live in the server-side email jobs.

## Order of work

Legal pages and pricing UI can be built now. Checkout, webhook, and the paid email jobs need
your processor keys, so those land once the account is approved and the secrets are stored.
