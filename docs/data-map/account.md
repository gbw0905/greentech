# Account pages — `/auth`, `/profile`, `/profiles`, `/my-results`, `/calculation-history`

> **In one line:** Sign-in, your profile, and the calculations you saved from the CIVanta calculators.
> **Route files:** `src/routes/auth.tsx`, `profile.tsx`, `profiles.tsx`, `my-results.tsx`, `calculation-history.tsx`
> **Sign-in / Pro:** `/auth` is public. The others show a "Sign in" message to signed-out visitors. `/my-results` also needs **Pro**.

All account data lives in **Supabase** (Auth for logins, table `ci_runs` for saved calculations).

---

## `/auth` — "Sign in" / "Create your account"

### 1. Sign-in card
**What the user sees:** "Continue with Google", a Microsoft button, and an email + password form (switches to sign-up with `?mode=signup`).

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Google / Microsoft sign-in | Provider login | Supabase Auth OAuth (`google`, `azure`), returns via `/api/auth/callback` | Live | — | 🟢 |
| Email + password | Login / sign-up | Supabase Auth via `/api/auth/sign-in`, `/api/auth/sign-up` | User input | — | 🟢 |
| Error text | e.g. failed callback | `?error=` in the URL or Supabase reply | Live | — | 🟢 |

**Code:** `src/features/auth/components/AuthPage.tsx`, `src/routes/api/auth/*.ts`

---

## `/profile` — "My Profile"

### 1. Account tabs
**What the user sees:** Tabs: Profile, My results, Calculation history, plus a link to CIVanta tools.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Tabs | Fixed links | `AccountLayout.tsx` | Hand-written | — | ⚪ |

### 2. Account details card
**What the user sees:** Avatar, name, email, a "Premium member" / "Member" badge, and "Member since".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Name, email, avatar, member since | Your account info | Supabase Auth user (from Google/Microsoft profile or email); name falls back to the part of the email before "@" | Live (`/api/auth/session`) | Every 30 s at most | 🟢 |
| Badge | Premium or Member | Pro check (hard-coded emails + `premium_members` table — see `pricing.md`) | Live | Cached 5 min | 🟢 |

### 3. "Your CIVanta access"
**What the user sees:** A sentence and a button: "View saved results" (Pro) or "Go for Pro plan".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Text and button | Depends on Pro | Pro check | Live | Cached 5 min | 🟢 |

### 4. "Your previous calculations" (preview, 5 newest)
Same data as `/calculation-history` below.

**Code:** `src/routes/profile.tsx`, `src/features/account/AccountLayout.tsx`, `src/features/premium/hooks/usePremium.ts`, `src/features/calculation-history/HistoryPanel.tsx`

---

## `/profiles`
No page. Old link that immediately redirects to the home page map (`/#map`).

---

## `/my-results` — "My carbon intensity results" (Pro)

### 1. Notices
**What the user sees:** "Sign in to see your results", "Saved results are a premium feature" (non-Pro), or "No saved scenarios yet".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Notice text | Fixed text | Route file | Hand-written | — | ⚪ |

### 2. Summary stats
**What the user sees:** Saved scenarios, Lowest carbon intensity, Average across scenarios.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Three numbers | Count, min and average CI (gCO2e/MJ) | Calculated in the browser from your saved runs | User input | On load / after delete | 🟢 |

### 3. Scenario cards
**What the user sees:** Each saved scenario's name, carbon intensity, and a table: Programme, Benchmark, My CI, Saving, Status ("Below/Above benchmark"), with a delete button.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Scenario name, CI | Your result (up to 100; runs saved from the CIVanta tools — pathway `civanta/...` — are left out) | Supabase table `ci_runs` (your rows) | User input (saved from the calculator) | On load | 🟢 |
| Programme benchmarks | e.g. California LCFS, Oregon CFP, EU RED III targets | Copied into the saved run at the time you saved it (from the calculator's built-in benchmark list) | Hand-written (snapshot) | Not updated after saving | ⚪ |
| Saving % / status | Your CI vs benchmark | Calculated in the browser | — | — | 🟢 |

**Code:** `src/routes/my-results.tsx`, `src/features/calculators/server-functions.ts` (`listCiRunsFn`, `deleteCiRunFn`)

---

## `/calculation-history` — "Calculation history"

### 1. "Your previous calculations"
**What the user sees:** A list of saved runs, each tagged CI Workspace / Optimizer / Credit & RIN, with name, pathway, date/time, the headline number (CI in gCO₂e/MJ, or RINs + LCFS tonnes) and "Open run". "Load more" at the bottom.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Saved runs | Your calculator results | Supabase table `ci_runs` (your rows) | User input, saved to account | On load | 🟢 |
| Empty / signed-out messages | "No saved scenarios yet." / "Keep your work with you." | `HistoryPanel.tsx` | Hand-written | — | ⚪ |

**Code:** `src/routes/calculation-history.tsx`, `src/features/calculation-history/HistoryPanel.tsx`, `src/features/calculation-history/server-functions.ts`

## Problems spotted
- **`/my-results` Pro check is only in the browser.** The server function `listCiRunsFn` only checks that you are signed in, not that you are Pro. A non-Pro user can only reach their own runs, so the risk is small, but the "premium feature" lock is not enforced on the server.
- Benchmarks shown on `/my-results` are frozen at save time; if regulators change a benchmark, old scenarios keep the old number.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
