import { CandlePoint, MarketQuote } from "@/lib/types/domain";

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseGenericStockQuotes(raw: unknown): MarketQuote[] {
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

export function parseFinnhubQuote(symbol: string, raw: unknown): MarketQuote | null {
  const row = raw as Record<string, unknown>;
  const current = toNumber(row.c);
  const prevClose = toNumber(row.pc);
  if (!current) {
    return null;
  }
  const changePct = prevClose ? ((current - prevClose) / prevClose) * 100 : 0;
  return {
    symbol: symbol.toUpperCase(),
    price: current,
    changePct,
    updatedAt: new Date().toISOString()
  };
}

export function parseGenericStockHistory(raw: unknown): CandlePoint[] {
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

export function parseFinnhubHistory(raw: unknown): CandlePoint[] {
  const row = raw as Record<string, unknown>;
  const timestamps = Array.isArray(row.t) ? row.t : [];
  const opens = Array.isArray(row.o) ? row.o : [];
  const highs = Array.isArray(row.h) ? row.h : [];
  const lows = Array.isArray(row.l) ? row.l : [];
  const closes = Array.isArray(row.c) ? row.c : [];
  const volumes = Array.isArray(row.v) ? row.v : [];

  return timestamps.map((ts, idx) => ({
    ts: new Date(toNumber(ts) * 1000).toISOString(),
    open: toNumber(opens[idx]),
    high: toNumber(highs[idx]),
    low: toNumber(lows[idx]),
    close: toNumber(closes[idx]),
    volume: toNumber(volumes[idx])
  }));
}
