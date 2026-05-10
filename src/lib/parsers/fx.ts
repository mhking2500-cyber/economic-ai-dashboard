import { MarketQuote } from "@/lib/types/domain";

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseGenericFxQuotes(raw: unknown): MarketQuote[] {
  const rows = (raw as { data?: Array<Record<string, unknown>> })?.data ?? [];
  return rows
    .map((row) => ({
      symbol: String(row.pair ?? "").toUpperCase(),
      price: toNumber(row.rate),
      changePct: toNumber(row.changePct),
      updatedAt: String(row.updatedAt ?? new Date().toISOString())
    }))
    .filter((row) => row.symbol);
}

export function parseExchangeRateHostLatest(base: string, raw: unknown): MarketQuote[] {
  const row = raw as { rates?: Record<string, unknown> };
  const rates = row.rates ?? {};
  return Object.entries(rates).map(([quote, rate]) => ({
    symbol: `${base}${quote}`.toUpperCase(),
    price: toNumber(rate),
    changePct: 0,
    updatedAt: new Date().toISOString()
  }));
}
