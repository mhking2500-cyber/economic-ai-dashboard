import type { Metadata } from "next";

type Props = { params: Promise<{ pair: string }> };

const pairLabel: Record<string, string> = {
  USDKRW: "달러/원",
  EURKRW: "유로/원",
  JPYKRW: "엔/원"
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const upper = pair.toUpperCase();
  const label = pairLabel[upper] ?? upper;
  return {
    title: `${label} (${upper}) 환율 — Economic AI Dashboard`,
    description: `${label} 실시간 환율, 차트, 변동 분석을 한눈에 확인하세요.`,
    openGraph: {
      title: `${label} 환율`,
      description: `${label} (${upper}) 실시간 환율 데이터`,
      type: "website"
    }
  };
}

export default async function FxDetailPage({ params }: Props) {
  const { pair } = await params;
  const upper = pair.toUpperCase();
  const label = pairLabel[upper] ?? upper;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${label} 환율 데이터`,
    description: `${label} (${upper}) 실시간 환율 및 변동 분석`,
    creator: { "@type": "Organization", name: "Economic AI Dashboard" }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-5xl p-6">
        <nav className="text-muted mb-4 text-xs">
          <a href="/" className="hover:underline">홈</a>
          <span className="mx-1">/</span>
          <span>환율</span>
          <span className="mx-1">/</span>
          <span>{upper}</span>
        </nav>
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="text-muted mt-1 text-sm">통화쌍: {upper}</p>
        <p className="text-muted mt-4 text-sm">
          실시간 환율, 차트, AI 분석은{" "}
          <a href="/" className="text-blue-400 hover:underline">대시보드 홈</a>
          에서 확인하세요.
        </p>
      </main>
    </>
  );
}
