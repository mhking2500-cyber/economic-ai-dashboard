export function buildImpactPrompt(input: { newsId: string; title: string; source: string; body?: string }) {
  return `
You are a macro-financial analysis assistant.
Analyze the investment impact of this news and return ONLY JSON.

newsId: ${input.newsId}
title: ${input.title}
source: ${input.source}
body: ${input.body ?? ""}

Return schema:
{
  "newsId": "string",
  "impactScore": -5 to 5 integer,
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "summary": "one short Korean sentence",
  "horizon": "SHORT_TERM|MID_TERM|LONG_TERM",
  "affectedAssets": [{"symbol":"string","relevance":0.0 to 1.0}],
  "confidence": 0.0 to 1.0,
  "modelVersion": "string"
}
`;
}
