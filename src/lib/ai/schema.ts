import { AiImpact } from "@/lib/types/domain";

function isValidSentiment(value: string): value is AiImpact["sentiment"] {
  return value === "POSITIVE" || value === "NEUTRAL" || value === "NEGATIVE";
}

function isValidHorizon(value: string): value is AiImpact["horizon"] {
  return value === "SHORT_TERM" || value === "MID_TERM" || value === "LONG_TERM";
}

export function parseAiImpact(raw: unknown): AiImpact | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const sentiment = String(row.sentiment ?? "");
  const horizon = String(row.horizon ?? "");
  const affectedAssetsRaw = Array.isArray(row.affectedAssets) ? row.affectedAssets : [];
  const affectedAssets = affectedAssetsRaw
    .map((item) => {
      const entry = item as Record<string, unknown>;
      return {
        symbol: String(entry.symbol ?? ""),
        relevance: Number(entry.relevance ?? 0)
      };
    })
    .filter((item) => item.symbol && item.relevance >= 0 && item.relevance <= 1);

  if (!isValidSentiment(sentiment) || !isValidHorizon(horizon)) {
    return null;
  }

  return {
    newsId: String(row.newsId ?? ""),
    impactScore: Number(row.impactScore ?? 0),
    sentiment,
    summary: String(row.summary ?? ""),
    horizon,
    affectedAssets,
    confidence: Number(row.confidence ?? 0),
    modelVersion: String(row.modelVersion ?? "external-ai-v1")
  };
}
