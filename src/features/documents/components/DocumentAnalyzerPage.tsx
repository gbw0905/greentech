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
  ArrowLeft,
  Eye,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { usePostHog } from "@posthog/react";
import { IntelligencePage } from "@/components/IntelligencePage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SignInPrompt } from "@/features/auth/components/SignInPrompt";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import type { DocumentAnalysis } from "@/features/documents/contracts";
import { DocumentViewer, type ActiveReference } from "./DocumentViewer";
import "./document-analyzer.css";

type HistoryEntry = {
  id: string;
  file_name: string;
  file_type: string;
  keywords: string[];
  created_at: string;
  file_path: string | null;
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

/** Parse "Page 3, section 2" → { page: 3 } */
function parseSourcePage(source: string): number {
  const m = source.match(/page\s+(\d+)/i);
  return m ? Number(m[1]) : 1;
}

export function DocumentAnalyzerPage() {
  const { signedIn, loading: authLoading } = useAuthSession();
  const posthog = usePostHog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);

  // Document viewer state
  const [viewerSource, setViewerSource] = useState<File | string | null>(null);
  const [viewerFileType, setViewerFileType] = useState("pdf");
  const [activeRef, setActiveRef] = useState<ActiveReference | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasViewer = !!viewerSource && !!analysis;

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
      const response = await fetch("/api/document-history", {
        credentials: "same-origin",
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
      const response = await fetch(
        `/api/document-history-item?id=${encodeURIComponent(entry.id)}`,
        {
          credentials: "same-origin",
        },
      );
      if (!response.ok) throw new Error("Failed to load analysis.");
      const result = (await response.json()) as DocumentAnalysis;
      setAnalysis(result);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setQuery(entry.keywords.join(", "));
      setHistoryOpen(false);
      setActiveRef(null);
      // Set up the viewer from the stored file URL
      if (result.fileUrl) {
        setViewerSource(result.fileUrl);
        setViewerFileType(entry.file_type.toLowerCase());
      } else {
        setViewerSource(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load analysis.");
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/document-history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
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
    setViewerSource(null);
    setActiveRef(null);
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
    setActiveRef(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("query", query.trim());
      const response = await fetch("/api/document-analyze", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as DocumentAnalysis & { error?: string })
        : ({
            error: `Document analysis failed on the server (${response.status}). Check the Vercel function logs for /api/document-analyze.`,
          } as DocumentAnalysis & { error?: string });
      if (!response.ok) throw new Error(payload.error || "Analysis failed.");
      // Keep the file object for the viewer
      const ext = file.name.toLowerCase().split(".").pop() ?? "pdf";
      posthog.capture("document_analysis_completed", {
        document_type: ext,
        keyword_count: keywords.length,
      });
      setAnalysis(payload);
      setViewerSource(file);
      setViewerFileType(ext);
      fetchHistory();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const resetAll = () => {
    setAnalysis(null);
    setFile(null);
    setQuery("");
    setError("");
    setViewerSource(null);
    setActiveRef(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCitationClick = (citation: { source: string; excerpt: string }) => {
    const page = parseSourcePage(citation.source);
    setActiveRef({ page, excerpt: citation.excerpt, source: citation.source });
  };

  return (
    <IntelligencePage
      icon={FileSearch}
      eyebrow="Products / Policy research"
      title="Policy document analyzer"
      subtitle="Add a document and at least five topics to get a briefing backed by its source passages."
      className="intelligence-analyzer"
    >
      {!authLoading && !signedIn ? (
        <div className="analyzer-access">
          <SignInPrompt
            action="analyze your documents"
            title="Unlock your document's insights"
            description="Sign in to create a focused briefing with key findings and source references."
          />
        </div>
      ) : null}
      <div className={`analyzer-workspace ${hasViewer ? "analyzer-workspace--viewer" : ""}`}>
        {/* ── Left column: viewer when active, otherwise the upload form ── */}
        <div className="analyzer-left-column">
          {hasViewer ? (
            <>
              <div className="analyzer-viewer-header">
                <button type="button" className="analyzer-back-btn" onClick={resetAll}>
                  <ArrowLeft size={15} />
                  New analysis
                </button>
                <span className="text-xs text-muted-foreground">
                  <Eye size={13} className="inline-block" /> Click a reference to jump to it ·
                  select text to explain it
                </span>
              </div>
              <DocumentViewer
                source={viewerSource}
                fileType={viewerFileType}
                activeReference={activeRef}
                explainContext={{
                  fileName: analysis.fileName,
                  keywords: analysis.keywordsUsed,
                  briefing: analysis.answer,
                }}
              />
            </>
          ) : (
            <>
              <form onSubmit={submit} className="analyzer-input-card">
                <div className="analyzer-step-heading">
                  <Upload className="size-4 text-primary" />
                  <h2 className="font-display text-lg font-extrabold">1. Add a document</h2>
                  {file && (
                    <span className="analyzer-ready-label">
                      <CheckCircle2 size={14} /> Ready
                    </span>
                  )}
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
                    if (!loading && signedIn && !authLoading) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    if (!loading && signedIn && !authLoading)
                      chooseFile(event.dataTransfer.files[0] ?? null);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className="analyzer-dropzone"
                >
                  <span className="analyzer-upload-icon">
                    {file ? <CheckCircle2 size={30} /> : <Upload size={30} />}
                  </span>
                  <span className="analyzer-file-name" title={file?.name}>
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
                <div className="analyzer-step-heading analyzer-keywords-heading">
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
                  <span>
                    Separate keywords or short phrases with commas. Use 5–25 relevant terms.
                  </span>
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
                  className="analyzer-submit mt-5 w-full sm:w-auto"
                >
                  {loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <FileSearch className="size-4" />
                  )}
                  {loading ? "Extracting and analyzing…" : "Analyze document"}
                </Button>
                <p className="mt-4 flex items-start gap-2 text-xs/relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  Files are processed and stored securely. Analysis results and documents are saved
                  to your history.
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
                              {entry.file_path ? (
                                <Eye
                                  size={12}
                                  className="shrink-0 text-emerald-600"
                                  aria-label="Document preview available"
                                />
                              ) : null}
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
            </>
          )}
        </div>

        {/* ── Right column: analysis results ── */}
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
            <div className="analyzer-empty-state flex min-h-72 flex-col items-center justify-center text-center text-muted-foreground">
              <span className="analyzer-empty-icon">
                <FileSearch size={36} />
              </span>
              <h3>Your next insight starts here</h3>
              <p className="mt-3 max-w-sm text-sm/relaxed">
                Your briefing starts with your source. Add a document and five topics to see a
                focused answer, key points and supporting references.
              </p>
            </div>
          ) : null}
          {loading ? (
            <div className="analyzer-loading-state flex min-h-72 flex-col items-center justify-center text-center">
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
                  {hasViewer ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click a passage to view it in the document.
                    </p>
                  ) : null}
                  <div className="mt-2 space-y-3">
                    {analysis.citations.map((citation, index) => {
                      const isActive =
                        activeRef?.excerpt === citation.excerpt &&
                        activeRef?.source === citation.source;
                      return (
                        <blockquote
                          key={`${citation.source}-${index}`}
                          role={hasViewer ? "button" : undefined}
                          tabIndex={hasViewer ? 0 : undefined}
                          onClick={() => hasViewer && handleCitationClick(citation)}
                          onKeyDown={(e) => {
                            if (hasViewer && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              handleCitationClick(citation);
                            }
                          }}
                          className={`border-l-2 px-4 py-3 ${
                            isActive
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-primary bg-muted/50"
                          } ${hasViewer ? "cursor-pointer transition-colors hover:bg-emerald-50/60" : ""}`}
                        >
                          <cite
                            className={`text-xs font-bold not-italic ${isActive ? "text-emerald-700" : "text-primary"}`}
                          >
                            {citation.source}
                            {hasViewer ? (
                              <Eye size={12} className="ml-1.5 inline-block opacity-50" />
                            ) : null}
                          </cite>
                          <p className="mt-1 text-sm/relaxed text-muted-foreground">
                            "{citation.excerpt}"
                          </p>
                        </blockquote>
                      );
                    })}
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
