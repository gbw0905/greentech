import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Loader2 } from "lucide-react";
import { cellText } from "@/features/documents/cell-text";
import { SelectionExplain, type ExplainContext } from "./SelectionExplain";
import { clearHighlights, highlightExcerpt } from "./text-match";

export type ActiveReference = { page: number; excerpt: string; source: string };

interface DocumentViewerProps {
  /** A File object (fresh upload) or a signed URL string (from history). */
  source: File | string;
  fileType: string;
  /** When set, the viewer scrolls to this reference and highlights the excerpt. */
  activeReference: ActiveReference | null;
  /** Enables "select text → Explain" when provided. */
  explainContext?: ExplainContext;
}

type PDFTask = { destroy(): Promise<void> };
type PDFRenderTask = { promise: Promise<void>; cancel(): void };

type PDFDoc = {
  numPages: number;
  getPage(num: number): Promise<PDFPage>;
};

type PDFTextContent = {
  items: Array<{ str: string; transform: number[]; width: number; height: number }>;
};

type PDFPage = {
  getViewport(opts: { scale: number }): { width: number; height: number };
  render(opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }): PDFRenderTask;
  getTextContent(): Promise<PDFTextContent>;
};

const SCALES = [0.6, 0.8, 1.0, 1.25, 1.5, 2.0];
const DEFAULT_SCALE_INDEX = 2;

