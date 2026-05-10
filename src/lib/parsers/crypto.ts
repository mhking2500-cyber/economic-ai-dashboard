import { CandlePoint, MarketQuote } from "@/lib/types/domain";

const symbolToCoinId: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  BTC: "bitcoin",
  ETH: "ethereum"
};

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function toCoinGeckoIds(symbols: string[]): string[] {
  return symbols.map((s) => symbolToCoinId[s.toUpperCase()]).filter(Boolean);
}

export function parseGenericCryptoQuotes(raw: unknown): MarketQuote[] {
  const rows = (raw as { data?: Array<Record<string, unknown>> })?.data ?? [];
  return rows
    .map((row) => ({
      symbol: String(row.symbol ?? "").toUpperCase(),
      price: toNumber(row.price),
      changePct: toNumber(row.changePct),
      updatedAt: String(row.updatedAt ?? new Date().toISOString())
    }))
    .filter((row) => row.symbol);
}

export function parseCoinGeckoSimplePrice(raw: unknown): MarketQuote[] {
  const row = raw as Record<string, Record<string, unknown>>;
  return Object.entries(row).map(([coinId, value]) => {
    const symbol = coinId === "bitcoin" ? "BTCUSDT" : coinId === "ethereum" ? "ETHUSDT" : coinId;
    return {
      symbol,
      price: toNumber(value.usd),
      changePct: toNumber(value.usd_24h_change),
      updatedAt: new Date().toISOString()
    };
  });
}

export function parseGenericCryptoHistory(raw: unknown): CandlePoint[] {
  const rows = (raw as { data?: Array<Record<string, unknown>> })?.data ?? [];
  return rows.map((row) => ({
    ts: String(row.ts ?? new Date().toISOString()),
    open: toNumber(row.open),
    high: toNumber(row.high),
    low: toNumber(row.low),
    close: toNumber(row.close),
    volume: toNumber(row.volume)
  }));
}

export function parseCoinGeckoMarketChart(raw: unknown): CandlePoint[] {
  const row = raw as Record<string, unknown>;
  const prices = Array.isArray(row.prices) ? row.prices : [];
  const volumes = Array.isArray(row.total_volumes) ? row.total_volumes : [];

  return prices
    .map((item, idx) => {
      const pair = Array.isArray(item) ? item : [Date.now(), 0];
      const ts = toNumber(pair[0]);
      const close = toNumber(pair[1]);
      const prevPair = idx > 0 && Array.isArray(prices[idx - 1]) ? (prices[idx - 1] as unknown[]) : pair;
      const open = toNumber(prevPair[1], close);
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      const volPair = Array.isArray(volumes[idx]) ? (volumes[idx] as unknown[]) : [0, 0];
      const volume = toNumber(volPair[1]);

      return {
        ts: new Date(ts).toISOString(),
        open,
        high,
        low,
        close,
        volume
      };
    })
    .filter((candle) => candle.close > 0);
}

export function parseCoinGeckoOhlc(raw: unknown): CandlePoint[] {
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((row) => {
      const item = Array.isArray(row) ? row : [];
      const ts = toNumber(item[0]);
      const open = toNumber(item[1]);
      const high = toNumber(item[2]);
      const low = toNumber(item[3]);
      const close = toNumber(item[4]);
      return {
        ts: new Date(ts).toISOString(),
        open,
        high,
        low,
        close,
        volume: 0
      };
    })
    .filter((candle) => candle.close > 0 && candle.high > 0 && candle.low > 0);
}
