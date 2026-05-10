import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Economic AI Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "72px",
          background: "linear-gradient(135deg, #0b1018 0%, #0f1e35 60%, #0b1018 100%)"
        }}
      >
        {/* 상단 배지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
            background: "rgba(47,128,237,0.18)",
            border: "1px solid rgba(96,165,250,0.3)",
            borderRadius: "999px",
            padding: "6px 16px"
          }}
        >
          <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 600 }}>
            실시간 · AI 분석
          </span>
        </div>

        {/* 제목 */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            marginBottom: "20px",
            letterSpacing: "-1px"
          }}
        >
          Economic AI
          <br />
          Dashboard
        </div>

        {/* 설명 */}
        <div style={{ fontSize: "22px", color: "#94a3b8", marginBottom: "48px" }}>
          주식 · 코인 · 환율 실시간 시세 &amp; AI 투자 영향도 분석
        </div>

        {/* 자산 태그들 */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {["삼성전자", "NVIDIA", "Bitcoin", "Ethereum", "USD/KRW"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                padding: "8px 16px",
                color: "#e2e8f0",
                fontSize: "16px"
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* 하단 우측 포인트 */}
        <div
          style={{
            position: "absolute",
            right: "72px",
            bottom: "72px",
            fontSize: "14px",
            color: "#475569"
          }}
        >
          economic-ai-dashboard.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
