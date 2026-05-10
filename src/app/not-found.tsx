import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="surface w-full max-w-md rounded-2xl border p-8 text-center shadow-[0_8px_30px_rgba(3,10,24,0.35)]">
        <p className="mb-2 text-5xl font-bold text-blue-400">404</p>
        <h1 className="mb-2 text-lg font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="text-muted mb-6 text-sm">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-blue-500/20 px-6 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/30"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  );
}
