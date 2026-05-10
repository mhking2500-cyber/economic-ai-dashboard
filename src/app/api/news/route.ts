import { NextResponse } from "next/server";
import { fetchMacroNews } from "@/lib/api-clients/news";
import { NewsItem } from "@/lib/types/domain";

const mockNews: NewsItem[] = [
  {
    id: "news_1",
    title: "미국 소비자물가지수 발표 앞두고 채권 금리 혼조",
    source: "Financial Times",
    publishedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    category: "macro"
  },
  {
    id: "news_2",
    title: "AI 반도체 수요 확대 전망에 글로벌 기술주 동반 상승",
    source: "Bloomberg",
    publishedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    category: "equity"
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = Number(searchParams.get("limit") ?? 30);
  const external = await fetchMacroNews(Number.isNaN(limit) ? 30 : limit);

  const feed = external.length ? external : mockNews;
  const filtered = category ? feed.filter((n) => n.category === category) : feed;
  const data = filtered.slice(0, Number.isNaN(limit) ? 30 : limit);

  return NextResponse.json({
    data,
    meta: { count: data.length, source: external.length ? "external" : "mock" }
  });
}
