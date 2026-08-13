export type NewsTarget = { name: string; query: string } | null;

/** Opens a Google News search for the entity in a new tab. */
export function openEntityNews(target: NewsTarget) {
  if (!target) return;
  const url = `https://news.google.com/search?q=${encodeURIComponent(target.query)}&hl=en-US&gl=US&ceid=US:en`;
  window.open(url, "_blank", "noopener,noreferrer");
}
