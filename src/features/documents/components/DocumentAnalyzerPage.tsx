import {
  Clock,
  FileSearch,
  FileText,
  Link2,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { IntelligencePage } from "@/components/IntelligencePage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SignInPrompt } from "@/features/auth/components/SignInPrompt";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import type { DocumentAnalysis } from "@/features/documents/contracts";
import { supabase } from "@/integrations/supabase/client";

type HistoryEntry = {
  id: string;
  file_name: string;
  file_type: string;
  keywords: string[];
  created_at: string;
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function DocumentAnalyzerPage() {
  const { signedIn, loading: authLoading } = useAuthSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const keywords = [
    ...new Map(
      query
        .split(/[,;\n]+/)
        .map((keyword) => keyword.trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .map((keyword) => [keyword.toLocaleLowerCase(), keyword]),
    ).values(),
  ];

  const fetchHistory = useCallback(async () => {
    if (!signedIn) return;
    setHistoryLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch("/api/document-history", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setHistory(await response.json());
      }
    } catch {
      // silent — history is not critical
    } finally {
      setHistoryLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    if (signedIn && !authLoading) fetchHistory();
  }, [signedIn, authLoading, fetchHistory]);

  const loadHistoryItem = async (entry: HistoryEntry) => {
    setLoadingHistoryId(entry.id);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to view history.");
      const response = await fetch(`/api/document-history-item?id=${encodeURIComponent(entry.id)}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load analysis.");
      const result = (await response.json()) as DocumentAnalysis;
      setAnalysis(result);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setQuery(entry.keywords.join(", "));
      setHistoryOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load analysis.");
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    setDeletingId(id);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch(`/api/document-history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const chooseFile = (next: File | null) => {
    setAnalysis(null);
    setError("");
    if (
      next &&
      (!/\.(pdf|docx|xlsx|csv|txt|md)$/i.test(next.name) ||
        next.size > 15 * 1024 * 1024 ||
        next.size === 0)
    ) {
      setFile(null);
      setError("Choose a non-empty PDF, Word, XLSX, CSV or text file up to 15 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(next);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || keywords.length < 5) {
      setError("Choose a document and enter at least 5 distinct keywords or short phrases.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to analyze documents.");

      const form = new FormData();
      form.set("file", file);
      form.set("query", query.trim());
      const response = await fetch("/api/document-analyze", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
      });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as DocumentAnalysis & { error?: string })
        : ({
            error: `Document analysis failed on the server (${response.status}). Check the Vercel function logs for /api/document-analyze.`,
          } as DocumentAnalysis & { error?: string });
      if (!response.ok) throw new Error(payload.error || "Analysis failed.");
      setAnalysis(payload);
      // Refresh history after a new analysis
      fetchHistory();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <IntelligencePage
      icon={FileSearch}
      eyebrow="Products / Policy research"
      title="Policy document analyzer"
      subtitle="Add a document and at least five topics to get a briefing backed by its source passages."
      className="intelligence-analyzer"
    >
      <div className="analyzer-workspace">
        <div className="analyzer-left-column">
          <form onSubmit={submit} className="analyzer-input-card">
            {!authLoading && !signedIn ? (
              <SignInPrompt action="use the document analyzer" />
            ) : null}
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-primary" />
              <h2 className="font-display text-lg font-extrabold">1. Add a document</h2>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              aria-label="Upload a document"
              disabled={loading || authLoading || !signedIn}
              accept=".pdf,.docx,.xlsx,.csv,.txt,.md"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={loading || authLoading || !signedIn}
              data-dragging={dragging || undefined}
              data-selected={!!file || undefined}
              onDragOver={(event) => {
                event.preventDefault();
                if (!loading) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (!loading) chooseFile(event.dataTransfer.files[0] ?? null);
              }}
              onClick={() => inputRef.current?.click()}
              className="analyzer-dropzone"
            >
              <span className="analyzer-upload-icon">
                {file ? <CheckCircle2 size={30} /> : <Upload size={30} />}
              </span>
              <span className="mt-2 text-sm font-bold text-foreground">
                {file ? file.name : "Drop your document here"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace`
                  : "or click to browse · up to 15 MB"}
              </span>
            </button>

            <div className="analyzer-file-formats">
              <span>PDF</span>
              <span>Word</span>
              <span>XLSX</span>
              <span>CSV</span>
              <span>Text</span>
              {file && (
                <button
                  disabled={loading || authLoading || !signedIn}
                  type="button"
                  onClick={() => {
                    chooseFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Remove file <X size={13} />
                </button>
              )}
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Search className="size-4 text-primary" />
              <label htmlFor="analysis-query" className="font-display text-lg font-extrabold">
                2. Enter at least 5 keywords
              </label>
            </div>
            <Textarea
              id="analysis-query"
              disabled={loading || authLoading || !signedIn}
              aria-describedby="analysis-query-help"
              value={query}
              maxLength={1500}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-3 min-h-28 resize-y"
              placeholder="Example: sustainable aviation fuel, blending target, deadline, penalties, obligated parties, compliance"
            />
            <div
              id="analysis-query-help"
              className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground"
            >
              <span>Separate keywords or short phrases with commas. Use 5–25 relevant terms.</span>
              <span
                className={
                  keywords.length >= 5 && keywords.length <= 25
                    ? "font-bold text-primary"
                    : "font-bold text-destructive"
                }
              >
                {keywords.length}/25
              </span>
            </div>
            {keywords.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Recognized keywords">
                {keywords.slice(0, 25).map((keyword) => (
                  <span
                    key={keyword.toLocaleLowerCase()}
                    className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}
            <Button
              type="submit"
              disabled={
                authLoading ||
                !signedIn ||
                loading ||
                !file ||
                keywords.length < 5 ||
                keywords.length > 25
              }
              className="mt-5 w-full sm:w-auto"
            >
              {loading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <FileSearch className="size-4" />
              )}
              {loading ? "Extracting and analyzing…" : "Analyze document"}
            </Button>
            {analysis ? (
              <Button
                type="button"
                variant="outline"
                className="mt-5 w-full sm:w-auto"
                onClick={() => {
                  setAnalysis(null);
                  setFile(null);
                  setQuery("");
                  setError("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <Upload className="size-4" />
                Analyze another document
              </Button>
            ) : null}
            <p className="mt-4 flex items-start gap-2 text-xs/relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Files are processed for this request only. Analysis results are saved to your history.
            </p>
          </form>

          {/* History panel */}
          {signedIn && !authLoading ? (
            <div className="analyzer-history-card">
              <button
                type="button"
                className="analyzer-history-toggle"
                onClick={() => setHistoryOpen((prev) => !prev)}
                aria-expanded={historyOpen}
              >
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <span className="font-display text-sm font-extrabold">Analysis history</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {historyLoading
                    ? "Loading…"
                    : history.length
                      ? `${history.length} past ${history.length === 1 ? "analysis" : "analyses"}`
                      : "No history yet"}
                </span>
              </button>
              {historyOpen && (
                <div className="analyzer-history-list">
                  {history.length === 0 && !historyLoading ? (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      Your analyzed documents will appear here.
                    </p>
                  ) : null}
                  {historyLoading && history.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : null}
                  {history.map((entry) => (
                    <div key={entry.id} className="analyzer-history-item">
                      <button
                        type="button"
                        className="analyzer-history-item-main"
                        disabled={loadingHistoryId === entry.id}
                        onClick={() => loadHistoryItem(entry)}
                      >
                        <span className="flex items-center gap-2">
                          <FileText size={14} className="shrink-0 text-primary" />
                          <span className="truncate font-semibold">{entry.file_name}</span>
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            {entry.file_type}
                          </span>
                          <span>{entry.keywords.length} keywords</span>
                          <span className="ml-auto">{relativeTime(entry.created_at)}</span>
                        </span>
                        {loadingHistoryId === entry.id ? (
                          <span className="mt-1 flex items-center gap-1 text-xs text-primary">
                            <LoaderCircle size={12} className="animate-spin" /> Loading…
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className="analyzer-history-delete"
                        title="Delete this analysis"
                        disabled={deletingId === entry.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(entry.id);
                        }}
                      >
                        {deletingId === entry.id ? (
                          <LoaderCircle size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <section aria-live="polite" className="analyzer-result-card" aria-busy={loading}>
          <div className="analyzer-result-heading">
            <span>
              <FileSearch size={19} />
              <h2>Evidence-based result</h2>
            </span>
            <small>
              {analysis ? "Ready to review" : loading ? "Analyzing" : "Awaiting your source"}
            </small>
          </div>
          {!analysis && !loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center text-muted-foreground">
              <FileSearch className="size-10 opacity-40" />
              <p className="mt-3 max-w-sm text-sm/relaxed">
                Your briefing starts with your source. Add a document and five topics to see a
                focused answer, key points and supporting references.
              </p>
            </div>
          ) : null}
          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <LoaderCircle className="size-9 animate-spin text-primary" />
              <p className="mt-3 text-sm font-semibold">Finding relevant passages…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Large PDFs and spreadsheets may take longer.
              </p>
            </div>
          ) : null}
          {analysis ? (
            <div className="mt-4 space-y-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-2.5 py-1 font-bold">
                  {analysis.fileType}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {analysis.extractedCharacters.toLocaleString()} characters extracted
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {analysis.evidenceSections} sections reviewed
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 font-semibold capitalize">
                  {analysis.analysisMode} analysis
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary">
                  {analysis.usage.totalTokens.toLocaleString()} tokens used
                </span>
              </div>
              <details className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-semibold text-foreground">
                  Token details
                </summary>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Input: {analysis.usage.inputTokens.toLocaleString()}</span>
                  <span>Answer: {analysis.usage.outputTokens.toLocaleString()}</span>
                  <span>Thinking: {analysis.usage.thinkingTokens.toLocaleString()}</span>
                </div>
              </details>
              <div className="rounded-md border border-border p-3">
                <h3 className="label-mono text-foreground">Keyword coverage</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {analysis.keywordCoverage.supported.map((keyword) => (
                    <span
                      key={`supported-${keyword}`}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                    >
                      ✓ {keyword}
                    </span>
                  ))}
                  {analysis.keywordCoverage.unsupported.map((keyword) => (
                    <span
                      key={`unsupported-${keyword}`}
                      className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
                    >
                      Not found: {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className={`rounded-md border p-4 ${analysis.found ? "border-primary/25 bg-primary/5" : "border-amber-300 bg-amber-50"}`}
              >
                <p className="text-sm/relaxed text-foreground">{analysis.answer}</p>
              </div>
              {analysis.keyPoints.length ? (
                <div>
                  <h3 className="label-mono text-foreground">Key points</h3>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm/relaxed text-muted-foreground">
                    {analysis.keyPoints.map((point, index) => (
                      <li key={`${point}-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {analysis.connections.length ? (
                <div>
                  <h3 className="label-mono flex items-center gap-2 text-foreground">
                    <Link2 className="size-4" />
                    Keyword connections
                  </h3>
                  <div className="mt-2 space-y-3">
                    {analysis.connections.map((connection, index) => (
                      <div
                        key={`${connection.from}-${connection.to}-${index}`}
                        className="rounded-md border border-border bg-muted/40 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-primary">
                          <span>{connection.from}</span>
                          <Link2 className="size-3" />
                          <span>{connection.to}</span>
                        </div>
                        <p className="mt-1.5 text-sm/relaxed text-muted-foreground">
                          {connection.relationship}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {connection.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {analysis.citations.length ? (
                <div>
                  <h3 className="label-mono text-foreground">Supporting passages</h3>
                  <div className="mt-2 space-y-3">
                    {analysis.citations.map((citation, index) => (
                      <blockquote
                        key={`${citation.source}-${index}`}
                        className="border-l-2 border-primary bg-muted/50 px-4 py-3"
                      >
                        <cite className="text-xs font-bold not-italic text-primary">
                          {citation.source}
                        </cite>
                        <p className="mt-1 text-sm/relaxed text-muted-foreground">
                          "{citation.excerpt}"
                        </p>
                      </blockquote>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </IntelligencePage>
  );
}
