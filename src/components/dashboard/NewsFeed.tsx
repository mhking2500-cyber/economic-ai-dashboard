"use client";

import { useState } from "react";
import { NewsItem } from "@/lib/types/domain";

const CATEGORIES = [
  { key: "all", label: "전체", help: "모든 뉴스" },
  { key: "macro", label: "매크로", help: "금리/물가/고용/경기" },
  { key: "equity", label: "주식", help: "기업실적/지수/섹터" },
  { key: "crypto", label: "코인", help: "BTC/ETH/가상자산" },
  { key: "geopolitics", label: "지정학", help: "전쟁/제재/외교 리스크" }
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

type NewsFeedProps = {
  items: NewsItem[];
  onSelect?: (item: NewsItem) => void;
  selectedNewsId?: string;
};

export function NewsFeed({ items, onSelect, selectedNewsId }: NewsFeedProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <section className="surface rounded-2xl border shadow-[0_8px_30px_rgba(3,10,24,0.35)]">
      {/* 헤더 */}
      <div className="border-b px-4 pt-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="mb-3 text-sm font-semibold">실시간 국제/경제 뉴스</h2>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              title={cat.help}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategory === cat.key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-muted hover:text-blue-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 뉴스 목록 */}
      <ul className="space-y-2 p-3">
        {filtered.length === 0 ? (
          <li className="text-muted py-6 text-center text-xs">해당 카테고리 뉴스가 없습니다.</li>
        ) : (
          filtered.map((article) => {
            const expanded = expandedId === article.id;
            return (
              <li
                key={article.id}
                className={`rounded-xl border p-3 transition ${
                  selectedNewsId === article.id
                    ? "border-blue-400/80 bg-blue-500/10"
                    : "surface-soft hover:border-blue-400/40"
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => {
                    onSelect?.(article);
                    setExpandedId((prev) => (prev === article.id ? null : article.id));
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed">{article.title}</p>
                    <span className="text-dim shrink-0 text-xs">{expanded ? "▲" : "▼"}</span>
                  </div>
                  <div className="text-muted mt-1 flex items-center justify-between text-xs">
                    <span>{article.source} · {new Date(article.publishedAt).toLocaleString("ko-KR")}</span>
                    <span className="ml-2 rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: "var(--border)" }}>
                      {CATEGORIES.find((c) => c.key === article.category)?.label ?? article.category}
                    </span>
                  </div>
                </button>

                {expanded ? (
                  <div className="mt-3 rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border)" }}>
                    <p className="text-blue-400">
                      {CATEGORIES.find((c) => c.key === article.category)?.label ?? article.category}
                      {" · "}
                      {CATEGORIES.find((c) => c.key === article.category)?.help ?? "뉴스 카테고리"}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      {article.description?.trim() || "기사 요약 정보가 없어서 제목 기반으로 표시합니다."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelect?.(article)}
                        className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs text-blue-300 transition hover:bg-blue-500/30"
                      >
                        AI 영향도 분석
                      </button>
                      {article.url ? (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-full break-all rounded-lg border px-2.5 py-1 text-xs text-blue-300 transition hover:border-blue-400/60"
                          style={{ borderColor: "var(--border)" }}
                        >
                          출처 사이트 이동
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
