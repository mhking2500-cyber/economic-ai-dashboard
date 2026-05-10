export type MarketQuote = {
  symbol: string;
  price: number;
  changePct: number;
  updatedAt: string;
};

export type CandlePoint = {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  category: string;
  url?: string;
  description?: string;
};

export type AiImpact = {
  newsId: string;
  impactScore: number;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  summary: string;
  horizon: "SHORT_TERM" | "MID_TERM" | "LONG_TERM";
  affectedAssets: Array<{ symbol: string; relevance: number }>;
  confidence: number;
  modelVersion: string;
};
