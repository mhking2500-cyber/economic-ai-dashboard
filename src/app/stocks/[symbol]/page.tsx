import type { Metadata } from "next";

type Props = { params: Promise<{ symbol: string }> };

const nameMap: Record<string, string> = {
  "005930": "삼성전자",
  "000660": "SK하이닉스",
  NVDA: "NVIDIA",
  AAPL: "Apple",
  TSLA: "Tesla",
  MSFT: "Microsoft"
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const name = nameMap[upper] ?? upper;
  return {
    title: `${name} (${upper}) 주가 — Economic AI Dashboard`,
    description: `${name} 실시간 주가, 차트, AI 투자 영향도 분석을 한눈에 확인하세요.`,
    openGraph: {
      title: `${name} 주가`,
      description: `${name} (${upper}) 실시간 시세 및 AI 분석`,
      type: "website"
    }
  };
}

export default async function StockDetailPage({ params }: Props) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const name = nameMap[upper] ?? upper;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${name} 주가 데이터`,
    description: `${name} (${upper}) 실시간 주가 및 AI 투자 영향도 분석`,
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
          <span>주식</span>
          <span className="mx-1">/</span>
          <span>{upper}</span>
        </nav>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-muted mt-1 text-sm">티커: {upper}</p>
        <p className="text-muted mt-4 text-sm">
          실시간 시세, 차트, AI 투자 영향도 분석은{" "}
          <a href="/" className="text-blue-400 hover:underline">대시보드 홈</a>
          에서 확인하세요.
        </p>
      </main>
    </>
  );
}
