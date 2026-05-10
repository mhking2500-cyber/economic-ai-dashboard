"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="surface w-full max-w-md rounded-2xl border p-8 text-center shadow-[0_8px_30px_rgba(3,10,24,0.35)]">
        <p className="mb-2 text-3xl">⚠️</p>
        <h1 className="mb-2 text-lg font-semibold">오류가 발생했습니다</h1>
        <p className="text-muted mb-6 text-sm">
          데이터를 불러오는 중 문제가 생겼습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>
        {error.digest && (
          <p className="text-dim mb-4 text-xs">오류 코드: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-xl bg-blue-500/20 px-6 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/30"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
