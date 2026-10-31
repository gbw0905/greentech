# Policy document analyzer — `/document-analyzer`

> **In one line:** Upload a document, type 5–25 keywords, and get an AI briefing that quotes the document's own passages.
> **Route file:** `src/routes/document-analyzer.tsx` (APIs: `src/routes/api/document-analyze.ts`, `document-history.ts`, `document-history-item.ts`)
> **Sign-in / Pro:** **Sign-in required** to analyze (the form is greyed out otherwise). Pro is not needed.
> **AI model:** Google **Gemini**, called directly at `generativelanguage.googleapis.com`. Model = env `GEMINI_TEXT_MODEL`, default `gemini-3.8-flash`. Key `GEMINI_API_KEY`.

## Sections (top to bottom, as the user sees them)

### 1. "Policy document analyzer" (heading)
**What the user sees:** Eyebrow "Products / Policy research", title and subtitle.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Heading text | Fixed text | `DocumentAnalyzerPage.tsx` | Hand-written | When code changes | ⚪ |

### 2. "Unlock your document's insights" (signed-out visitors only)
**What the user sees:** A sign-in box.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Sign-in check | Whether to show the box | `/api/auth/session` (Supabase Auth) | Live | — | 🟢 |

### 3. "1. Add a document" and "2. Enter at least 5 keywords"
**What the user sees:** A drag-and-drop file box (PDF, DOCX, XLSX, CSV, TXT, Markdown, max 15 MB), a keyword box with a counter "N/25" and keyword chips, and the **Analyze document** button.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| File and keywords | Your document and topics | You | User input | — | 🟢 |
| Text extraction | Text pulled out of the file (PDF, Word, Excel, plain text) on the server; scanned PDFs without text are rejected | Your file | User input | Each run | 🟢 |

**Code:** `src/features/documents/components/DocumentAnalyzerPage.tsx`, `src/features/documents/server/analyze-document.server.ts`

### 4. "Analysis history" (signed-in only)
**What the user sees:** A fold-out list of past analyses (file name, keywords, date) with open and delete buttons.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| History list | Up to 50 past analyses | Supabase table `document_analyses` (your rows only) | User input, saved to account | After each new analysis | 🟢 |
| Re-opened file | The original document | Supabase Storage private bucket `doc`, via a 1-hour signed link | User input, saved to account | When opened | 🟢 |

**Code:** `src/routes/api/document-history.ts`, `src/routes/api/document-history-item.ts`

### 5. Document viewer (left side, after analyzing)
**What the user sees:** Your document shown page by page, with a "New analysis" button; clicking a citation jumps to it.

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Document pages | Your file | Your browser copy, or the stored copy from history. PDF display uses pdf.js with its helper file loaded from cdnjs.cloudflare.com; Word files via mammoth | User input | — | 🟢 |

**Code:** `src/features/documents/components/DocumentViewer.tsx`

### 6. "Evidence-based result"
**What the user sees:** The answer, token count ("N tokens used", with Token details), **Keyword coverage**, **Key points**, **Keyword connections**, **Supporting passages** (quotes).

| Piece | Shows | Comes from | How it gets here | Refreshes | Status |
|---|---|---|---|---|---|
| Answer, key points, keyword connections | Short AI briefing (≤120 or ≤180 words) | Google Gemini, told to use ONLY the selected passages (up to 50,000 characters of the document) | AI | Each run | 🟡 |
| Supporting passages (citations) | Short quotes + section label | Gemini picks them; the server drops any whose section label doesn't exist in the document | AI | Each run | 🟡 |
| Keyword coverage | Which keywords were found / not found | Computed by the server by searching the text (not AI) | User input | Each run | 🟢 |
| Token counts | Input / answer / thinking tokens | Usage numbers returned by Gemini | AI | Each run | 🟢 |

**Code:** `src/features/documents/server/analyze-document.server.ts`, `src/features/documents/server/handle-document-analysis.server.ts`

## Problems spotted
- **Uploaded files are kept.** Every analyzed file is stored in the `doc` bucket and the result in `document_analyses` until the user deletes it. The `/privacy` page does not mention document storage or that document text is sent to Google's AI service (see `legal.md`).
- **The rate limit lives in server memory** (4 analyses/min per user, `quota.server.ts`). On Vercel it resets per instance/cold start, so it is a soft limit on Gemini spending.
- Citation quotes are only checked for a matching section label, not that the quoted words really appear in the document.

---
Status key: 🟢 our own data, official/open data, or licensed API · 🟡 allowed with care (RSS headlines, AI-written text, copyrighted report figures) · 🔴 not allowed / risky (Yahoo Finance `query1`, YouTube scraping) · ⚪ hand-written in code (needs manual updates)
"How it gets here" must be one of: **Live** (fetched when someone opens the page) · **Daily job** (`/api/public/scheduled-jobs`, 00:17 UTC) · **Parser** (supply ingestion) · **Hand-written** (hard-coded in a file) · **User input** (calculators/forms, saved to account or browser) · **AI** (Gemini) · **Own tracking** (Supabase traffic etc.)
