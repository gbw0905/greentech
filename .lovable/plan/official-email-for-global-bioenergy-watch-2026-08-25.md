# Official email for Global Bioenergy Watch

Set up `info@globalbioenergywatch.org` as the tracker's official, branded email address and expose it across the site.

## What this will do

1. **Branded sender address** — all outbound emails (news alerts, AI briefs, daily traffic digest, LinkedIn drafts) will be sent from `Global Bioenergy Watch <info@globalbioenergywatch.org>` instead of `noreply@globalbioenergywatch.org`. The verified sending domain remains `notify.globalbioenergywatch.org` behind the scenes, so deliverability is unchanged.
2. **Public contact point** — add a dedicated `/contact` page with a form that routes messages to `info@globalbioenergywatch.org`.
3. **Site-wide visibility** — display the official email in the footer and in the header contact shortcut so visitors can find it.
4. **Receiving inbox guidance** — provide a clear note about the external mailbox setup required (e.g., Google Workspace, Zoho Mail, or Microsoft 365) because Lovable's managed email service is outbound-only. The root domain DNS can host MX records for the `info@` mailbox without affecting the delegated `notify.` subdomain used for sending.

## Files to change

- `src/lib/email-templates/send-email.ts` — update `from` to `info@globalbioenergywatch.org` and set `replyTo` to the same address.
- `src/routes/contact.tsx` (new) — public contact page with form + server route to send the message to `info@globalbioenergywatch.org`.
- `src/routes/index.tsx` — add the official email to the footer and add a small "Contact" link in the header.
- `src/components/PageShell.tsx` — add the official email to the shared footer used by `/timeline`, `/profiles`, `/videos`, `/jobs`, and `/settings/linkedin`.

## Out of scope / user action

- Lovable does not provide inbound mailboxes. To actually receive email at `info@globalbioenergywatch.org`, you will need to set up a mailbox with an external email host and add its MX records at your domain registrar. The delegated `notify.globalbioenergywatch.org` NS records used for Lovable sending are on a separate subdomain and can stay in place.
