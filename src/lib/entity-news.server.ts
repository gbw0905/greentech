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

function parseRss(xml: string, fallbackSource: string): NewsItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return blocks
    .slice(0, 12)
    .map((b) => {
      const title = pick(b, "title");
      const source = pick(b, "source") || pick(b, "News:Source") || fallbackSource;
      const pub = pick(b, "pubDate") || pick(b, "News:PublishedDate");
      const link = pick(b, "link");
      const cleanTitle = source
        ? title.replace(new RegExp(`\\s*-\\s*${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "")
        : title;
      const d = pub ? new Date(pub) : null;
      return {
        title: cleanTitle,
        link,
        source: source || fallbackSource,
        publishedAt: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null,
      };
    })
    .filter((n) => n.title && n.link);
}

async function tryFeed(url: string, fallbackSource: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return [];
    return parseRss(await res.text(), fallbackSource);
  } catch {
    return [];
  }
}

export async function fetchEntityNews(query: string): Promise<NewsItem[]> {
  const q = encodeURIComponent(query);
  const feeds: Array<[string, string]> = [
    [`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, "Google News"],
    [`https://www.bing.com/news/search?q=${q}&format=RSS`, "Bing News"],
    [
      `https://news.google.com/rss/search?q=${encodeURIComponent(query.replace(/"/g, ""))}&hl=en&gl=US&ceid=US:en`,
      "Google News",
    ],
  ];
  for (const [url, label] of feeds) {
    const items = await tryFeed(url, label);
    if (items.length) return items;
  }
  return [];
}
