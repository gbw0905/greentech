# Going paid: biggest blockers and a readiness plan

## Current state

- The site has email-based policy alerts and on-demand AI briefs, but **no payment provider, no paywall, and no paid-tier gating**.
- `alert_subscribers` already has a `plan` column (defaults to `free`) and `brief_sends` logs every send, so usage tracking is partly wired.
- Auth exists for CSV export and email summaries, but it is **not tied to subscription status**.
- Traffic is small: ~148 visitors and ~356 page views in the last 7 days.

## Biggest problems to solve before taking money

### 1. No payment infrastructure or feature gating
- Paddle/Stripe has not been enabled, and no checkout, customer portal, or webhook handler exists.
- There is no code that checks `plan` before allowing a feature.
- Need to decide: what exactly does a paid subscriber get that free users do not?

### 2. Legal and content-licensing risk is high
- The paid product would be **AI summaries of third-party news and policy documents**.
- Summarizing paywalled or copyrighted articles and charging for the summary can create licensing/"substantial similarity" risk.
- The site needs:
  - Terms of Service (including payment, refund, and cancellation terms)
  - Privacy Policy (emails, IP/visit tracking, AI processing)
  - A clear fair-use / transformative-use disclaimer
  - A process for DMCA/takedown requests
- Data sources such as EIA, IEA, Yahoo Finance, company filings, etc. may have their own commercial-use restrictions. `src/lib/datasets/provenance.ts` tracks sources but does not yet flag commercial licenses.

### 3. No clear paid product definition
- Possible paid tiers:
  - **Premium alerts**: instant briefs instead of daily/weekly digest
  - **Unlimited AI briefs**: free users get N briefs/month, paid users get unlimited
  - **CSV/data export**: currently requires sign-in but not payment
  - **Analyst summaries / chart summaries**: currently free to signed-in users
  - **Ad-free / early access / country deep-dives**
- Each tier changes the database schema, the UI, and the email-sending logic.

### 4. Usage metering and enforcement are missing
- `brief_sends` logs sends, but there is no per-user/per-month count, no cap logic, and no billing-grade audit trail.
- Rate limits are per email per hour, not per plan.

### 5. Cancellation, refunds, and customer support
- No self-service cancellation, no refund workflow, no dunning/retry logic.
- No support email/address or process for billing disputes.

### 6. Tax and compliance
- Selling subscriptions globally requires VAT/sales-tax handling, invoices, and proper tax codes.
- Lovable’s built-in Paddle or Stripe integration can handle this, but it must be configured and tested.

### 7. Audience size is not yet validated
- 148 visitors/week is a thin funnel. Paid conversion at 2–5% would be 3–7 subscribers/week.
- Recommendation: grow the free list first, then gate a high-value feature.

## Proposed roadmap

### Phase 0 — Decide the paid tier (before any code)
1. Choose the single paid value proposition (recommendation: **unlimited instant AI briefs + analyst summaries**).
2. Define free limits: e.g., 3 on-demand briefs/month, daily digest free, instant/weekly requires paid.
3. Set price and billing interval (recommend starting with one plan: e.g., $9/month or $89/year).

### Phase 1 — Legal foundation
1. Add `/terms`, `/privacy`, and `/refund` pages with plain-language copy.
2. Flag commercial-use restrictions in `src/lib/datasets/provenance.ts` and add an AI-summary source-attribution notice.
3. Add a billing-specific footer/disclosure on the checkout page.

### Phase 2 — Payments and subscription plumbing
1. Enable Lovable Payments (Paddle recommended because it handles global tax and acts as merchant of record).
2. Create a "Premium" product + price in the dashboard.
3. Add webhook handlers to sync subscription status to `alert_subscribers.plan`.
4. Add server-side helpers to check `plan` before serving paid features.

### Phase 3 — Gate the features
1. Limit free on-demand briefs to N per rolling month; show upgrade prompt when exhausted.
2. Make instant/weekly cadence paid-only.
3. Keep CSV export and chart summaries as sign-in-only but add them to the premium tier (or keep them as a free sign-up perk).
4. Add a `/settings/billing` page with plan status, invoice link, and cancel/upgrade actions.

### Phase 4 — Operations and growth
1. Add monthly usage email and in-app meter.
2. Set up dunning emails for failed payments.
3. A/B test pricing and free-limit messaging.
4. Continue free list growth (SEO, LinkedIn, directories) before relying on paid revenue.

## Open questions

- What is the one paid feature you want to launch with?
- What monthly/yearly price feels right?
- Are you comfortable using Paddle (simpler global tax handling) or do you prefer Stripe?
- Do you have draft Terms of Service / Privacy Policy text, or should the site generate standard ones?
