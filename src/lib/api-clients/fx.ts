import { MarketQuote } from "@/lib/types/domain";
import { parseExchangeRateHostLatest, parseGenericFxQuotes } from "@/lib/parsers/fx";

const FX_API_BASE = process.env.FX_API_BASE_URL;
const FX_API_KEY = process.env.FX_API_KEY;
const FX_PROVIDER = (process.env.FX_PROVIDER ?? "GENERIC").toUpperCase();

export async function fetchFxQuotes(pairs: string[]): Promise<MarketQuote[]> {
  if (!FX_API_BASE || pairs.length === 0) {
    return [];
  }

  if (FX_PROVIDER === "EXCHANGERATE_HOST") {
    const groupedByBase = pairs.reduce<Record<string, string[]>>((acc, pair) => {
      const normalized = pair.toUpperCase();
      const base = normalized.slice(0, 3);
      const quote = normalized.slice(3);
      if (!base || !quote) {
        return acc;
      }
      if (!acc[base]) {
        acc[base] = [];
      }
      acc[base].push(quote);
      return acc;
    }, {});

    const batch = await Promise.all(
      Object.entries(groupedByBase).map(async ([base, quotes]) => {
        const url = `${FX_API_BASE}/latest?base=${base}&symbols=${quotes.join(",")}`;
        const response = await fetch(url, { next: { revalidate: 10 } });
        if (!response.ok) {
          return [] as MarketQuote[];
        }
        const json = (await response.json()) as unknown;
        return parseExchangeRateHostLatest(base, json);
      })
    );

    return batch.flat();
  }

  if (!FX_API_KEY) {
    return [];
  }

  const url = `${FX_API_BASE}/quotes?pairs=${encodeURIComponent(pairs.join(","))}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${FX_API_KEY}` },
    next: { revalidate: 10 }
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as unknown;
  return parseGenericFxQuotes(json);
}
