import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DocumentTests } from "./DocumentTests";
import type { AuditDocument, AuditFinding, AuditReport } from "./civanta-audit-contracts";
import "./admin.css";

const API = "/api/admin/civanta-audit";
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
// The server stops waiting on the AI after 4.5 minutes; the page gives up shortly after.
const CHECK_TIMEOUT_MS = 300_000;

async function request<T>(init?: RequestInit, query = ""): Promise<T> {
  const response = await fetch(API + query, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function CivantaAuditPage() {
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [severity, setSeverity] = useState<"all" | AuditFinding["severity"]>("all");
  const [elapsed, setElapsed] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await request<{ documents: AuditDocument[]; reports: AuditReport[] }>();
      setDocuments(data.documents);
      setReports(data.reports);
      setSelectedDocument((current) =>
        data.documents.some((d) => d.id === current) ? current : data.documents[0]?.id || "",
      );
      setSelectedReport((current) => current || data.reports[0]?.id || "");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load the audit.");
    }
  }, []);
  useEffect(() => void load(), [load]);

  async function upload(file: File | undefined) {
    if (!file?.size) return setError("Choose a file to upload.");
    setBusy("upload");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const uploaded = await request<AuditDocument>({ method: "POST", body });
      setSelectedDocument(uploaded.id);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Upload failed.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
      setBusy("");
    }
  }

  async function check(document: AuditDocument) {
    setBusy(document.id);
    setError("");
    setElapsed(0);
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    try {
      const report = await request<AuditReport>({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: document.id }),
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      });
      setReports((current) => [report, ...current]);
      setSelectedReport(report.id);
      setSeverity("all");
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name === "TimeoutError"
          ? "The check took longer than 5 minutes and was stopped. Try again, or upload a shorter document."
          : failure instanceof Error
            ? failure.message
            : "The check failed.",
      );
    } finally {
      clearInterval(timer);
      setBusy("");
    }
  }

  async function download(document: AuditDocument) {
    try {
      const { url } = await request<{ url: string }>(undefined, `?download=${document.id}`);
      window.open(url, "_blank", "noopener");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Download failed.");
    }
  }

  async function remove(document: AuditDocument) {
    if (!window.confirm(`Delete “${document.file_name}” and its reports?`)) return;
    try {
      await request({ method: "DELETE" }, `?id=${document.id}`);
      setSelectedReport("");
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Delete failed.");
    }
  }

  const report = reports.find((item) => item.id === selectedReport);
  const findings = useMemo(
    () =>
      (report?.findings ?? [])
        .filter((f) => severity === "all" || f.severity === severity)
        .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [report, severity],
  );
  const counts = (report?.findings ?? []).reduce(
    (acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }),
    { high: 0, medium: 0, low: 0 },
  );
  const document = documents.find((item) => item.id === selectedDocument);
  const checking = documents.find((item) => item.id === busy);
  const documentName = (id: string) =>
    documents.find((d) => d.id === id)?.file_name ?? "Deleted document";

  return (
    <main className="admin-page">
      <header className="admin-heading">
        <span className="admin-eyebrow">Admin</span>
        <h1>CIVanta engine audit</h1>
        <p>
          Upload the calculation manual or review workbook, and check it against the live engine: an
          AI review of the rules, plus the document's worked examples recalculated by the engine.
        </p>
      </header>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}

      <section className="admin-card" aria-labelledby="documents-title">
        <h2 id="documents-title">Reference documents</h2>
        <div className="admin-upload">
          <label className={`admin-button${busy === "upload" ? " disabled" : ""}`}>
            {busy === "upload" ? "Uploading…" : "Upload a document"}
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.txt,.md"
              disabled={busy === "upload"}
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </label>
          {document && (
            <div className="admin-document-picker">
              <select
                aria-label="Uploaded documents"
                value={document.id}
                disabled={Boolean(busy)}
                onChange={(event) => setSelectedDocument(event.target.value)}
              >
                {documents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.file_name} · {formatDate(item.created_at)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-button"
                disabled={Boolean(busy)}
                onClick={() => void check(document)}
              >
                {busy === document.id ? "Checking…" : "Check against engine"}
              </button>
              <button
                type="button"
                className="admin-button secondary"
                onClick={() => void download(document)}
              >
                Download
              </button>
              <button
                type="button"
                className="admin-button danger"
                disabled={Boolean(busy)}
                onClick={() => void remove(document)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <small className="admin-muted">
          PDF, DOCX, XLSX, CSV, TXT or Markdown, up to 15 MB. Uploads as soon as you pick a file.
          Stored privately.
        </small>
      </section>

      <section className="admin-card" aria-labelledby="reports-title">
        <div className="admin-card-heading">
          <h2 id="reports-title">Mismatch reports</h2>
          {reports.length > 0 && !checking && (
            <select
              aria-label="Past reports"
              value={selectedReport}
              onChange={(event) => setSelectedReport(event.target.value)}
            >
              {reports.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatDate(item.created_at)} · {documentName(item.document_id)} · engine{" "}
                  {item.engine_version}
                </option>
              ))}
            </select>
          )}
        </div>
        {checking ? (
          <div className="admin-progress" role="status">
            <span className="admin-spinner" aria-hidden="true" />
            <div>
              <strong>
                Checking {checking.file_name} against the live engine · {Math.floor(elapsed / 60)}:
                {String(elapsed % 60).padStart(2, "0")}
              </strong>
              <p>
                Gemini is reading the document and the engine code, listing mismatches and copying
                the worked examples. This usually takes 1–4 minutes. The new report will open here.
              </p>
            </div>
          </div>
        ) : !report ? (
          <p className="admin-muted">Run a check on a document to create a report.</p>
        ) : (
          <>
            <p className="admin-notice">
              AI review ({report.model}). Verify each finding against the document and the code
              before acting on it. The worked examples below are recalculated by the live engine.
            </p>
            <p>{report.summary}</p>
            <div className="admin-stats">
              <span className="admin-sev high">{counts.high} high</span>
              <span className="admin-sev medium">{counts.medium} medium</span>
              <span className="admin-sev low">{counts.low} low</span>
            </div>
            <div className="admin-filters">
              <label>
                Severity
                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as typeof severity)}
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
            <ol className="admin-findings">
              {findings.map((finding) => (
                <li key={finding.id} className="admin-finding">
                  <div className="admin-finding-head">
                    <span className={`admin-sev ${finding.severity}`}>{finding.severity}</span>
                    <span className="admin-muted">
                      {finding.id} · {finding.area}
                    </span>
                  </div>
                  <h3>{finding.title}</h3>
                  <dl>
                    <div>
                      <dt>Document says</dt>
                      <dd>
                        {finding.documentSays}
                        {finding.documentReference && <q>{finding.documentReference}</q>}
                      </dd>
                    </div>
                    <div>
                      <dt>Engine does</dt>
                      <dd>
                        {finding.engineDoes}
                        {finding.codeLocation && <code>{finding.codeLocation}</code>}
                      </dd>
                    </div>
                    {finding.impact && (
                      <div>
                        <dt>Impact</dt>
                        <dd>{finding.impact}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ol>
            {report.matches.length > 0 && (
              <details className="admin-matches">
                <summary>Matches the document ({report.matches.length})</summary>
                <ul>
                  {report.matches.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            )}
            <DocumentTests report={report} />
          </>
        )}
      </section>
    </main>
  );
}
