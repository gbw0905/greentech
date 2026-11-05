import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Copy, Check, Loader2, Sparkles, X } from "lucide-react";
import type { ExplainSelectionRequest, SelectionExplanation } from "@/features/documents/contracts";
import { readableText } from "./text-match";

export type ExplainContext = {
  fileName: string;
  keywords: string[];
  briefing: string;
};

type Pending = { selection: string; context: string; location: string; x: number; y: number };

type CardState =
  | { status: "loading"; selection: string; location: string }
  | { status: "error"; selection: string; location: string; error: string }
  | { status: "done"; selection: string; location: string; result: SelectionExplanation };

const MIN_SELECTION = 2;
const MAX_SELECTION = 2_000;
const CONTEXT_RADIUS = 2_000;

const squash = (value: string) => value.replace(/\s+/g, " ").trim();

/** Surrounding text of the selection, read from its nearest context root. */
function selectionContext(range: Range, selection: string) {
  const anchor =
    range.commonAncestorContainer instanceof HTMLElement
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
  const root = anchor?.closest<HTMLElement>("[data-explain-context]");
  if (!root) return { context: "", location: "" };
  const full = squash(readableText(root));
  const index = full.toLocaleLowerCase().indexOf(squash(selection).toLocaleLowerCase());
  const center = index === -1 ? 0 : index;
  const start = Math.max(0, center - CONTEXT_RADIUS);
  return {
    context: full.slice(start, center + selection.length + CONTEXT_RADIUS),
    location: root.dataset["explainContext"] ?? "",
  };
}

/**
 * Wraps a document viewer: selecting text shows an "Explain" button, which
 * asks the server for a summary of the selection in the document's context.
 */
export function SelectionExplain({
  context,
  children,
}: {
  context: ExplainContext | undefined;
  children: ReactNode;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, SelectionExplanation>());
  const requestId = useRef(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [card, setCard] = useState<CardState | null>(null);
  const [copied, setCopied] = useState(false);

  const captureSelection = useCallback(() => {
    const shell = shellRef.current;
    const selection = window.getSelection();
    if (!shell || !selection || selection.isCollapsed || !selection.rangeCount) {
      setPending(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!shell.contains(range.commonAncestorContainer)) return;
    const text = selection.toString().trim();
    if (text.length < MIN_SELECTION || text.length > MAX_SELECTION) {
      setPending(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const x = Math.min(
      Math.max(rect.left + rect.width / 2 - shellRect.left, 56),
      shellRect.width - 56,
    );
    const y = Math.min(rect.bottom - shellRect.top + 8, shellRect.height - 44);
    setPending({ selection: text, ...selectionContext(range, text), x, y });
  }, []);

  // Selection position goes stale once the document scrolls.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const hide = () => setPending(null);
    shell.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => shell.removeEventListener("scroll", hide, { capture: true });
  }, []);

  const explain = async () => {
    if (!pending || !context) return;
    const { selection, location } = pending;
    const body: ExplainSelectionRequest = {
      selection,
      context: pending.context,
      location,
      fileName: context.fileName,
      keywords: context.keywords,
      briefing: context.briefing,
    };
    setPending(null);
    window.getSelection()?.removeAllRanges();
    setCopied(false);

    const cacheKey = `${location}\n${selection}`;
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setCard({ status: "done", selection, location, result: cached });
      return;
    }

    const id = ++requestId.current;
    setCard({ status: "loading", selection, location });
    try {
      const response = await fetch("/api/document-explain", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as SelectionExplanation & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not explain this passage.");
      cache.current.set(cacheKey, payload);
      if (id === requestId.current)
        setCard({ status: "done", selection, location, result: payload });
    } catch (cause) {
      if (id === requestId.current) {
        setCard({
          status: "error",
          selection,
          location,
          error: cause instanceof Error ? cause.message : "Could not explain this passage.",
        });
      }
    }
  };

  const copy = async () => {
    if (card?.status !== "done") return;
    const { result } = card;
    const lines = [
      `"${card.selection}"`,
      "",
      result.summary,
      "",
      result.explanation,
      result.relevance ? `\n${result.relevance}` : "",
      ...result.terms.map((term) => `• ${term.term}: ${term.meaning}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      setCopied(true);
    } catch {
      // clipboard may be blocked; nothing to do
    }
  };

  return (
    <div
      ref={shellRef}
      className="doc-viewer-shell"
      onMouseUp={() => requestAnimationFrame(captureSelection)}
      onKeyUp={(event) => {
        if (event.shiftKey || event.key.startsWith("Arrow")) captureSelection();
        if (event.key === "Escape") {
          setPending(null);
          setCard(null);
        }
      }}
    >
      {children}

      {pending && context ? (
        <button
          type="button"
          className="doc-explain-trigger"
          style={{ left: pending.x, top: pending.y }}
          // Keep the text selection alive while clicking.
          onMouseDown={(event) => event.preventDefault()}
          onClick={explain}
        >
          <Sparkles size={13} />
          Explain
        </button>
      ) : null}

      {card ? (
        <section className="doc-explain-card" aria-live="polite" aria-label="Selection explanation">
          <header>
            <span className="doc-explain-eyebrow">
              <Sparkles size={13} />
              Explanation{card.location ? ` · ${card.location}` : ""}
            </span>
            <div className="doc-explain-actions">
              {card.status === "done" ? (
                <button type="button" onClick={copy} aria-label="Copy explanation">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              ) : null}
              <button type="button" onClick={() => setCard(null)} aria-label="Close explanation">
                <X size={14} />
              </button>
            </div>
          </header>
          <blockquote>
            “{card.selection.length > 220 ? `${card.selection.slice(0, 220)}…` : card.selection}”
          </blockquote>
          {card.status === "loading" ? (
            <p className="doc-explain-status">
              <Loader2 size={14} className="animate-spin" />
              Reading the surrounding text…
            </p>
          ) : card.status === "error" ? (
            <p className="doc-explain-error">{card.error}</p>
          ) : (
            <div className="doc-explain-body">
              {card.result.summary ? (
                <p className="doc-explain-summary">{card.result.summary}</p>
              ) : null}
              {card.result.explanation ? <p>{card.result.explanation}</p> : null}
              {card.result.relevance ? (
                <div>
                  <h4>Relevance to your keywords</h4>
                  <p>{card.result.relevance}</p>
                  {card.result.relatedKeywords.length ? (
                    <div className="doc-explain-chips">
                      {card.result.relatedKeywords.map((keyword) => (
                        <span key={keyword}>{keyword}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {card.result.terms.length ? (
                <div>
                  <h4>Terms</h4>
                  <dl>
                    {card.result.terms.map((term) => (
                      <div key={term.term}>
                        <dt>{term.term}</dt>
                        <dd>{term.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
