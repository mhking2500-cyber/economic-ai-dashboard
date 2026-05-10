import { NextResponse } from "next/server";
import { fetchCryptoQuotes } from "@/lib/api-clients/crypto";
import { fetchFxQuotes } from "@/lib/api-clients/fx";
import { fetchStockQuotes } from "@/lib/api-clients/stocks";
import { MarketQuote } from "@/lib/types/domain";

const mockMarketData: MarketQuote[] = [
  { symbol: "005930", price: 79400, changePct: 1.24, updatedAt: new Date().toISOString() },
  { symbol: "000660", price: 196800, changePct: -0.53, updatedAt: new Date().toISOString() },
  { symbol: "NVDA", price: 1034.22, changePct: 2.16, updatedAt: new Date().toISOString() },
  { symbol: "BTCUSDT", price: 102340, changePct: 3.04, updatedAt: new Date().toISOString() },
  { symbol: "ETHUSDT", price: 5230, changePct: -0.7, updatedAt: new Date().toISOString() },
  { symbol: "USDKRW", price: 1376.2, changePct: 0.11, updatedAt: new Date().toISOString() }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const symbols = symbolsParam?.split(",").map((s) => s.trim().toUpperCase()) ?? [];
  const stockSymbols = symbols.filter((s) => !s.endsWith("USDT") && !s.includes("KRW"));
  const cryptoSymbols = symbols.filter((s) => s.endsWith("USDT") || s === "BTC" || s === "ETH");
  const fxPairs = symbols.filter((s) => s.includes("KRW") || s.includes("USD"));

  const [stockData, cryptoData, fxData] = await Promise.all([
    fetchStockQuotes(stockSymbols),
    fetchCryptoQuotes(cryptoSymbols),
    fetchFxQuotes(fxPairs)
  ]);
  const externalData = [...stockData, ...cryptoData, ...fxData];
  const fetchedSymbols = new Set(externalData.map((d) => d.symbol));

  const fallback = mockMarketData.filter((m) =>
    (symbols.length === 0 || symbols.includes(m.symbol)) && !fetchedSymbols.has(m.symbol)
  );

  const data = [...externalData, ...fallback];

  return NextResponse.json({
    data,
    meta: { count: data.length, source: externalData.length ? "external+mock" : "mock" }
  });
}
