"use client";

import { FearGreedData } from "@/lib/api-clients/feargreed";

type Props = {
  data: FearGreedData | null;
};

function getColor(value: number) {
  if (value <= 25) return { stroke: "#ef4444", text: "text-down", bg: "rgba(239,68,68,0.12)" };
  if (value <= 45) return { stroke: "#f97316", text: "text-orange-400", bg: "rgba(249,115,22,0.12)" };
  if (value <= 55) return { stroke: "#eab308", text: "text-yellow-400", bg: "rgba(234,179,8,0.12)" };
  if (value <= 75) return { stroke: "#22c55e", text: "text-up", bg: "rgba(34,197,94,0.12)" };
  return { stroke: "#16a34a", text: "text-up", bg: "rgba(22,163,74,0.15)" };
}

function getLabelKo(label: string) {
  const map: Record<string, string> = {
    "Extreme Fear": "극단적 공포",
    "Fear": "공포",
    "Neutral": "중립",
    "Greed": "탐욕",
    "Extreme Greed": "극단적 탐욕"
  };
  return map[label] ?? label;
}

export function FearGreedWidget({ data }: Props) {
  const value = data?.value ?? 0;
  const { stroke, text, bg } = getColor(value);

  // 반원 게이지 (SVG)
  const radius = 36;
  const cx = 50;
  const cy = 50;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - value / 100);

  return (
    <section className="surface rounded-2xl border p-4 shadow-[0_8px_30px_rgba(3,10,24,0.35)]">
      <h2 className="mb-3 text-sm font-semibold">공포/탐욕 지수</h2>

      {data ? (
        <div className="flex items-center gap-4">
          {/* 반원 게이지 */}
          <div className="relative shrink-0">
            <svg width="90" height="52" viewBox="0 0 100 56">
              {/* 배경 트랙 */}
              <path
                d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
                fill="none"
                stroke="rgba(148,163,184,0.2)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* 값 트랙 */}
              <path
                d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
                fill="none"
                stroke={stroke}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            {/* 중앙 숫자 */}
            <div className="absolute inset-0 flex items-end justify-center pb-0.5">
              <span className={`text-xl font-bold ${text}`}>{value}</span>
            </div>
          </div>

          {/* 텍스트 */}
          <div>
            <p
              className="inline-block rounded-lg px-2 py-0.5 text-sm font-semibold"
              style={{ background: bg, color: stroke }}
            >
              {getLabelKo(data.label)}
            </p>
            <p className="text-muted mt-2 text-xs">
              0 = 극단적 공포 &nbsp;/&nbsp; 100 = 극단적 탐욕
            </p>
            <p className="text-dim mt-1 text-[10px]">
              업데이트: {new Date(data.updatedAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-muted text-xs">데이터를 불러오는 중입니다...</p>
      )}
    </section>
  );
}
