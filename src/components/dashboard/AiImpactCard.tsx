import { AiImpact } from "@/lib/types/domain";

type AiImpactCardProps = {
  items: AiImpact[];
  isLoading?: boolean;
};

export function AiImpactCard({ items, isLoading = false }: AiImpactCardProps) {
  const sentimentLabel = (s: AiImpact["sentiment"]) =>
    s === "POSITIVE" ? "긍정" : s === "NEGATIVE" ? "부정" : "중립";
  const horizonLabel = (h: AiImpact["horizon"]) =>
    h === "SHORT_TERM" ? "단기" : h === "MID_TERM" ? "중기" : "장기";

  return (
    <section className="surface rounded-2xl border p-4 shadow-[0_8px_30px_rgba(3,10,24,0.35)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">AI 투자 영향도 분석</h2>
        {isLoading ? <span className="text-xs text-blue-300">분석 중...</span> : null}
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.newsId} className="surface-soft rounded-xl border p-3">
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-300">
                영향도 {item.impactScore >= 0 ? `+${item.impactScore}` : item.impactScore}
              </span>
              <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--border)" }}>
                {sentimentLabel(item.sentiment)}
              </span>
              <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--border)" }}>
                {horizonLabel(item.horizon)}
              </span>
              <span className="text-dim">신뢰도 {(item.confidence * 100).toFixed(0)}%</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{item.summary}</p>
            <p className="text-muted mt-1 text-xs">
              관련 자산: {item.affectedAssets.map((asset) => asset.symbol).join(", ")} · 모델 {item.modelVersion}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
