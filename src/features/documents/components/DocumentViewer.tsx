import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Loader2 } from "lucide-react";

interface DocumentViewerProps {
  /** A File object (fresh upload) or a signed URL string (from history). */
  source: File | string;
  fileType: string;
  /** When set, the viewer scrolls to this page and highlights the excerpt. */
  activeReference: { page: number; excerpt: string } | null;
}

type PDFDoc = {
  numPages: number;
  getPage(num: number): Promise<PDFPage>;
};

type PDFPage = {
  getViewport(opts: { scale: number }): { width: number; height: number };
  render(opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }): { promise: Promise<void> };
  getTextContent(): Promise<{
    items: Array<{ str: string; transform: number[]; width: number; height: number }>;
  }>;
};

const SCALES = [0.6, 0.8, 1.0, 1.25, 1.5, 2.0];
const DEFAULT_SCALE_INDEX = 2;

export function DocumentViewer({ source, fileType, activeReference }: DocumentViewerProps) {
  const isPdf = fileType.toLowerCase() === "pdf";
  const isDocx = fileType.toLowerCase() === "docx";

  if (isPdf) return <PdfViewer source={source} activeReference={activeReference} />;
  if (isDocx) return <DocxViewer source={source} activeReference={activeReference} />;
  return <TextViewer source={source} activeReference={activeReference} />;
}

// ---------------------------------------------------------------------------
// PDF Viewer — renders every page in a scrollable container
// ---------------------------------------------------------------------------

function PdfViewer({
  source,
  activeReference,
}: {
  source: File | string;
  activeReference: { page: number; excerpt: string } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scaleIndex, setScaleIndex] = useState(DEFAULT_SCALE_INDEX);
  const scale = SCALES[scaleIndex]!;
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightRects, setHighlightRects] = useState<
    { page: number; rects: DOMRect[] }
  >({ page: 0, rects: [] });

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPdf(null);

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        let data: ArrayBuffer | string;
        if (source instanceof File) {
          data = await source.arrayBuffer();
        } else {
          data = source;
        }

        const loadingTask = pdfjsLib.getDocument(
          source instanceof File ? { data } : { url: data as string },
        );
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
    return () => { cancelled = true; };
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

  const goToPage = useCallback(
    (page: number) => {
      const el = pageRefs.current.get(page);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentPage(page);
      }
    },
    [],
  );

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
              activeReference && activeReference.page === num
                ? activeReference.excerpt
                : null
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
  const [rendered, setRendered] = useState(false);
  const renderIdRef = useRef(0);

  useEffect(() => {
    onMount(wrapperRef.current);
    return () => onMount(null);
  }, [onMount]);

  useEffect(() => {
    const id = ++renderIdRef.current;
    let cancelled = false;
    setRendered(false);

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled || id !== renderIdRef.current) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (!cancelled && id === renderIdRef.current) setRendered(true);
    })();

    return () => { cancelled = true; };
  }, [pdf, pageNumber, scale]);

  // Text-based highlight overlay
  useEffect(() => {
    if (!highlight || !rendered) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const textContent = await page.getTextContent();
      if (cancelled) return;

      // Remove old highlights
      wrapper.querySelectorAll(".doc-viewer-highlight").forEach((el) => el.remove());

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
        if (x < 0) { w += x; x = 0; }
        if (y < 0) { h += y; y = 0; }
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

    return () => { cancelled = true; };
  }, [highlight, rendered, pdf, pageNumber, scale]);

  return (
    <div
      ref={wrapperRef}
      className="doc-viewer-page"
      data-page={pageNumber}
    >
      <canvas ref={canvasRef} />
      <span className="doc-viewer-page-label">Page {pageNumber}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DOCX Viewer — renders as HTML via mammoth (loaded on client)
// ---------------------------------------------------------------------------

function DocxViewer({
  source,
  activeReference,
}: {
  source: File | string;
  activeReference: { page: number; excerpt: string } | null;
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
        let buffer: ArrayBuffer;
        if (source instanceof File) {
          buffer = await source.arrayBuffer();
        } else {
          const res = await fetch(source);
          buffer = await res.arrayBuffer();
        }
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (!cancelled) {
          setHtml(result.value);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load document.");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  // Highlight excerpt in the rendered HTML
  useEffect(() => {
    if (!activeReference?.excerpt || !containerRef.current) return;
    const container = containerRef.current;
    const excerpt = activeReference.excerpt.trim();
    if (!excerpt) return;

    // Clear previous highlights
    container.querySelectorAll("mark.doc-viewer-text-highlight").forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el);
        parent.normalize();
      }
    });

    // Walk text nodes and find the excerpt
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let fullText = "";
    const nodes: { node: Text; start: number }[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      nodes.push({ node, start: fullText.length });
      fullText += node.textContent || "";
    }

    const searchText = excerpt.toLowerCase().slice(0, 80);
    const idx = fullText.toLowerCase().indexOf(searchText);
    if (idx === -1) return;

    // Find the node containing the match start
    for (const { node, start } of nodes) {
      const nodeText = node.textContent || "";
      const nodeEnd = start + nodeText.length;
      if (idx >= start && idx < nodeEnd) {
        const offset = idx - start;
        const matchLen = Math.min(searchText.length, nodeText.length - offset);
        const range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + matchLen);
        const mark = document.createElement("mark");
        mark.className = "doc-viewer-text-highlight";
        range.surroundContents(mark);
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }
  }, [activeReference]);

  if (loading) {
    return (
      <div className="doc-viewer-loading">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p>Loading document…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doc-viewer-error">
        <FileText className="size-8 text-muted-foreground" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-toolbar">
        <span className="doc-viewer-file-badge">DOCX</span>
      </div>
      <div ref={containerRef} className="doc-viewer-pages doc-viewer-html" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text / CSV / Markdown Viewer
// ---------------------------------------------------------------------------

function TextViewer({
  source,
  activeReference,
}: {
  source: File | string;
  activeReference: { page: number; excerpt: string } | null;
}) {
  const containerRef = useRef<HTMLPreElement>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let content: string;
        if (source instanceof File) {
          content = await source.text();
        } else {
          const res = await fetch(source);
          content = await res.text();
        }
        if (!cancelled) {
          setText(content);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setText("Failed to load file.");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  // Highlight excerpt
  useEffect(() => {
    if (!activeReference?.excerpt || !containerRef.current) return;
    const container = containerRef.current;

    // Clear previous
    container.querySelectorAll("mark.doc-viewer-text-highlight").forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el);
        parent.normalize();
      }
    });

    const searchText = activeReference.excerpt.trim().slice(0, 80);
    const idx = text.toLowerCase().indexOf(searchText.toLowerCase());
    if (idx === -1) return;

    // Re-render with highlight
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + searchText.length);
    const after = text.slice(idx + searchText.length);
    container.innerHTML = "";
    container.appendChild(document.createTextNode(before));
    const mark = document.createElement("mark");
    mark.className = "doc-viewer-text-highlight";
    mark.textContent = match;
    container.appendChild(mark);
    container.appendChild(document.createTextNode(after));
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeReference, text]);

  if (loading) {
    return (
      <div className="doc-viewer-loading">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p>Loading file…</p>
      </div>
    );
  }

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-toolbar">
        <span className="doc-viewer-file-badge">TXT</span>
      </div>
      <pre ref={containerRef} className="doc-viewer-pages doc-viewer-text">
        {text}
      </pre>
    </div>
  );
}
