"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiImpactCard } from "@/components/dashboard/AiImpactCard";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { usePriceAlerts } from "@/lib/hooks/usePriceAlerts";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { AiImpact, CandlePoint, MarketQuote, NewsItem } from "@/lib/types/domain";
import { FearGreedData } from "@/lib/api-clients/feargreed";

type Props = {
  initialQuotes: MarketQuote[];
  initialNews: NewsItem[];
  initialImpacts: AiImpact[];
  initialFearGreed: FearGreedData | null;
};

type SuggestionTab = "stock" | "news";
type Currency = "KRW" | "USD";
type ChartInterval = "1m" | "3m" | "5m" | "15m" | "30m" | "60m";

const nameMap: Record<string, string> = {
  "005930": "삼성전자",
  "000660": "SK하이닉스",
  NVDA: "NVIDIA",
  BTCUSDT: "Bitcoin",
  ETHUSDT: "Ethereum",
  USDKRW: "USD/KRW"
};

const isKrwAsset = (symbol: string) =>
  symbol === "005930" || symbol === "000660" || symbol.includes("KRW");

function formatPrice(symbol: string, value: number, currency: Currency, usdkrw: number) {
  const baseIsKrw = isKrwAsset(symbol);
  const converted =
    currency === "KRW"
      ? baseIsKrw
        ? value
        : value * usdkrw
      : baseIsKrw
        ? value / Math.max(usdkrw, 1)
        : value;

  if (currency === "KRW") {
    return `₩${Math.round(converted).toLocaleString("ko-KR")}`;
  }
  return `$${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatVolume(vol: number) {
  return Math.round(vol).toLocaleString("ko-KR");
}

export function DashboardClient({ initialQuotes, initialNews, initialImpacts }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [news, setNews] = useState(initialNews);
  const [impacts, setImpacts] = useState(initialImpacts);
  const [query, setQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [selectedRange, setSelectedRange] = useState<"1d" | "1w" | "1m" | "1y">("1m");
  const [selectedInterval, setSelectedInterval] = useState<ChartInterval>("5m");
  const [chartPoints, setChartPoints] = useState<CandlePoint[]>([]);
  const [selectedNewsId, setSelectedNewsId] = useState<string>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionTab, setSuggestionTab] = useState<SuggestionTab>("stock");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [currency, setCurrency] = useState<Currency>("KRW");
  const [marketSource, setMarketSource] = useState<string>("external");
  const [newsSource, setNewsSource] = useState<string>("external");
  const [chartSource, setChartSource] = useState<string>("external");
  const [isPageVisible, setIsPageVisible] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);
  const { watchlist } = useWatchlist();
  const { alerts, addAlert, removeAlert, checkAlerts } = usePriceAlerts();

  const usdkrw = useMemo(
    () => quotes.find((q) => q.symbol === "USDKRW")?.price ?? 1380,
    [quotes]
  );

  const mergeChartPoints = useCallback((prev: CandlePoint[], next: CandlePoint[]) => {
    if (!next.length) return prev;
    const map = new Map<string, CandlePoint>();
    for (const p of prev) map.set(p.ts, p);
    for (const p of next) map.set(p.ts, p);
    return Array.from(map.values()).sort((a, b) => +new Date(a.ts) - +new Date(b.ts));
  }, []);

  // ─── 데이터 로드 ────────────────────────────────────────────────
  const loadMainData = useCallback(async () => {
    const symbols = "005930,000660,NVDA,BTCUSDT,ETHUSDT,USDKRW";
    const [marketRes, newsRes] = await Promise.all([
      fetch(`/api/market?symbols=${symbols}`, { cache: "no-store" }),
      fetch("/api/news?limit=20", { cache: "no-store" })
    ]);
    if (marketRes.ok) {
      const marketJson = (await marketRes.json()) as { data?: MarketQuote[]; meta?: { source?: string } };
      if (marketJson.data?.length) {
        checkAlerts(marketJson.data);
        setQuotes(marketJson.data);
      }
      setMarketSource(marketJson.meta?.source ?? "external");
    }
    if (newsRes.ok) {
      const newsJson = (await newsRes.json()) as { data?: NewsItem[]; meta?: { source?: string } };
      if (newsJson.data?.length) setNews(newsJson.data);
      setNewsSource(newsJson.meta?.source ?? "external");
    }
  }, [checkAlerts]);

  const loadHistory = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setIsChartLoading(true);
    try {
      const res = await fetch(
        `/api/market/history?symbol=${selectedSymbol}&interval=${selectedInterval}&range=${selectedRange}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const json = (await res.json()) as { data?: CandlePoint[]; meta?: { source?: string } };
      const incoming = json.data ?? [];
      setChartSource(json.meta?.source ?? "external");
      if (silent) {
        setChartPoints((prev) => mergeChartPoints(prev, incoming));
      } else {
        setChartPoints(incoming);
      }
    } finally {
      if (!silent) setIsChartLoading(false);
    }
  }, [mergeChartPoints, selectedInterval, selectedRange, selectedSymbol]);

  const handleSelectNews = useCallback(async (item: NewsItem) => {
    setSelectedNewsId(item.id);
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: item.id, title: item.title, source: item.source })
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data?: { result?: AiImpact } };
      const result = json.data?.result;
      if (result) {
        setImpacts((prev) => [result, ...prev.filter((p) => p.newsId !== result.newsId)].slice(0, 6));
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // ─── 테마 ────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-theme");
    const next = saved === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(document.visibilityState === "visible");
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("dashboard-theme", next);
      return next;
    });
  }, []);

  // ─── 폴링 ────────────────────────────────────────────────────────
  useEffect(() => {
    loadMainData();
    const timer = setInterval(loadMainData, isPageVisible ? 5000 : 15000);
    return () => clearInterval(timer);
  }, [isPageVisible, loadMainData]);

  useEffect(() => {
    setChartPoints([]);
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadHistory({ silent: true });
    }, isPageVisible ? 3000 : 12000);
    return () => clearInterval(timer);
  }, [isPageVisible, loadHistory]);

  // ─── 검색 / 자동완성 ─────────────────────────────────────────────
  const stockSuggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    return quotes
      .map((q) => ({ type: "stock" as const, symbol: q.symbol, label: nameMap[q.symbol] ?? q.symbol }))
      .filter((item) =>
        item.symbol.toLowerCase().includes(keyword) || item.label.toLowerCase().includes(keyword)
      )
      .slice(0, 6);
  }, [query, quotes]);

  const newsSuggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    return news
      .filter((item) =>
        item.title.toLowerCase().includes(keyword) || item.source.toLowerCase().includes(keyword)
      )
      .slice(0, 6)
      .map((item) => ({ type: "news" as const, id: item.id, label: item.title, source: item.source }));
  }, [query, news]);

  const activeSuggestions = suggestionTab === "stock" ? stockSuggestions : newsSuggestions;

  const openSuggestions = useCallback((value: string) => {
    setShowSuggestions(Boolean(value.trim()));
    setActiveIndex(-1);
  }, []);

  const closeSuggestions = useCallback(() => {
    setTimeout(() => { setShowSuggestions(false); setActiveIndex(-1); }, 130);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || activeSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, activeSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = activeSuggestions[activeIndex];
      if (item.type === "stock") {
        setSelectedSymbol(item.symbol);
        setQuery(item.label);
      } else {
        const found = news.find((n) => n.id === item.id);
        if (found) handleSelectNews(found);
        setQuery(item.label);
      }
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }, [activeIndex, activeSuggestions, handleSelectNews, news, showSuggestions]);

  // ─── 필터 ────────────────────────────────────────────────────────
  const filteredNews = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return news;
    return news.filter((item) =>
      item.title.toLowerCase().includes(keyword) ||
      item.source.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword)
    );
  }, [news, query]);

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.symbol === selectedSymbol) ?? quotes[0],
    [quotes, selectedSymbol]
  );

  const chartStats = useMemo(() => {
    if (!chartPoints.length) return { high: null, low: null, totalVolume: null };
    return {
      high: Math.max(...chartPoints.map((p) => p.high)),
      low: Math.min(...chartPoints.map((p) => p.low)),
      totalVolume: chartPoints.reduce((a, b) => a + (b.volume ?? 0), 0)
    };
  }, [chartPoints]);

  // ─── 렌더 ────────────────────────────────────────────────────────
  return (
    <main style={{ minWidth: 1100, maxWidth: 1600, margin: "0 auto", padding: "20px 24px" }}>

      {/* ── 헤더 ── */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">Economic AI Dashboard</h1>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <p className="text-muted">실시간 시세 · AI 뉴스 분석</p>
            {(marketSource.includes("mock") || newsSource.includes("mock") || chartSource.includes("mock")) ? (
              <span className="rounded-full border px-2 py-0.5 text-[10px] text-amber-300" style={{ borderColor: "rgba(251,191,36,0.45)" }}>
                일부 데이터 폴백 사용 중
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 원화/달러 토글 */}
          <div className="surface flex rounded-full border text-xs font-bold shadow-sm overflow-hidden">
            <button
              onClick={() => setCurrency("KRW")}
              className={`px-3 py-1.5 transition ${currency === "KRW" ? "bg-blue-500 text-white" : "text-muted"}`}
            >
              ₩
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1.5 transition ${currency === "USD" ? "bg-blue-500 text-white" : "text-muted"}`}
            >
              $
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="surface rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition hover:opacity-80"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* 상단 종목 패널 */}
      <section className="surface mb-4 rounded-2xl border" style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${quotes.length}, minmax(140px, 1fr))`, minWidth: `${quotes.length * 150}px` }}>
          {quotes.map((quote, idx) => {
            const isUp = quote.changePct >= 0;
            const isSelected = selectedSymbol === quote.symbol;
            return (
              <button
                key={quote.symbol}
                onClick={() => setSelectedSymbol(quote.symbol)}
                className="text-left transition hover:bg-blue-500/5"
                style={{
                  padding: "10px 14px",
                  borderRight: idx < quotes.length - 1 ? "1px solid var(--border)" : "none",
                  borderBottom: isSelected ? "2px solid #3b82f6" : "2px solid transparent"
                }}
              >
                <p className="text-xs font-semibold">{nameMap[quote.symbol] ?? quote.symbol}</p>
                <p className="mt-1 text-lg font-bold">{formatPrice(quote.symbol, quote.price, currency, usdkrw)}</p>
                <p className={`text-xs font-semibold ${isUp ? "text-up" : "text-down"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(quote.changePct).toFixed(2)}%
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 검색 ── */}
      <div className="relative mb-4">
        <SearchBar
          value={query}
          onChange={(value) => { setQuery(value); openSuggestions(value); }}
          onFocus={() => openSuggestions(query)}
          onBlur={closeSuggestions}
          onKeyDown={handleKeyDown}
        />
        {showSuggestions && query.trim() ? (
          <div className="surface-overlay absolute left-0 right-0 top-[52px] z-20 rounded-2xl border shadow-lg">
            <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
              {(["stock", "news"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setSuggestionTab(tab); setActiveIndex(-1); }}
                  className={`px-4 py-2 text-xs font-medium transition ${
                    suggestionTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-muted"
                  }`}
                >
                  {tab === "stock" ? `종목 (${stockSuggestions.length})` : `뉴스 (${newsSuggestions.length})`}
                </button>
              ))}
            </div>
            <ul ref={listRef} className="space-y-0.5 p-2">
              {activeSuggestions.length === 0 ? (
                <li className="text-dim px-3 py-3 text-center text-xs">검색 결과 없음</li>
              ) : activeSuggestions.map((item, idx) => (
                <li key={item.type === "stock" ? item.symbol : item.id}>
                  <button
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                      activeIndex === idx ? "bg-blue-500/15 text-blue-500" : "hover:bg-blue-500/10"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (item.type === "stock") { setSelectedSymbol(item.symbol); setQuery(item.label); }
                      else { const found = news.find((n) => n.id === item.id); if (found) handleSelectNews(found); setQuery(item.label); }
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-dim ml-2 shrink-0 text-xs">{item.type === "stock" ? item.symbol : item.source}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* ── 관심종목 배너 ── */}
      {watchlist.length > 0 && (
        <div className="surface mb-4 flex items-center gap-2 overflow-x-auto rounded-2xl border px-4 py-2">
          <span className="text-muted shrink-0 text-xs font-medium">★ 관심종목</span>
          {watchlist.map((sym) => {
            const q = quotes.find((q) => q.symbol === sym);
            if (!q) return null;
            const isUp = q.changePct >= 0;
            return (
              <button key={sym} onClick={() => setSelectedSymbol(sym)}
                className="surface-soft shrink-0 rounded-xl border px-3 py-1.5 text-left transition hover:border-blue-400/40">
                <span className="text-xs font-semibold">{nameMap[sym] ?? sym}</span>
                <span className={`ml-2 text-xs ${isUp ? "text-up" : "text-down"}`}>
                  {isUp ? "+" : ""}{q.changePct.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 메인: 차트(좌) + 뉴스/AI(우) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

        {/* 좌측: 자산 요약 + 차트 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 선택 자산 요약 */}
          <div className="surface rounded-2xl border px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-semibold">{nameMap[selectedQuote?.symbol ?? ""] ?? selectedQuote?.symbol}</span>
                <span className="text-2xl font-bold">
                  {selectedQuote ? formatPrice(selectedQuote.symbol, selectedQuote.price, currency, usdkrw) : "-"}
                </span>
                <span className={`text-sm font-semibold ${selectedQuote && selectedQuote.changePct >= 0 ? "text-up" : "text-down"}`}>
                  {selectedQuote ? `${selectedQuote.changePct >= 0 ? "▲" : "▼"} ${Math.abs(selectedQuote.changePct).toFixed(2)}%` : "-"}
                </span>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="text-center">
                  <p className="text-muted mb-0.5">고가</p>
                  <p className="font-semibold text-up">
                    {chartStats.high !== null ? formatPrice(selectedQuote?.symbol ?? "", chartStats.high, currency, usdkrw) : "-"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted mb-0.5">저가</p>
                  <p className="font-semibold text-down">
                    {chartStats.low !== null ? formatPrice(selectedQuote?.symbol ?? "", chartStats.low, currency, usdkrw) : "-"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted mb-0.5">거래량</p>
                  <p className="font-semibold">
                    {chartStats.totalVolume !== null ? formatVolume(chartStats.totalVolume) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ChartPanel
            points={chartPoints}
            activeRange={selectedRange}
            onChangeRange={setSelectedRange}
            activeInterval={selectedInterval}
            onChangeInterval={setSelectedInterval}
            symbol={selectedQuote?.symbol ?? selectedSymbol}
            currency={currency}
            usdkrw={usdkrw}
            isLoading={isChartLoading}
          />
        </div>

        {/* 우측: 뉴스 + AI */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <NewsFeed items={filteredNews.slice(0, 10)} onSelect={handleSelectNews} selectedNewsId={selectedNewsId} />
          <AiImpactCard items={impacts} isLoading={isAnalyzing} />
          <AlertPanel alerts={alerts} symbols={quotes.map((q) => q.symbol)} onAdd={addAlert} onRemove={removeAlert} />
        </div>
      </div>
    </main>
  );
}
