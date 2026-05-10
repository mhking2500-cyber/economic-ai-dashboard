import { parseAiImpact } from "@/lib/ai/schema";
import { AiImpact } from "@/lib/types/domain";

const AI_ENDPOINT = process.env.AI_IMPACT_ENDPOINT;
const AI_API_KEY = process.env.AI_API_KEY;

export async function analyzeImpactWithExternalAI(params: {
  newsId: string;
  title: string;
  source: string;
  body?: string;
  prompt: string;
}): Promise<AiImpact | null> {
  if (!AI_ENDPOINT || !AI_API_KEY) {
    return null;
  }

  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      prompt: params.prompt,
      newsId: params.newsId,
      title: params.title,
      source: params.source,
      body: params.body
    })
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as { data?: unknown };
  return parseAiImpact(json.data ?? json);
}
