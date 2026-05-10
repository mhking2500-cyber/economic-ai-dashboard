import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `뉴스 분석 #${id}`,
    description: "경제·국제 뉴스 원문과 AI 투자 영향도 분석을 확인하세요.",
    openGraph: {
      type: "article",
      title: `경제 뉴스 AI 분석 — Economic AI Dashboard`,
      description: "AI가 분석한 투자 영향도, 관련 자산, 단기·중기 전망을 확인하세요."
    }
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: `경제 뉴스 AI 분석 #${id}`,
    description: "AI가 분석한 투자 영향도 및 관련 자산 정보",
    publisher: {
      "@type": "Organization",
      name: "Economic AI Dashboard"
    },
    datePublished: new Date().toISOString()
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-3xl p-6">
        <nav className="text-muted mb-4 text-xs">
          <a href="/" className="hover:underline">홈</a>
          <span className="mx-1">/</span>
          <span>뉴스</span>
          <span className="mx-1">/</span>
          <span>{id}</span>
        </nav>
        <h1 className="text-xl font-bold">뉴스 상세 분석</h1>
        <p className="text-muted mt-2 text-sm">
          뉴스 원문과 AI 투자 영향도 분석은{" "}
          <a href="/" className="text-blue-400 hover:underline">대시보드 홈</a>
          의 뉴스 피드에서 확인하세요.
        </p>
      </main>
    </>
  );
}
