# AI assistant chat for Global Bioenergy Watch

Add "Watch Assistant" — an AI chat helper that answers questions about the site's own data (policies, mandates, country profiles, producer datasets) and about bioenergy generally.

## What visitors get

- A floating chat launcher in the bottom-right corner of every page, styled in the site's editorial navy/green theme with the site logo mark as the agent identity (no generic sparkle icon).
- Clicking it opens a chat panel: past conversations list, "New chat" button, message transcript, and a prompt box.
- The assistant can look things up in the live site data and shows a small collapsed "looked up policy updates" / "looked up mandates" / "looked up producers" row inside its answer, which can be expanded to see what it searched and found. Answers link to the relevant country, mandate or dataset pages.
- Signed-out visitors can chat, but a short note explains that saved history needs sign-in; signing in keeps every conversation across devices.
- Standard AI caution line under the transcript, matching the existing summary disclosure.

## Conversations and history

- Multiple threads, each with its own page address (`/assistant/<id>`), so a conversation can be reloaded or shared as a link by its owner.
- Threads and messages are stored in the account system, private to the signed-in user.
- The floating panel shows the thread list and opens the full page for a wider view.

## Technical notes

- Two new tables: `chat_threads` (id, user_id, title, timestamps) and `chat_messages` (id uuid default, thread_id, role, parts jsonb, created_at). Both with GRANTs for `authenticated`/`service_role`, RLS enabled, and owner-only policies scoped to `auth.uid()`. No anon grants.
- Chat streaming route at `src/routes/api/chat.ts` using the AI SDK with the Lovable AI Gateway Responses API and `openai/gpt-6-astra`. `LOVABLE_API_KEY` read inside the handler; per-user throttling reuses `assertAiQuota` from `src/lib/ai-quota.server.ts`.
- Tools defined server-side over existing data helpers: `search_policy_updates`, `list_country_mandates`, `get_country_profile`, and `search_producers` (reusing the panel dataset modules and `src/lib/mandates.ts`). `stopWhen: stepCountIs(50)`.
- System prompt: senior bioenergy policy analyst; prefer site data and cite the page it came from; never invent figures, dates or legal obligations; say when a fact isn't in the site data.
- Persistence via `toUIMessageStreamResponse({ originalMessages, onFinish })`; insert errors surfaced, not swallowed. DB generates message UUIDs — AI SDK `msg_...` ids are not used as primary keys.
- UI built from AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`, `tool`) installed via the shadcn registry; new files `src/components/assistant/ChatDock.tsx`, `ThreadList.tsx`, plus routes `src/routes/assistant.tsx` and `src/routes/assistant.$threadId.tsx`, and the dock mounted once in `src/routes/__root.tsx`.
- Assistant messages render on the plain surface, user messages use the existing primary token pair. Assistant page gets its own title/description/OG tags; the dock is verified at 390px with no overflow and the nav still scrollable.

## Cost note

Each message uses AI credits from the workspace. The per-user rate limit keeps abuse bounded; gateway credit/rate errors are shown in the chat rather than failing silently.
