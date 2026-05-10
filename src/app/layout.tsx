import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap"
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://economic-ai-dashboard.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Economic AI Dashboard — 실시간 주식·코인·환율 & AI 뉴스 분석",
    template: "%s — Economic AI Dashboard"
  },
  description:
    "삼성전자, SK하이닉스, NVIDIA, 비트코인 등 주요 자산의 실시간 시세와 국제 경제 뉴스를 AI가 투자 영향도로 분석해 드립니다.",
  keywords: [
    "주식 시세", "코인 시세", "환율", "경제 뉴스", "AI 투자 분석",
    "삼성전자 주가", "비트코인 시세", "NVIDIA 주가", "실시간 대시보드"
  ],
  authors: [{ name: "Economic AI Dashboard" }],
  creator: "Economic AI Dashboard",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "Economic AI Dashboard",
    title: "Economic AI Dashboard — 실시간 주식·코인·환율 & AI 뉴스 분석",
    description:
      "주요 자산 실시간 시세와 AI가 분석한 경제 뉴스 투자 영향도를 한눈에 확인하세요.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Economic AI Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Economic AI Dashboard",
    description: "실시간 주식·코인·환율 시세 및 AI 경제 뉴스 분석",
    images: ["/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  alternates: {
    canonical: BASE_URL
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className={notoSansKr.className}>{children}</body>
    </html>
  );
}
