/**
 * DOM text matching shared by the HTML-based viewers (DOCX, XLSX, text).
 *
 * Excerpts come from server-side extraction, whose whitespace never lines up
 * with the rendered DOM (paragraph breaks, formatting runs, table cells). We
 * therefore compare with all whitespace removed and map each kept character
 * back to its text node so a match can span any number of nodes.
 */

const HIGHLIGHT_CLASS = "doc-viewer-text-highlight";
const SKIP_SELECTOR = "[data-match-skip]";

function canon(ch: string) {
  const lower = ch.toLocaleLowerCase();
  if (/[‘’‛′`]/.test(lower)) return "'";
  if (/[“”„″]/.test(lower)) return '"';
  if (/[‐‑‒–—−]/.test(lower)) return "-";
  return lower;
}

function compact(text: string) {
  let out = "";
  for (const ch of text) if (!/\s/.test(ch)) out += canon(ch);
  return out;
}

export function clearHighlights(root: HTMLElement) {
  root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
    parent.normalize();
  });
}

/**
 * Highlight the best match for `excerpt` inside `root` and return the first
 * mark, or null when nothing matched. `prepare` cleans source-specific noise
 * (e.g. "Row 4:" labels from spreadsheet extraction) out of the excerpt.
 */
export function highlightExcerpt(
  root: HTMLElement,
  excerpt: string,
  prepare: (excerpt: string) => string = (value) => value,
): HTMLElement | null {
  clearHighlights(root);

  const map: { node: Text; offset: number }[] = [];
  let haystack = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(SKIP_SELECTOR)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.data;
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i]!)) continue;
      haystack += canon(text[i]!);
      map.push({ node, offset: i });
    }
  }

  // Try the whole excerpt first, then each "…"-separated piece (longest
  // first), then its head and tail in case the model trimmed a few words.
  const prepared = prepare(excerpt);
  const pieces = prepared
    .split(/\.{3}|…/)
    .map(compact)
    .sort((a, b) => b.length - a.length);
  const full = compact(prepared);
  const candidates = [full.slice(0, 300), ...pieces.map((piece) => piece.slice(0, 300))];
  if (full.length > 60) candidates.push(full.slice(0, 60), full.slice(-60));

  let start = -1;
  let length = 0;
  for (const candidate of candidates) {
    if (candidate.length < Math.min(8, full.length) || !candidate) continue;
    start = haystack.indexOf(candidate);
    if (start !== -1) {
      length = candidate.length;
      break;
    }
  }
  if (start === -1) return null;

  // Group the matched characters by text node, then wrap each run.
  const segments: { node: Text; from: number; to: number }[] = [];
  for (let i = start; i < start + length; i++) {
    const { node, offset } = map[i]!;
    const last = segments[segments.length - 1];
    if (last && last.node === node) last.to = offset + 1;
    else segments.push({ node, from: offset, to: offset + 1 });
  }

  const marks: HTMLElement[] = [];
  for (const { node, from, to } of segments) {
    const range = document.createRange();
    range.setStart(node, from);
    range.setEnd(node, to);
    const mark = document.createElement("mark");
    mark.className = HIGHLIGHT_CLASS;
    range.surroundContents(mark);
    marks.push(mark);
  }
  return marks[0] ?? null;
}

/**
 * Text of `root` with readable separators: table cells joined by " | ",
 * block elements and PDF text-layer spans on their own lines/words.
 */
export function readableText(root: HTMLElement) {
  let out = "";
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node as Text).data;
      return;
    }
    if (!(node instanceof HTMLElement) || node.matches(SKIP_SELECTOR)) return;
    node.childNodes.forEach(visit);
    const tag = node.tagName;
    if (tag === "TD" || tag === "TH") out += " | ";
    else if (/^(P|DIV|LI|TR|H[1-6]|BR|BLOCKQUOTE)$/.test(tag)) out += "\n";
    else if (tag === "SPAN" && node.parentElement?.classList.contains("textLayer")) out += " ";
  };
  visit(root);
  return out
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}
