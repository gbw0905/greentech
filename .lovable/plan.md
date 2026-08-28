# Copy-ready LinkedIn DM template (daily)

Bulk-messaging your LinkedIn connections through an API is not possible — LinkedIn exposes no endpoint to list connections or send member-to-member messages, and automated DM tools breach the User Agreement. Instead, the site will generate a short, personalised message with the site link each day that you paste manually to whoever you choose.

## What you get

- A **"Message templates"** card on the existing LinkedIn settings page showing today's DM text.
- Each template is ~350–500 characters: greeting placeholder, one line on the day's biggest bioenergy development, one value line about the tracker, and the link `https://globalbioenergywatch.org`.
- Three tone variants generated per day: **Warm intro** (new contacts), **Industry peer** (analysts/policy folks), **Short nudge** (one-liner).
- A **name field**: type a contact's first name and every variant updates (`Hi Sarah,` …) so the copied text is already personalised.
- **Copy** button per variant, plus a **Regenerate** button if you want a different angle.
- Same daily email you already receive for the LinkedIn draft gains a "DM templates" section, so you can copy from your phone too.

## How it works

- Reuses the existing top-5 updates query from the daily draft pipeline (no new data source).
- One AI call composes all three variants from those verified headlines; no invented facts.
- Templates are cached once per UTC day so opening the page repeatedly is free; **Regenerate** forces a fresh call.

## Technical details

- New server module `src/lib/linkedin-dm.server.ts`: exports `getOrCreateDailyTemplates(force?)` — pulls the day's items via the existing `topItems()` logic, prompts the Lovable AI gateway, returns `{ dayKey, variants: [{ id, label, text }], items }`.
- New table `linkedin_dm_templates`: `id`, `day_key` (unique), `variants` (jsonb), `items` (jsonb), `created_at`. RLS enabled, `GRANT ALL … TO service_role` only; no `anon`/`authenticated` access — read exclusively through server functions.
- New `src/lib/linkedin-dm.functions.ts`: `getDmTemplatesFn` and `regenerateDmTemplatesFn`, both gated by the same admin-key check already used by `generateFlyerNowFn` on the settings page.
- `src/routes/settings.linkedin.tsx`: new card rendering the name input, variant cards, copy-to-clipboard buttons (`navigator.clipboard`), and a regenerate action with toast feedback.
- `src/lib/email-templates/linkedin-draft.tsx`: appended "DM templates" section; `createAndEmailDraft` in `src/lib/linkedin-draft.server.ts` passes the variants into `templateData`.
- Personalisation is client-side: the stored text uses a `{{name}}` placeholder, replaced on render and on copy (falls back to `Hi there,` when blank).

## Not included

No automated sending, no connection scraping, no browser automation — copying and sending stays a manual action by you.
