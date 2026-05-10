import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://economic-ai-dashboard.vercel.app";

const STOCKS = [
  "005930", "000660", "NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "GOOGL",
  "META", "TSMC", "005380", "000270", "035420", "051910"
];

const CRYPTOS = [
  "BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "AVAX", "DOT", "MATIC"
];

const FX_PAIRS = ["USDKRW", "EURKRW", "JPYKRW", "GBPKRW", "CNYKRW"];

const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const stockUrls: MetadataRoute.Sitemap = STOCKS.map((symbol) => ({
    url: `${BASE_URL}/stocks/${symbol}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8
  }));

  const cryptoUrls: MetadataRoute.Sitemap = CRYPTOS.map((symbol) => ({
    url: `${BASE_URL}/crypto/${symbol}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8
  }));

  const fxUrls: MetadataRoute.Sitemap = FX_PAIRS.map((pair) => ({
    url: `${BASE_URL}/fx/${pair}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "always",
      priority: 1.0
    },
    ...stockUrls,
    ...cryptoUrls,
    ...fxUrls
  ];
}
