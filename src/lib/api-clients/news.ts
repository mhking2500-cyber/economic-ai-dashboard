import { NewsItem } from "@/lib/types/domain";
import { parseGNews, parseGenericNews, parseRssNews } from "@/lib/parsers/news";

const NEWS_API_BASE = process.env.NEWS_API_BASE_URL;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_PROVIDER = (process.env.NEWS_PROVIDER ?? "GENERIC").toUpperCase();

export async function fetchMacroNews(limit = 30): Promise<NewsItem[]> {
  let source: NewsItem[] = [];

  try {
  if (!NEWS_API_BASE) {
    source = await fetchRssFallback(limit);
  } else if (NEWS_PROVIDER === "GNEWS") {
    if (!NEWS_API_KEY) {
      source = await fetchRssFallback(limit);
    } else {
      try {
        const url =
          `${NEWS_API_BASE}/search?q=economy%20OR%20geopolitics%20OR%20inflation` +
          `&lang=en&max=${Math.min(limit, 50)}&apikey=${NEWS_API_KEY}`;
        const response = await fetch(url, { next: { revalidate: 60 } });
        if (response.ok) {
          const json = (await response.json()) as unknown;
          source = parseGNews(json);
        }
      } catch {
        source = [];
      }
      if (!source.length) {
        source = await fetchRssFallback(limit);
      }
    }
  } else {
    if (!NEWS_API_KEY) {
      source = await fetchRssFallback(limit);
    } else {
      try {
        const url = `${NEWS_API_BASE}/news?limit=${limit}&topics=macro,economy,geopolitics`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${NEWS_API_KEY}` },
          next: { revalidate: 60 }
        });
        if (response.ok) {
          const json = (await response.json()) as unknown;
          source = parseGenericNews(json);
        }
      } catch {
        source = [];
      }
      if (!source.length) {
        source = await fetchRssFallback(limit);
      }
    }
  }

  const dedup = dedupeNews(source);
  return await localizeNewsToKorean(dedup.slice(0, limit));
  } catch {
    return [];
  }
}

async function fetchRssFallback(limit: number): Promise<NewsItem[]> {
  const feeds = [
    {
      url: "https://news.google.com/rss/search?q=economy+OR+inflation+OR+interest+rate&hl=en-US&gl=US&ceid=US:en",
      source: "Google News"
    },
    {
      url: "https://news.google.com/rss/search?q=geopolitics+OR+sanctions+OR+war&hl=en-US&gl=US&ceid=US:en",
      source: "Google News"
    }
  ];

  const results = await Promise.all(
    feeds.map(async (feed) => {
      try {
        const response = await fetch(feed.url, { next: { revalidate: 120 } });
        if (!response.ok) return [] as NewsItem[];
        const xml = await response.text();
        return parseRssNews(xml, feed.source);
      } catch {
        return [] as NewsItem[];
      }
    })
  );

  const merged = results.flat();
  const dedup = dedupeNews(merged);
  return dedup
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\([^)]+\)/g, " ")
    .replace(/[^a-z0-9가-힣\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeNews(items: NewsItem[]): NewsItem[] {
  const byUrl = new Map<string, NewsItem>();
  for (const item of items) {
    if (item.url && !byUrl.has(item.url)) byUrl.set(item.url, item);
  }

  const seenTitle = new Set<string>();
  const dedupByTitle: NewsItem[] = [];
  for (const item of byUrl.values()) {
    const key = normalizeTitle(item.title).slice(0, 80);
    if (!key) continue;
    if (seenTitle.has(key)) continue;
    seenTitle.add(key);
    dedupByTitle.push(item);
  }
  return dedupByTitle;
}

async function translateToKorean(text: string): Promise<string> {
  const input = text.trim();
  if (!input) return "";
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single" +
      `?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(input)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"
      },
      next: { revalidate: 300 }
    });
    clearTimeout(timer);
    if (!response.ok) return input;
    const json = (await response.json()) as unknown;
    const root = Array.isArray(json) ? json : [];
    const sentences = Array.isArray(root[0]) ? root[0] : [];
    const translated = sentences
      .map((row) => (Array.isArray(row) ? String(row[0] ?? "") : ""))
      .join("")
      .trim();
    return translated || input;
  } catch {
    return input;
  }
}

function summarizeKorean(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 118)}...`;
}

async function localizeNewsToKorean(items: NewsItem[]): Promise<NewsItem[]> {
  const localized = await Promise.all(
    items.map(async (item) => {
      const koTitle = await translateToKorean(item.title);
      const baseSummary = item.description?.trim() ? item.description : item.title;
      const koSummary = await translateToKorean(baseSummary);
      return {
        ...item,
        title: summarizeKorean(koTitle),
        description: summarizeKorean(koSummary)
      };
    })
  );
  return localized;
}
