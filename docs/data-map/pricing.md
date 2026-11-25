# CIVanta Pro pricing — `/pricing`

> **In one line:** Compares the Free and Pro plans for the CIVanta calculators and lets people request Pro access by email.
> **Route file:** `src/routes/pricing.tsx`
> **Sign-in / Pro:** Open to everyone. The Pro button changes depending on whether you are signed in and already Pro.

There is no payment system. Pro is granted by hand (see "Who counts as Pro" below).

## Sections (top to bottom, as the user sees them)

### 1. "Turn a useful result into a decision you can defend." (hero)
**What the user sees:** "← CIVanta suite" link, "CIVanta Pro" tag, headline and intro.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Hero text | Marketing copy | Route file | Hand-written | When code changes | ⚪ |

### 2. Plan cards — "Free" and "CIVanta Pro"
**What the user sees:** Free card ("$0 / forever", "Open CI Workspace", 5 features). Pro card ("Contact for Pricing", a button, 5 features).

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Prices and feature lists | "$0", "Contact for Pricing", bullet points | `freeFeatures`, `proFeatures` in the route file | Hand-written | When code changes | ⚪ |
| Pro button | "Sign in to get Pro" → `/auth`; "Request Pro access" → email to info@globalbioenergywatch.org; or "Your Pro access is active" → `/profile` | Your sign-in state + Pro check | Live | Pro check cached 5 min | 🟢 |

**Code:** `src/routes/pricing.tsx`, `src/features/premium/hooks/usePremium.ts`, `src/features/premium/server-functions.ts`

### 3. Trust row and footnote
**What the user sees:** "Clear access", "Download with Pro", "Know the basis", then a note that checkout is not yet connected.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Three blurbs and footnote | Fixed text | Route file | Hand-written | When code changes | ⚪ |

### Who counts as Pro (used here and on account pages)
| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Owner / editor email | Pro + can edit calculators | One email hard-coded in `server-functions.ts` | Hand-written | When code changes | ⚪ |
| Pro member emails | Pro | Two emails hard-coded in `PRO_MEMBER_EMAILS` | Hand-written | When code changes | ⚪ |
| Everyone else | Pro if `active` | Supabase table `premium_members` (matched by email) | Hand-written (rows added by an admin) | Live | 🟢 |

## Problems spotted
- **Pro access is partly hard-coded.** Three personal email addresses are written into `src/features/premium/server-functions.ts`. Adding or removing them needs a code change and deploy; the `premium_members` table is the cleaner place for this.
- No price or checkout exists; "Contact for Pricing" is just a mailto link.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