async function readArrayBuffer(source: File | string) {
  if (source instanceof File) return source.arrayBuffer();
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Could not download the document (${res.status}).`);
  return res.arrayBuffer();
}

export function DocumentViewer({
  source,
  fileType,
  activeReference,
  explainContext,
}: DocumentViewerProps) {
  const type = fileType.toLowerCase();
  return (
    <SelectionExplain context={explainContext}>
      {type === "pdf" ? (
        <PdfViewer source={source} activeReference={activeReference} />
      ) : type === "docx" ? (
        <DocxViewer source={source} activeReference={activeReference} />
      ) : type === "xlsx" ? (
        <XlsxViewer source={source} activeReference={activeReference} />
      ) : (
        <TextViewer source={source} fileType={type} activeReference={activeReference} />
      )}
    </SelectionExplain>
  );
}

// ---------------------------------------------------------------------------
// PDF Viewer — renders every page in a scrollable container
// ---------------------------------------------------------------------------

function PdfViewer({
  source,
  activeReference,
}: {
  source: File | string;
  activeReference: ActiveReference | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scaleIndex, setScaleIndex] = useState(DEFAULT_SCALE_INDEX);
  const scale = SCALES[scaleIndex]!;
  const [currentPage, setCurrentPage] = useState(1);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    let loadingTask: (PDFTask & { promise: Promise<unknown> }) | undefined;
    setLoading(true);
    setError("");
    setPdf(null);
    setCurrentPage(1);

    (async () => {
      try {
        const [pdfjsLib, { default: workerUrl }] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

        let data: ArrayBuffer | string;
        if (source instanceof File) {
          data = await source.arrayBuffer();
        } else {
          data = source;
        }

        if (cancelled) return;
        loadingTask = pdfjsLib.getDocument({
          ...(typeof data === "string" ? { url: data } : { data }),
          maxImageSize: 40_000_000,
        });
        const doc = await loadingTask.promise;
        if (!cancelled) {
          setPdf(doc as unknown as PDFDoc);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      void loadingTask?.destroy().catch(() => {});
    };
  }, [source]);

  // Track current page via scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdf) return;
    const onScroll = () => {
      const top = container.scrollTop + 40;
      let closest = 1;
      pageRefs.current.forEach((el, num) => {
        if (el.offsetTop <= top) closest = num;
      });
      setCurrentPage(closest);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [pdf]);

  // Scroll to active reference page
  useEffect(() => {
    if (!activeReference || !pdf) return;
    const pageEl = pageRefs.current.get(activeReference.page);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(activeReference.page);
    }
  }, [activeReference, pdf]);

  const goToPage = useCallback((page: number) => {
    const el = pageRefs.current.get(page);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(page);
    }
  }, []);

  if (loading) {
    return (
      <div className="doc-viewer-loading">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p>Loading document…</p>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="doc-viewer-error">
        <FileText className="size-8 text-muted-foreground" />
        <p>{error || "Could not load document."}</p>
      </div>
    );
  }

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-toolbar">
        <div className="doc-viewer-page-nav">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {currentPage} / {pdf.numPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= pdf.numPages}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="doc-viewer-zoom">
          <button
            type="button"
            disabled={scaleIndex <= 0}
            onClick={() => setScaleIndex((i) => Math.max(0, i - 1))}
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            disabled={scaleIndex >= SCALES.length - 1}
            onClick={() => setScaleIndex((i) => Math.min(SCALES.length - 1, i + 1))}
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="doc-viewer-pages">
        {Array.from({ length: pdf.numPages }, (_, i) => i + 1).map((num) => (
          <PdfPageCanvas
            key={num}
            pdf={pdf}
            pageNumber={num}
            scale={scale}
            highlight={
              activeReference && activeReference.page === num ? activeReference.excerpt : null
            }
            onMount={(el) => {
              if (el) pageRefs.current.set(num, el);
              else pageRefs.current.delete(num);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single PDF page rendered to canvas with text highlight overlay
// ---------------------------------------------------------------------------

function PdfPageCanvas({
  pdf,
  pageNumber,
  scale,
  highlight,
  onMount,
}: {
  pdf: PDFDoc;
  pageNumber: number;
  scale: number;
  highlight: string | null;
  onMount: (el: HTMLDivElement | null) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    onMount(wrapperRef.current);
    return () => onMount(null);
  }, [onMount]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(Boolean(entry?.isIntersecting)),
      { root: wrapper.parentElement, rootMargin: "600px 0px" },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setRendered(false);
    if (!nearViewport) return;
    let cancelled = false;
    let renderTask: PDFRenderTask | undefined;
    let textTask: { cancel(): void } | undefined;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const { width, height } = page.getViewport({ scale: 1 });
      setPageSize({ width, height });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const resolution = Math.min(1, Math.sqrt(16_000_000 / (viewport.width * viewport.height)));
      canvas.width = Math.max(1, Math.floor(viewport.width * resolution));
      canvas.height = Math.max(1, Math.floor(viewport.height * resolution));
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderTask = page.render({
        canvasContext: ctx,
        viewport: page.getViewport({ scale: scale * resolution }),
      });
      await renderTask.promise;
      if (cancelled) return;
      setRendered(true);

      // Invisible, selectable text over the canvas so passages can be
      // selected and explained.
      const textLayer = textLayerRef.current;
      if (!textLayer) return;
      const { TextLayer } = await import("pdfjs-dist");
      const textContent = await page.getTextContent();
      if (cancelled) return;
      textLayer.replaceChildren();
      const layer = new TextLayer({
        textContentSource: textContent as never,
        container: textLayer,
        viewport: viewport as never,
      });
      textTask = layer;
      await layer.render();
    })().catch(() => {
      // A cancelled render or missing text layer only loses selection.
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textTask?.cancel();
    };
  }, [pdf, pageNumber, scale, nearViewport]);

  // Text-based highlight overlay
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.querySelectorAll(".doc-viewer-highlight").forEach((el) => el.remove());
    if (!highlight || !rendered) return;

    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const textContent = await page.getTextContent();
      if (cancelled) return;

      const excerptLower = highlight.toLowerCase().replace(/\s+/g, " ").trim();
      if (!excerptLower) return;

      const textItems = textContent.items as Array<{
        str: string;
        transform: number[];
        width: number;
        height: number;
      }>;

      // Build concatenated page text with character-to-item mapping
      let fullText = "";
      const charMap: { itemIndex: number; charInItem: number }[] = [];
      for (let i = 0; i < textItems.length; i++) {
        const raw = textItems[i]!.str;
        for (let c = 0; c < raw.length; c++) {
          charMap.push({ itemIndex: i, charInItem: c });
        }
        fullText += raw;
        // Add space between items for word separation
        if (i < textItems.length - 1) {
          charMap.push({ itemIndex: -1, charInItem: 0 });
          fullText += " ";
        }
      }

      const normalizedFull = fullText.toLowerCase().replace(/\s+/g, " ");
      const searchStr = excerptLower.slice(0, 120);
      const matchStart = normalizedFull.indexOf(searchStr);
      if (matchStart === -1) return;
      const matchEnd = matchStart + searchStr.length;

      // Collect the unique item indices that fall within the match
      const matchedItems = new Set<number>();
      for (let ci = matchStart; ci < matchEnd && ci < charMap.length; ci++) {
        const idx = charMap[ci]!.itemIndex;
        if (idx >= 0) matchedItems.add(idx);
      }

      const canvasW = viewport.width;
      const canvasH = viewport.height;

      for (const idx of matchedItems) {
        const item = textItems[idx]!;
        const tx = item.transform;
        const fontSize = Math.abs(tx[0]!) || 12;
        const itemH = item.height || fontSize;
        const itemW = item.width || item.str.length * fontSize * 0.6;

        let x = tx[4]! * scale;
        let y = canvasH - tx[5]! * scale - itemH * scale;
        let w = itemW * scale;
        let h = itemH * scale;

        // Clamp to canvas bounds
        if (x < 0) {
          w += x;
          x = 0;
        }
        if (y < 0) {
          h += y;
          y = 0;
        }
        w = Math.min(w, canvasW - x);
        h = Math.min(h, canvasH - y);
        if (w <= 0 || h <= 0) continue;

        const mark = document.createElement("div");
        mark.className = "doc-viewer-highlight";
        mark.style.left = `${x}px`;
        mark.style.top = `${y}px`;
        mark.style.width = `${w}px`;
        mark.style.height = `${h}px`;
        wrapper.appendChild(mark);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [highlight, rendered, pdf, pageNumber, scale]);

  return (
    <div
      ref={wrapperRef}
      className="doc-viewer-page"
      data-page={pageNumber}
      data-explain-context={`Page ${pageNumber}`}
      style={
        {
          width: pageSize.width * scale,
          height: pageSize.height * scale,
          flexShrink: 0,
          "--total-scale-factor": scale,
          "--scale-round-x": "1px",
          "--scale-round-y": "1px",
        } as CSSProperties
      }
    >
      {nearViewport && (
        <>
          <canvas ref={canvasRef} />
          <div ref={textLayerRef} className="textLayer" />
        </>
      )}
      <span className="doc-viewer-page-label" data-match-skip>
        Page {pageNumber}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces for the HTML-based viewers
// ---------------------------------------------------------------------------

function ViewerLoading({ label = "Loading document…" }: { label?: string }) {
  return (
    <div className="doc-viewer-loading">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p>{label}</p>
    </div>
  );
}

function ViewerError({ message }: { message: string }) {
  return (
    <div className="doc-viewer-error">
      <FileText className="size-8 text-muted-foreground" />
      <p>{message}</p>
    </div>
  );
}

/** Highlight the active excerpt inside `containerRef` and scroll to it. */
function useExcerptHighlight(
  containerRef: RefObject<HTMLElement | null>,
  activeReference: ActiveReference | null,
  ready: unknown,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return;
    if (!activeReference?.excerpt.trim()) {
      clearHighlights(container);
      return;
    }
    const mark = highlightExcerpt(container, activeReference.excerpt);
    mark?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [containerRef, activeReference, ready]);
}

// ---------------------------------------------------------------------------
// DOCX Viewer — renders as HTML via mammoth (loaded on client)
// ---------------------------------------------------------------------------

function DocxViewer({
  source,
  activeReference,
}: {
  source: File | string;
  activeReference: ActiveReference | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const buffer = await readArrayBuffer(source);
        const [mammoth, { default: DOMPurify }] = await Promise.all([
          import("mammoth"),
          import("dompurify"),
        ]);
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (!cancelled) {
          setHtml(
            DOMPurify.sanitize(result.value, {
              USE_PROFILES: { html: true },
              FORBID_TAGS: ["form", "input", "button", "style"],
              FORBID_ATTR: ["style", "srcset"],
              SANITIZE_NAMED_PROPS: true,
            }),
          );
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load document.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  useExcerptHighlight(containerRef, activeReference, !loading && html);

  if (loading) return <ViewerLoading />;
  if (error) return <ViewerError message={error} />;

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-toolbar">
        <span className="doc-viewer-file-badge">DOCX</span>
      </div>
      <div className="doc-viewer-pages doc-viewer-html-scroll">
        <div
          ref={containerRef}
          className="doc-viewer-html"
          data-explain-context="Document"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// XLSX Viewer — renders each worksheet as a table via exceljs
// ---------------------------------------------------------------------------

type SheetData = {
  name: string;
  columns: number;
  rows: { number: number; cells: string[] }[];
  totalRows: number;
};

const MAX_SHEET_ROWS = 2_000;
const MAX_SHEET_COLUMNS = 60;

function columnLabel(index: number) {
  let label = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
  }
  return label;
}

/** "Sheet “Q1 data”, section 2" → "Q1 data" */
function referenceSheet(reference: ActiveReference | null) {
  return reference?.source.match(/Sheet “(.+?)”/)?.[1] ?? null;
}

/** Spreadsheet excerpts carry the extractor's "Row N:" labels and " | " separators. */
const prepareSheetExcerpt = (excerpt: string) =>
  excerpt.replace(/Row \d+:/gi, " ").replace(/\|/g, " ");

function XlsxViewer({
  source,
  activeReference,
}: {
  source: File | string;
  activeReference: ActiveReference | null;
}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setActiveSheet(0);
    (async () => {
      try {
        const buffer = await readArrayBuffer(source);
        const mod = await import("exceljs");
        const ExcelJS = (mod.default ?? mod) as typeof mod.default;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const loaded: SheetData[] = [];
        workbook.eachSheet((sheet) => {
          const data: SheetData = { name: sheet.name, columns: 0, rows: [], totalRows: 0 };
          sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            data.totalRows += 1;
            if (data.rows.length >= MAX_SHEET_ROWS) return;
            const cells = (row.values as Parameters<typeof cellText>[0][])
              .slice(1, MAX_SHEET_COLUMNS + 1)
              .map(cellText);
            data.columns = Math.max(data.columns, cells.length);
            data.rows.push({ number: rowNumber, cells });
          });
          loaded.push(data);
        });
        if (!cancelled) {
          setSheets(loaded);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load spreadsheet.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  // A new reference may point at another worksheet: switch to it first.
  useEffect(() => {
    const name = referenceSheet(activeReference);
    const target = name ? sheets.findIndex((sheet) => sheet.name === name) : -1;
    if (target !== -1) setActiveSheet(target);
  }, [activeReference, sheets]);

  useEffect(() => {
    const container = tableRef.current;
    if (!container) return;
    clearHighlights(container);
    container
      .querySelectorAll(".doc-viewer-row-highlight")
      .forEach((row) => row.classList.remove("doc-viewer-row-highlight"));
    if (!activeReference) return;
    const name = referenceSheet(activeReference);
    if (name && sheets[activeSheet]?.name !== name) return;

    const mark = highlightExcerpt(container, activeReference.excerpt, prepareSheetExcerpt);
    if (mark) {
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Fall back to the row the excerpt names when the cell text differs.
    const rowNumber = activeReference.excerpt.match(/Row (\d+)/i)?.[1];
    const row = rowNumber ? container.querySelector(`tr[data-row="${rowNumber}"]`) : null;
    if (row) {
      row.classList.add("doc-viewer-row-highlight");
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeReference, activeSheet, sheets]);

  if (loading) return <ViewerLoading label="Loading spreadsheet…" />;
  if (error) return <ViewerError message={error} />;

  const sheet = sheets[activeSheet];

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-toolbar">
        <span className="doc-viewer-file-badge">XLSX</span>
        {sheets.length > 1 ? (
          <div className="doc-viewer-sheet-tabs" role="tablist" aria-label="Worksheets">
            {sheets.map((item, index) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={index === activeSheet}
                onClick={() => setActiveSheet(index)}
              >
                {item.name}
              </button>
            ))}
          </div>
        ) : sheet ? (
          <span className="doc-viewer-sheet-name">{sheet.name}</span>
        ) : null}
      </div>
      <div className="doc-viewer-pages doc-viewer-sheet-scroll">
        {!sheet || !sheet.rows.length ? (
          <p className="doc-viewer-sheet-empty">This sheet has no data.</p>
        ) : (
          <div ref={tableRef} data-explain-context={`Sheet “${sheet.name}”`}>
            <table className="doc-viewer-sheet">
              <thead data-match-skip>
                <tr>
                  <th />
                  {Array.from({ length: sheet.columns }, (_, index) => (
                    <th key={index}>{columnLabel(index)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={row.number} data-row={row.number}>
                    <th scope="row" data-match-skip>
                      {row.number}
                    </th>
                    {Array.from({ length: sheet.columns }, (_, index) => (
                      <td key={index}>{row.cells[index] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {sheet.totalRows > sheet.rows.length ? (
              <p className="doc-viewer-sheet-empty" data-match-skip>
                Showing the first {sheet.rows.length.toLocaleString()} of{" "}
                {sheet.totalRows.toLocaleString()} rows.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text / CSV / Markdown Viewer
// ---------------------------------------------------------------------------

function TextViewer({
  source,
  fileType,
  activeReference,
}: {
  source: File | string;
  fileType: string;
  activeReference: ActiveReference | null;
}) {
  const containerRef = useRef<HTMLPreElement>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const content = new TextDecoder("utf-8", { fatal: false }).decode(
          await readArrayBuffer(source),
        );
        if (!cancelled) {
          setText(content);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load file.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  useExcerptHighlight(containerRef, activeReference, !loading && text);

  if (loading) return <ViewerLoading label="Loading file…" />;
  if (error) return <ViewerError message={error} />;

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-toolbar">
        <span className="doc-viewer-file-badge">{fileType || "TXT"}</span>
      </div>
      <div className="doc-viewer-pages doc-viewer-html-scroll">
        {/* Keyed so a new file remounts instead of patching highlighted DOM. */}
        <pre
          key={text}
          ref={containerRef}
          className="doc-viewer-text"
          data-explain-context="Document"
        >
          {text}
        </pre>
      </div>
    </div>
  );
}
