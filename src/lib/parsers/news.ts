import { NewsItem } from "@/lib/types/domain";

export function classifyNewsCategory(title: string, description = ""): string {
  const text = `${title} ${description}`.toLowerCase();
  const has = (words: string[]) => words.some((w) => text.includes(w));

  if (has(["war", "missile", "sanction", "nato", "diplom", "middle east", "taiwan", "ukraine"])) {
    return "geopolitics";
  }
  if (has(["bitcoin", "crypto", "ethereum", "blockchain", "token"])) {
    return "crypto";
  }
  if (has(["stock", "equity", "nasdaq", "s&p", "dow", "earnings", "semiconductor"])) {
    return "equity";
  }
  if (has(["inflation", "cpi", "ppi", "interest rate", "fed", "ecb", "gdp", "unemployment", "bond"])) {
    return "macro";
  }
  return "macro";
}

export function parseGenericNews(raw: unknown): NewsItem[] {
  const rows = (raw as { data?: Array<Record<string, unknown>> })?.data ?? [];
  return rows.map((row, index) => ({
    id: String(row.id ?? `news_${index + 1}`),
    title: String(row.title ?? ""),
    source: String(row.source ?? "Unknown"),
    publishedAt: String(row.publishedAt ?? new Date().toISOString()),
    category: String(row.category ?? "macro"),
    url: String(row.url ?? ""),
    description: String(row.description ?? "")
  }));
}

export function parseGNews(raw: unknown): NewsItem[] {
  const rows = (raw as { articles?: Array<Record<string, unknown>> })?.articles ?? [];
  return rows.map((row, index) => {
    const title = String(row.title ?? "");
    const description = String(row.description ?? "");
    return {
      id: `gnews_${index + 1}_${Date.now()}`,
      title,
      source: String((row.source as Record<string, unknown> | undefined)?.name ?? "GNews"),
      publishedAt: String(row.publishedAt ?? new Date().toISOString()),
      category: classifyNewsCategory(title, description),
      url: String(row.url ?? ""),
      description
    };
  });
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function pick(tag: string, block: string): string {
  const cdata = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i").exec(block);
  if (cdata?.[1]) return decodeXml(cdata[1].trim());
  const normal = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
  return normal?.[1] ? decodeXml(normal[1].trim()) : "";
}

export function parseRssNews(xml: string, sourceFallback = "RSS"): NewsItem[] {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)).map((m) => m[1] ?? "");
  return items
    .map((block, idx) => {
      const title = pick("title", block);
      const description = pick("description", block);
      const link = pick("link", block);
      const pubDate = pick("pubDate", block);
      const sourceTag = pick("source", block);
      return {
        id: `rss_${Date.now()}_${idx}`,
        title,
        source: sourceTag || sourceFallback,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        category: classifyNewsCategory(title, description),
        url: link,
        description
      } satisfies NewsItem;
    })
    .filter((n) => n.title && n.url);
}
