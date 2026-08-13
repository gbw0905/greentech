export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
};

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pick(block: string, tag: string) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]!) : "";
}

export async function fetchEntityNews(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return [];
  const xml = await res.text();
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return blocks.slice(0, 12).map((b) => {
    const title = pick(b, "title");
    const source = pick(b, "source");
    const pub = pick(b, "pubDate");
    const link = pick(b, "link");
    return {
      title: title.replace(new RegExp(`\\s*-\\s*${source}$`), ""),
      link,
      source: source || "Google News",
      publishedAt: pub ? new Date(pub).toISOString() : null,
    };
  });
}
