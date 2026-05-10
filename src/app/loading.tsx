export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
      {/* 헤더 스켈레톤 */}
      <div className="mb-5 flex items-end justify-between">
        <div className="space-y-2">
          <div className="skeleton h-5 w-52 rounded-lg" />
          <div className="skeleton h-3 w-36 rounded-md" />
        </div>
        <div className="skeleton h-7 w-24 rounded-full" />
      </div>

      {/* 검색바 스켈레톤 */}
      <div className="skeleton mb-4 h-10 w-full rounded-2xl" />

      {/* 시세 카드 스켈레톤 */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface rounded-2xl border p-4">
            <div className="skeleton mb-2 h-3 w-16 rounded" />
            <div className="skeleton mb-4 h-4 w-24 rounded" />
            <div className="skeleton mb-2 h-6 w-28 rounded" />
            <div className="skeleton h-3 w-14 rounded" />
          </div>
        ))}
      </div>

      {/* 메인 레이아웃 스켈레톤 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="surface skeleton-panel rounded-2xl border p-4">
            <div className="skeleton mb-3 h-4 w-20 rounded" />
            <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="surface-soft rounded-lg border p-2">
                  <div className="skeleton mb-2 h-3 w-10 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="surface rounded-2xl border p-4">
            <div className="skeleton h-72 w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="surface rounded-2xl border p-4">
            <div className="skeleton mb-4 h-4 w-24 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-soft mb-2 rounded-xl border p-3">
                <div className="skeleton mb-2 h-3 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
