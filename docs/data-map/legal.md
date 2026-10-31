# Legal pages — `/privacy`, `/terms`

> **In one line:** The Privacy Policy and Terms of Use.
> **Route files:** `src/routes/privacy.tsx`, `src/routes/terms.tsx`
> **Sign-in / Pro:** Not needed.

Both pages are plain text typed into the code. Nothing is fetched.

## Sections (top to bottom, as the user sees them)

### 1. "Privacy Policy" (`/privacy`)
**What the user sees:** "Last updated: September 2026", then numbered sections (Information we collect, Cookies, Legal basis, Data sharing, Data security, …).

### 2. "Terms of Use" (`/terms`)
**What the user sees:** "Last updated: September 2026", then numbered sections.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| All text, incl. "Last updated" date | Legal text | The route files | Hand-written | Only when someone edits the file | ⚪ |

**Code:** `src/routes/privacy.tsx`, `src/routes/terms.tsx`

## Problems spotted
- **Privacy Policy doesn't cover the AI tools.** "Information we collect" and "Data sharing" do not mention that (a) Watch Assistant conversations are stored (`chat_threads`, `chat_messages`), (b) uploaded documents and their analyses are stored (`doc` bucket, `document_analyses`), or (c) chat messages and document text are sent to Google (Gemini) for processing. "Service providers" lists only hosting, authentication, analytics and email.
---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
