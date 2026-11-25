# Watch Assistant — `/assistant` and `/assistant/$threadId`

> **In one line:** An AI chat that answers bioenergy policy and market questions, looking up the site's own mandates, policy updates and dataset list first.
> **Route files:** `src/routes/assistant.tsx`, `src/routes/assistant.$threadId.tsx` (chat engine: `src/routes/api/chat.ts`)
> **Sign-in / Pro:** Anyone can chat. Signing in is needed only to **save** conversations (the conversation list on the left). Pro is not needed.
> **AI model:** Google **Gemini `gemini-3.8-flash`** via the Vercel AI SDK Google provider, key `GEMINI_API_KEY` (model name is hard-coded in `handle-chat.server.ts`).

Signed-in users who open `/assistant` are sent straight to `/assistant/<id>` of their latest conversation (a new empty one is created if they have none).

## Sections (top to bottom, as the user sees them)

### 1. "Watch Assistant" (page heading)
**What the user sees:** Title and a one-line description.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Heading and subtitle | Fixed text | `AssistantWorkspace.tsx` | Hand-written | When code changes | ⚪ |

**Code:** `src/features/assistant/components/AssistantWorkspace.tsx`

### 2. Sign-in notice (signed-out visitors only)
**What the user sees:** A box asking them to sign in to "save your conversations across devices".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Notice | Fixed text + sign-in link | `SignInPrompt` | Hand-written | — | ⚪ |
| Signed-in check | Whether to show it | `/api/auth/session` (Supabase Auth) | Live | Every 30 s at most | 🟢 |

**Code:** `src/features/auth/components/SignInPrompt.tsx`, `src/features/auth/hooks/useAuthSession.ts`

### 3. Conversation list (signed-in only, left column)
**What the user sees:** Your past conversations by title, a "new conversation" button, and delete buttons.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Conversation titles | Up to 50, newest first. Title = first 70 characters of your first question | Supabase table `chat_threads` (only your own rows) | User input, saved to account | After each answer | 🟢 |
| Saved messages of the open conversation | Full past chat | Supabase table `chat_messages` | User input + AI, saved to account | When you open a conversation | 🟢 |

**Code:** `src/features/assistant/components/ThreadList.tsx`, `src/features/assistant/hooks/useAssistantThreads.ts`, `src/features/assistant/server-functions.ts`

### 4. Chat window
**What the user sees:** Empty state with 4 suggested questions; then your messages, the AI's streamed answers (with expandable "tool" boxes showing what data it looked up), a text box, and the note "AI-generated answers can be wrong…".

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Suggested questions | e.g. "What does Indonesia's biodiesel mandate require in 2026?" | `SUGGESTIONS` in `AssistantChat.tsx` | Hand-written | When code changes | ⚪ |
| AI answer text | Written answer with links to site pages | Google Gemini (`gemini-3.8-flash`), guided by a fixed instruction text (`SYSTEM_PROMPT`); last 30 messages are sent | AI | Each question | 🟡 |
| Tool: policy updates | Latest government/market updates it found | Supabase table `policy_updates` (filled by the policy ingest daily job) | Daily job | Daily | 🟢 |
| Tool: country mandates / mandate search | Mandates, targets, official sources | `MANDATES`, `GOVERNMENT_SITES` in `src/features/countries/mandates` | Hand-written | When code changes | ⚪ |
| Tool: supply datasets list | Names and links of Supply & producers pages | `SUPPLY_SEO` in `src/features/supply/seo` | Hand-written | When code changes | ⚪ |
| Background knowledge | General answers not from site data | Gemini's own training (the AI is told to say when it does this) | AI | — | 🟡 |
| Error "Too many questions…" | Rate-limit message | Server limit: 20 questions/min per signed-in user, 6/min for guests | — | — | 🟢 |

**Code:** `src/features/assistant/components/AssistantChat.tsx`, `src/features/assistant/server/handle-chat.server.ts`, `src/features/assistant/server/assistant.server.ts`, `src/infrastructure/ai/quota.server.ts`

## Problems spotted
- **All guests share one rate-limit bucket.** Every signed-out visitor counts against the same key (`chat:anon`, 6 per minute), so a few guests can lock out all other guests.
- **The rate limit lives in server memory.** On Vercel each server instance has its own counter and it resets on cold start, so it is a soft limit, not a real cap on Gemini spending.
- **Leftover, misleading model setting.** `ASSISTANT_MODEL = "openai/gpt-6-astra"` in `assistant.server.ts` is imported but never used; the real model is the hard-coded Gemini one. There is no `ASSISTANT_AI_PROVIDER` switch in the code.
- **Privacy policy gap.** `/privacy` does not mention that chat messages are stored or sent to Google's AI service (see `legal.md`).
- One answer may run up to 50 tool steps (`stepCountIs(50)`), which can make a single question costly.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (none at the moment; the old Yahoo Finance `query1` and YouTube scraping were removed) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
