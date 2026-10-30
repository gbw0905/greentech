export type NewsTarget = { name: string; query: string } | null;

/** Search company names rather than quoted dataset labels and required topic lists. */
export function entityNewsQuery(target: Exclude<NewsTarget, null>) {
  const name = target.name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(feedstock sourcing|feedstock|waste oils)\b/gi, " ")
    .split(/\s+\/\s+/)[0]!
    .replace(/\s+/g, " ")
    .trim();
  return name || target.name;
}

/** Opens a Google News search for a market entity in a new tab. */
export function openEntityNews(target: NewsTarget) {
  if (!target) return;
  const url = `https://news.google.com/search?q=${encodeURIComponent(entityNewsQuery(target))}&hl=en-US&gl=US&ceid=US:en`;
  window.open(url, "_blank", "noopener,noreferrer");
}
