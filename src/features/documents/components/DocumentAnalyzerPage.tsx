import {
  FileSearch,
  FileText,
  Link2,
  LoaderCircle,
  Search,
  ShieldCheck,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { IntelligencePage } from "@/components/IntelligencePage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentAnalysis } from "@/features/documents/contracts";

export function DocumentAnalyzerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const keywords = [
    ...new Map(
      query
        .split(/[,;\n]+/)
        .map((keyword) => keyword.trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .map((keyword) => [keyword.toLocaleLowerCase(), keyword]),
    ).values(),
  ];

  const chooseFile = (next: File | null) => {
    setAnalysis(null);
    setError("");
    if (
      next &&
      (!/\.(pdf|docx|xlsx|xls|csv|txt|md)$/i.test(next.name) ||
        next.size > 15 * 1024 * 1024 ||
        next.size === 0)
    ) {
      setFile(null);
      setError("Choose a non-empty PDF, Word, Excel, CSV or text file up to 15 MB.");
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
      const form = new FormData();
      form.set("file", file);
      form.set("query", query.trim());
      const response = await fetch("/api/document-analyze", { method: "POST", body: form });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as DocumentAnalysis & { error?: string })
        : ({
            error: `Document analysis failed on the server (${response.status}). Check the Vercel function logs for /api/document-analyze.`,
          } as DocumentAnalysis & { error?: string });
      if (!response.ok) throw new Error(payload.error || "Analysis failed.");
      setAnalysis(payload);
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
        <form onSubmit={submit} className="analyzer-input-card">
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            <h2 className="font-display text-lg font-extrabold">1. Add a document</h2>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            aria-label="Upload a document"
            disabled={loading}
            accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={loading}
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
            <span>Excel</span>
            <span>CSV</span>
            <span>Text</span>
            {file && (
              <button
                disabled={loading}
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
            disabled={loading}
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
            disabled={loading || !file || keywords.length < 5 || keywords.length > 25}
            className="mt-5 w-full sm:w-auto"
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
            Files are processed for this request and are not saved by this application.
          </p>
        </form>

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
                          “{citation.excerpt}”
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
