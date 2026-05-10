export type FearGreedData = {
  value: number;
  label: string;
  updatedAt: string;
};

export async function fetchFearGreed(): Promise<FearGreedData | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{ value: string; value_classification: string; timestamp: string }>;
    };
    const item = json.data?.[0];
    if (!item) return null;
    return {
      value: Number(item.value),
      label: item.value_classification,
      updatedAt: new Date(Number(item.timestamp) * 1000).toISOString()
    };
  } catch {
    return null;
  }
}
