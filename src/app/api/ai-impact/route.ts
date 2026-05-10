import { NextResponse } from "next/server";
import { analyzeImpactWithExternalAI } from "@/lib/ai/analyzeImpact";
import { buildImpactPrompt } from "@/lib/ai/prompt";
import { AiImpact } from "@/lib/types/domain";

const mockImpact: Record<string, AiImpact> = {
  news_1: {
    newsId: "news_1",
    impactScore: -1,
    sentiment: "NEUTRAL",
    summary: "물가지표 이벤트를 앞둔 경계 심리로 위험자산 변동성이 단기 확대될 가능성이 있습니다.",
    horizon: "SHORT_TERM",
    affectedAssets: [
      { symbol: "USDKRW", relevance: 0.73 },
      { symbol: "BTCUSDT", relevance: 0.52 }
    ],
    confidence: 0.79,
    modelVersion: "gpt-impact-v1"
  },
  news_2: {
    newsId: "news_2",
    impactScore: 2,
    sentiment: "POSITIVE",
    summary: "AI 인프라 수요 기대가 반도체 대형주 중심으로 수급 개선에 우호적으로 작용할 수 있습니다.",
    horizon: "MID_TERM",
    affectedAssets: [
      { symbol: "NVDA", relevance: 0.92 },
      { symbol: "000660", relevance: 0.78 }
    ],
    confidence: 0.84,
    modelVersion: "gpt-impact-v1"
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const newsId = searchParams.get("newsId");

  if (!newsId) {
    return NextResponse.json({ error: "newsId is required" }, { status: 400 });
  }

  const result = mockImpact[newsId];
  if (!result) {
    return NextResponse.json({ error: "analysis not found" }, { status: 404 });
  }

  return NextResponse.json({ data: result, meta: { source: "mock" } });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    newsId?: string;
    title?: string;
    source?: string;
    body?: string;
  };

  if (!body.newsId) {
    return NextResponse.json({ error: "newsId is required" }, { status: 400 });
  }

  const prompt = buildImpactPrompt({
    newsId: body.newsId,
    title: body.title ?? "Untitled",
    source: body.source ?? "Unknown",
    body: body.body
  });

  const analyzed = await analyzeImpactWithExternalAI({
    newsId: body.newsId,
    title: body.title ?? "Untitled",
    source: body.source ?? "Unknown",
    body: body.body,
    prompt
  });

  if (analyzed) {
    return NextResponse.json({
      data: {
        accepted: true,
        status: "completed",
        newsId: body.newsId,
        result: analyzed
      },
      meta: { source: "external-ai" }
    });
  }

  return NextResponse.json({
    data: {
      accepted: true,
      status: "queued",
      newsId: body.newsId
    },
    meta: { source: "mock" }
  });
}
