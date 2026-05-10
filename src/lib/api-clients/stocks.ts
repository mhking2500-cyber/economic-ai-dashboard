import { CandlePoint, MarketQuote } from "@/lib/types/domain";
import {
  parseFinnhubHistory,
  parseFinnhubQuote,
  parseGenericStockHistory,
  parseGenericStockQuotes
} from "@/lib/parsers/stocks";

const STOCK_API_BASE = process.env.STOCK_API_BASE_URL;
const STOCK_API_KEY = process.env.STOCK_API_KEY;
const STOCK_PROVIDER = (process.env.STOCK_PROVIDER ?? "GENERIC").toUpperCase();

const KRX_SYMBOL_MAP: Record<string, string> = {
  "005930": "005930.KS",
  "000660": "000660.KS",
  "035720": "035720.KS",
  "005380": "005380.KS",
  "051910": "051910.KS"
};

export async function fetchKrxQuotes(symbols: string[]): Promise<MarketQuote[]> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const yahooSymbol = KRX_SYMBOL_MAP[symbol] ?? `${symbol}.KS`;
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=2d`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 30 }
        });
        if (!res.ok) return null;
        const json = (await res.json()) as {
          chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number } }> };
        };
        const meta = json?.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice ?? 0;
        const prevClose = meta?.chartPreviousClose ?? price;
        if (!price) return null;
        const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
        return { symbol, price, changePct, updatedAt: new Date().toISOString() } satisfies MarketQuote;
      } catch {
        return null;
      }
    })
  );
  return results.filter((r): r is MarketQuote => r !== null && r.price > 0);
}

export async function fetchStockQuotes(symbols: string[]): Promise<MarketQuote[]> {
  if (symbols.length === 0) return [];

  const krxSymbols = symbols.filter((s) => KRX_SYMBOL_MAP[s] || /^\d{6}$/.test(s));
  const globalSymbols = symbols.filter((s) => !krxSymbols.includes(s));

  const krxQuotes = krxSymbols.length > 0 ? await fetchKrxQuotes(krxSymbols) : [];

  if (!STOCK_API_BASE || !STOCK_API_KEY || globalSymbols.length === 0) {
    return krxQuotes;
  }

  if (STOCK_PROVIDER === "FINNHUB") {
    const items = await Promise.all(
      globalSymbols.map(async (symbol) => {
        const url = `${STOCK_API_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${STOCK_API_KEY}`;
        const response = await fetch(url, { next: { revalidate: 10 } });
        if (!response.ok) return null;
        const json = (await response.json()) as unknown;
        return parseFinnhubQuote(symbol, json);
      })
    );
    const globalQuotes = items.filter((item): item is MarketQuote => Boolean(item));
    return [...krxQuotes, ...globalQuotes];
  }

  const url = `${STOCK_API_BASE}/quotes?symbols=${encodeURIComponent(globalSymbols.join(","))}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${STOCK_API_KEY}` },
    next: { revalidate: 10 }
  });

  if (!response.ok) return krxQuotes;

  const json = (await response.json()) as unknown;
  return [...krxQuotes, ...parseGenericStockQuotes(json)];
}

function resampleToDaily(candles: CandlePoint[]): CandlePoint[] {
  const byDay = new Map<string, CandlePoint[]>();
  for (const c of candles) {
    const day = c.ts.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(c);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, cs]) => ({
      ts: day + "T00:00:00.000Z",
      open: cs[0].open,
      high: Math.max(...cs.map((c) => c.high)),
      low: Math.min(...cs.map((c) => c.low)),
      close: cs.at(-1)!.close,
      volume: cs.reduce((s, c) => s + (c.volume ?? 0), 0)
    }));
}

export async function fetchYahooHistory(symbol: string, range: string): Promise<CandlePoint[]> {
  const krxMap: Record<string, string> = {
    "005930": "005930.KS", "000660": "000660.KS"
  };
  const yahooSymbol = krxMap[symbol] ?? symbol;
  const params: Record<string, { interval: string; range: string }> = {
    "1d": { interval: "5m",  range: "1d"  },
    "1w": { interval: "60m", range: "5d"  },
    "1m": { interval: "1d",  range: "1mo" },
    "1y": { interval: "1wk", range: "1y"  }
  };
  const { interval: iv, range: r } = params[range] ?? params["1m"];
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${iv}&range=${r}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: { quote?: Array<{ open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }> };
        }>;
      };
    };
    const result = json?.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0];
    if (!timestamps.length || !q) return [];
    const raw = timestamps.map((ts, i) => ({
      ts: new Date(ts * 1000).toISOString(),
      open: q.open?.[i] ?? 0,
      high: q.high?.[i] ?? 0,
      low: q.low?.[i] ?? 0,
      close: q.close?.[i] ?? 0,
      volume: q.volume?.[i] ?? 0
    })).filter((p) => p.close > 0);

    // 일봉보다 작은 단위이면 일봉으로 묶기
    if (raw.length > 60 && (range === "1m" || range === "1w")) {
      return resampleToDaily(raw);
    }
    return raw;
  } catch {
    return [];
  }
}

export async function fetchStockHistory(
  symbol: string,
  interval: string,
  range: string
): Promise<CandlePoint[]> {
  if (!symbol) return [];

  const yahooData = await fetchYahooHistory(symbol, range);
  if (yahooData.length) return yahooData;

  if (!STOCK_API_BASE || !STOCK_API_KEY) return [];

  if (STOCK_PROVIDER === "FINNHUB") {
    const now = Math.floor(Date.now() / 1000);
    const windowByRange: Record<string, number> = {
      "1d": 24 * 60 * 60,
      "1w": 7 * 24 * 60 * 60,
      "1m": 30 * 24 * 60 * 60,
      "1y": 365 * 24 * 60 * 60
    };
    const from = now - (windowByRange[range] ?? windowByRange["1m"]);
    const resolution = interval === "1d" ? "D" : "60";
    const url =
      `${STOCK_API_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}` +
      `&resolution=${resolution}&from=${from}&to=${now}&token=${STOCK_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 20 } });
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as unknown;
    return parseFinnhubHistory(json);
  }

  const url =
    `${STOCK_API_BASE}/history?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${STOCK_API_KEY}` },
    next: { revalidate: 20 }
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as unknown;
  return parseGenericStockHistory(json);
}
