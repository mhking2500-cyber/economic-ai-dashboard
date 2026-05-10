import { CandlePoint, MarketQuote } from "@/lib/types/domain";
import {
  parseCoinGeckoOhlc,
  parseCoinGeckoSimplePrice,
  parseGenericCryptoHistory,
  parseGenericCryptoQuotes,
  toCoinGeckoIds
} from "@/lib/parsers/crypto";

const CRYPTO_API_BASE = process.env.CRYPTO_API_BASE_URL;
const CRYPTO_API_KEY = process.env.CRYPTO_API_KEY;
const CRYPTO_PROVIDER = (process.env.CRYPTO_PROVIDER ?? "GENERIC").toUpperCase();

function toBinanceSymbol(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  if (upper === "BTC" || upper === "BTCUSDT") return "BTCUSDT";
  if (upper === "ETH" || upper === "ETHUSDT") return "ETHUSDT";
  return null;
}

async function fetchBinanceHistory(
  symbol: string,
  range: string,
  interval: string
): Promise<CandlePoint[]> {
  const binanceSymbol = toBinanceSymbol(symbol);
  if (!binanceSymbol) return [];

  const rangeMs: Record<string, number> = {
    "1d": 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000
  };
  const intervalMsByBinance: Record<string, number> = {
    "1m": 60 * 1000,
    "3m": 3 * 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000
  };
  const normalized = interval === "60m" ? "1h" : interval;
  const pickedInterval = intervalMsByBinance[normalized] ? normalized : "5m";
  const duration = rangeMs[range] ?? rangeMs["1m"];
  const intervalMs = intervalMsByBinance[pickedInterval];

  const endTime = Date.now();
  const requestedCandles = Math.max(1, Math.ceil(duration / intervalMs));
  // API 부담/응답속도를 위해 최대 캔들 수 제한
  const maxCandles = 1500;
  const candlesToFetch = Math.min(requestedCandles, maxCandles);
  const startTime = endTime - candlesToFetch * intervalMs;
  const limit = Math.min(1000, candlesToFetch);

  const url =
    `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(binanceSymbol)}` +
    `&interval=${pickedInterval}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;
  const response = await fetch(url, { next: { revalidate: 10 } });
  if (!response.ok) return [];
  const json = (await response.json()) as unknown;
  const rows = Array.isArray(json) ? json : [];
  return rows
    .map((row) => {
      const item = Array.isArray(row) ? row : [];
      return {
        ts: new Date(Number(item[0] ?? Date.now())).toISOString(),
        open: Number(item[1] ?? 0),
        high: Number(item[2] ?? 0),
        low: Number(item[3] ?? 0),
        close: Number(item[4] ?? 0),
        volume: Number(item[5] ?? 0)
      };
    })
    .filter((c) => Number.isFinite(c.close) && c.close > 0);
}

export async function fetchCryptoQuotes(symbols: string[]): Promise<MarketQuote[]> {
  if (symbols.length === 0 || !CRYPTO_API_BASE) {
    return [];
  }

  if (CRYPTO_PROVIDER === "COINGECKO") {
    const ids = toCoinGeckoIds(symbols);
    if (ids.length === 0) {
      return [];
    }
    const url =
      `${CRYPTO_API_BASE}/simple/price?ids=${encodeURIComponent(ids.join(","))}` +
      "&vs_currencies=usd&include_24hr_change=true";
    const response = await fetch(url, { next: { revalidate: 10 } });
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as unknown;
    return parseCoinGeckoSimplePrice(json);
  }

  if (!CRYPTO_API_KEY) {
    return [];
  }

  const url = `${CRYPTO_API_BASE}/quotes?symbols=${encodeURIComponent(symbols.join(","))}`;
  const response = await fetch(url, {
    headers: { "X-API-KEY": CRYPTO_API_KEY },
    next: { revalidate: 10 }
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as unknown;
  return parseGenericCryptoQuotes(json);
}

export async function fetchCryptoHistory(
  symbol: string,
  interval: string,
  range: string
): Promise<CandlePoint[]> {
  if (!CRYPTO_API_BASE || !symbol) {
    return [];
  }

  const binance = await fetchBinanceHistory(symbol, range, interval);
  if (binance.length > 0) {
    return binance;
  }

  if (CRYPTO_PROVIDER === "COINGECKO") {
    const ids = toCoinGeckoIds([symbol]);
    const id = ids[0];
    if (!id) {
      return [];
    }
    const days = range === "1d" ? "1" : range === "1w" ? "7" : range === "1y" ? "365" : "30";
    const url = `${CRYPTO_API_BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
    const response = await fetch(url, { next: { revalidate: 20 } });
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as unknown;
    return parseCoinGeckoOhlc(json);
  }

  if (!CRYPTO_API_KEY) {
    return [];
  }

  const url =
    `${CRYPTO_API_BASE}/history?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: { "X-API-KEY": CRYPTO_API_KEY },
    next: { revalidate: 20 }
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as unknown;
  return parseGenericCryptoHistory(json);
}
