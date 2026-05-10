import { NextResponse } from "next/server";
import { fetchCryptoHistory } from "@/lib/api-clients/crypto";
import { fetchStockHistory } from "@/lib/api-clients/stocks";
import { CandlePoint } from "@/lib/types/domain";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function generateMockCandles(symbol: string, range: string): CandlePoint[] {
  const cfg: Record<string, { count: number; stepHours: number }> = {
    "1d": { count: 48, stepHours: 0.5 },
    "1w": { count: 42, stepHours: 4 },
    "1m": { count: 30, stepHours: 24 },
    "1y": { count: 52, stepHours: 24 * 7 }
  };
  const { count, stepHours } = cfg[range] ?? cfg["1m"];
  const seed = hashSeed(`${symbol}:${range}`);
  const base = symbol.includes("BTC") ? 100 : symbol.includes("ETH") ? 10 : 220;
  const amp = symbol.includes("BTC") ? 7 : symbol.includes("ETH") ? 9 : 4;

  return Array.from({ length: count }).map((_, i) => {
    const t = i + seed * 0.001;
    const close = base + Math.sin(t * 0.35) * amp + Math.sin(t * 0.12) * amp * 0.45;
    const open = base + Math.sin((t - 1) * 0.35) * amp + Math.sin((t - 1) * 0.12) * amp * 0.45;
    const high = Math.max(open, close) + 0.8 + Math.abs(Math.sin(t * 0.9)) * 0.7;
    const low = Math.min(open, close) - 0.8 - Math.abs(Math.cos(t * 0.85)) * 0.7;
    const volume = Math.round(120000 + Math.abs(Math.sin(t * 0.6)) * 340000);
    return {
      ts: new Date(Date.now() - (count - i) * stepHours * 3600 * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = String(searchParams.get("symbol") ?? "").toUpperCase();
  const interval = String(searchParams.get("interval") ?? "1h");
  const range = String(searchParams.get("range") ?? "1d");

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  try {
    const isCrypto = symbol.endsWith("USDT") || symbol === "BTC" || symbol === "ETH";
    const external = isCrypto
      ? await fetchCryptoHistory(symbol, interval, range)
      : await fetchStockHistory(symbol, interval, range);

    const fresh = generateMockCandles(symbol, range);
    const data = external.length ? external : fresh;

    return NextResponse.json({
      data,
      meta: { symbol, interval, range, source: external.length ? "external" : "mock" }
    });
  } catch {
    const fresh = generateMockCandles(symbol, range);
    return NextResponse.json({ data: fresh, meta: { symbol, interval, range, source: "mock" } });
  }
}
