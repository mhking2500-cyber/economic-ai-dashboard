import { fetchCryptoQuotes } from "@/lib/api-clients/crypto";
import { fetchFxQuotes } from "@/lib/api-clients/fx";
import { fetchMacroNews } from "@/lib/api-clients/news";
import { fetchStockQuotes } from "@/lib/api-clients/stocks";
import { AiImpact, MarketQuote, NewsItem } from "@/lib/types/domain";

const DEFAULT_QUOTES: MarketQuote[] = [
  { symbol: "005930", price: 79400, changePct: 1.24, updatedAt: new Date().toISOString() },
  { symbol: "000660", price: 196800, changePct: -0.53, updatedAt: new Date().toISOString() },
  { symbol: "NVDA", price: 1034.22, changePct: 2.16, updatedAt: new Date().toISOString() },
  { symbol: "BTCUSDT", price: 102340, changePct: 3.04, updatedAt: new Date().toISOString() },
  { symbol: "ETHUSDT", price: 5230, changePct: -0.7, updatedAt: new Date().toISOString() },
  { symbol: "USDKRW", price: 1376.2, changePct: 0.11, updatedAt: new Date().toISOString() }
];

const DEFAULT_NEWS: NewsItem[] = [
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

const DEFAULT_IMPACT: AiImpact[] = [
  {
    newsId: "news_1",
    impactScore: -1,
    sentiment: "NEUTRAL",
    summary: "물가지표 이벤트를 앞둔 경계 심리로 위험자산 변동성이 단기 확대될 가능성이 있습니다.",
    horizon: "SHORT_TERM",
    affectedAssets: [
      { symbol: "USDKRW", relevance: 0.73 },
      { symbol: "BTCUSDT", relevance: 0.52 }
    ],
    confidence: 0.79,
    modelVersion: "gpt-impact-v1"
  },
  {
    newsId: "news_2",
    impactScore: 2,
    sentiment: "POSITIVE",
    summary: "AI 인프라 수요 기대가 반도체 대형주 중심으로 수급 개선에 우호적으로 작용할 수 있습니다.",
    horizon: "MID_TERM",
    affectedAssets: [
      { symbol: "NVDA", relevance: 0.92 },
      { symbol: "000660", relevance: 0.78 }
    ],
    confidence: 0.84,
    modelVersion: "gpt-impact-v1"
  }
];

export async function getDashboardQuotes(): Promise<MarketQuote[]> {
  const [stocks, cryptos, fx] = await Promise.all([
    fetchStockQuotes(["005930", "000660", "NVDA"]),
    fetchCryptoQuotes(["BTCUSDT", "ETHUSDT"]),
    fetchFxQuotes(["USDKRW"])
  ]);

  const fetched = [...stocks, ...cryptos, ...fx];
  const fetchedSymbols = new Set(fetched.map((q) => q.symbol));
  const fallback = DEFAULT_QUOTES.filter((q) => !fetchedSymbols.has(q.symbol));

  return [...fetched, ...fallback];
}

export async function getDashboardNews(): Promise<NewsItem[]> {
  const external = await fetchMacroNews(20);
  return external.length ? external : DEFAULT_NEWS;
}

export function getDefaultAiImpact(): AiImpact[] {
  return DEFAULT_IMPACT;
}
