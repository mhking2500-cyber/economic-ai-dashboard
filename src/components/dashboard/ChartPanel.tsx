"use client";

import { PointerEvent, WheelEvent, useCallback, useMemo, useRef, useState } from "react";
import { CandlePoint } from "@/lib/types/domain";

type Props = {
  points: CandlePoint[];
  activeRange: "1d" | "1w" | "1m" | "1y";
  onChangeRange: (range: "1d" | "1w" | "1m" | "1y") => void;
  activeInterval: "1m" | "3m" | "5m" | "15m" | "30m" | "60m";
  onChangeInterval: (interval: "1m" | "3m" | "5m" | "15m" | "30m" | "60m") => void;
  symbol: string;
  currency: "KRW" | "USD";
  usdkrw: number;
  isLoading?: boolean;
};

const RANGES = ["1d", "1w", "1m", "1y"] as const;
const INTERVALS = ["1m", "3m", "5m", "15m", "30m", "60m"] as const;
const CHART_H = 260;
const VOL_H = 48;
const PAD_TOP = 12;
const PAD_BTM = 4;
const PRICE_H = CHART_H - PAD_TOP - PAD_BTM;

function fmt(n: number) {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function isKrwAsset(symbol: string) {
  return symbol === "005930" || symbol === "000660" || symbol.includes("KRW");
}

function fmtDate(ts: string, range: string) {
  const d = new Date(ts);
  if (range === "1d") return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  if (range === "1y") return d.toLocaleDateString("ko-KR", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function ChartPanel({
  points,
  activeRange,
  onChangeRange,
  activeInterval,
  onChangeInterval,
  symbol,
  currency,
  usdkrw,
  isLoading
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const [yPanPx, setYPanPx] = useState(0);
  const [dragState, setDragState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    startOffset: number;
    startYPan: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startOffset: 0,
    startYPan: 0
  });

  const candles = useMemo(() => {
    const rangeMs: Record<string, number> = {
      "1d": 24 * 60 * 60 * 1000,
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000
    };
    const intervalMs: Record<string, number> = {
      "1m": 60 * 1000,
      "3m": 3 * 60 * 1000,
      "5m": 5 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      "30m": 30 * 60 * 1000,
      "60m": 60 * 60 * 1000
    };
    const requested = Math.ceil((rangeMs[activeRange] ?? rangeMs["1d"]) / (intervalMs[activeInterval] ?? intervalMs["5m"]));
    const limit = Math.min(Math.max(requested, 60), 1500);
    return points.slice(-limit);
  }, [activeInterval, activeRange, points]);

  const latest = candles.at(-1)?.close ?? 0;
  const prev = candles.at(-2)?.close ?? latest;
  const diffPct = prev ? ((latest - prev) / prev) * 100 : 0;
  const isUp = diffPct >= 0;

  const baseWindowByRange: Record<string, number> = {
    "1d": 180,
    "1w": 180,
    "1m": 140,
    "1y": 120
  };
  const baseVisible = Math.min(candles.length, baseWindowByRange[activeRange] ?? 140);
  const visibleCount = Math.max(Math.round(baseVisible / zoom), 5);
  const maxOffset = Math.max(candles.length - visibleCount, 0);
  const clampedOffset = Math.min(offset, maxOffset);
  const visibleCandles = candles.slice(
    Math.max(candles.length - visibleCount - clampedOffset, 0),
    candles.length - clampedOffset || undefined
  );

  const { visMinPrice, visPriceRange, visMaxVol } = useMemo(() => {
    if (!visibleCandles.length) return { visMinPrice: 0, visPriceRange: 1, visMaxVol: 1 };
    const lows = visibleCandles.map((p) => p.low);
    const highs = visibleCandles.map((p) => p.high);
    const vols = visibleCandles.map((p) => p.volume ?? 0);
    const minP = Math.min(...lows);
    const maxP = Math.max(...highs);
    const pad = (maxP - minP) * 0.06;
    return {
      visMinPrice: minP - pad,
      visPriceRange: maxP - minP + pad * 2 || 1,
      visMaxVol: Math.max(...vols, 1)
    };
  }, [visibleCandles]);

  const toVisY = (price: number) =>
    PAD_TOP + PRICE_H - ((price - visMinPrice) / visPriceRange) * PRICE_H + yPanPx;
  const latestYPercent = ((toVisY(latest) / (CHART_H + VOL_H)) * 100).toFixed(2);

  const hoverPoint = hoverIdx !== null ? visibleCandles[hoverIdx] : visibleCandles.at(-1);
  const toDisplayPrice = (raw: number) => {
    const baseIsKrw = isKrwAsset(symbol);
    const converted =
      currency === "KRW"
        ? baseIsKrw
          ? raw
          : raw * usdkrw
        : baseIsKrw
          ? raw / Math.max(usdkrw, 1)
          : raw;
    return converted;
  };
  const formatDisplayPrice = (raw: number) => {
    const n = toDisplayPrice(raw);
    if (currency === "KRW") return `₩${Math.round(n).toLocaleString("ko-KR")}`;
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleWheelZoom = useCallback((e: WheelEvent<HTMLDivElement>) => {
    if (!candles.length) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / Math.max(rect.width, 1), 0), 1);
    const oldZoom = zoom;
    const oldVisible = Math.max(Math.round(candles.length / oldZoom), 5);
    const oldMaxOffset = Math.max(candles.length - oldVisible, 0);
    const oldOffset = Math.min(offset, oldMaxOffset);
    const oldStart = Math.max(candles.length - oldVisible - oldOffset, 0);
    const anchorIndex = oldStart + ratio * Math.max(oldVisible - 1, 0);

    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nextZoom = Math.min(8, Math.max(1, oldZoom * zoomFactor));
    const newVisible = Math.max(Math.round(candles.length / nextZoom), 5);
    const newStartRaw = anchorIndex - ratio * Math.max(newVisible - 1, 0);
    const newStart = Math.min(
      Math.max(0, Math.round(newStartRaw)),
      Math.max(candles.length - newVisible, 0)
    );
    const newOffset = Math.max(candles.length - newVisible - newStart, 0);

    setZoom(nextZoom);
    setOffset(newOffset);
  }, [candles.length, offset, zoom]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setDragState({
      active: true,
      startX: clientX,
      startY: clientY,
      startOffset: clampedOffset,
      startYPan: yPanPx
    });
  }, [clampedOffset, yPanPx]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.active || !chartAreaRef.current) return;

    const rect = chartAreaRef.current.getBoundingClientRect();
    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;

    const candlesPerPx = visibleCount / Math.max(rect.width, 1);
    const deltaCandles = dx * candlesPerPx * 2.2;
    const nextOffset = Math.min(Math.max(dragState.startOffset + deltaCandles, 0), maxOffset);
    setOffset(nextOffset);

    const nextYPan = Math.min(Math.max(dragState.startYPan + dy, -120), 120);
    setYPanPx(nextYPan);
  }, [dragState, maxOffset, visibleCount]);

  const handleDragEnd = useCallback(() => {
    setDragState((prev) => ({ ...prev, active: false }));
  }, []);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragState.active) return;
    e.preventDefault();
    handleDragMove(e.clientX, e.clientY);
  }, [dragState.active, handleDragMove]);

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    handleDragEnd();
  }, [handleDragEnd]);

  if (!points.length) {
    return (
      <section className="surface rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold">시장 차트</h2>
            <p className="text-muted text-xs mt-0.5">{isLoading ? "로딩 중..." : "데이터 없음"}</p>
          </div>
          <div className="flex items-center gap-2">
            <MinuteSelector active={activeInterval} onChange={onChangeInterval} />
            <RangeButtons active={activeRange} onChange={onChangeRange} />
          </div>
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl surface-soft border">
          <div className="flex flex-col items-center gap-2">
            {isLoading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
            <p className="text-muted text-xs">{isLoading ? "차트 데이터를 불러오는 중..." : "차트 데이터 없음"}</p>
          </div>
        </div>
      </section>
    );
  }

  const candleWidth = Math.max(100 / visibleCandles.length - 0.4, 0.6);

  return (
    <section className="surface rounded-2xl border p-4">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">시장 차트</h2>
          <span className={`text-xs font-medium ${isUp ? "text-up" : "text-down"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(diffPct).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 줌 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setZoom((z) => Math.min(z * 1.5, 8)); setOffset(0); }}
              className="surface-soft border rounded px-2 py-0.5 text-xs font-bold hover:border-blue-400/60 transition"
              title="확대"
            >+</button>
            <button
              onClick={() => { setZoom((z) => Math.max(z / 1.5, 1)); setOffset(0); }}
              className="surface-soft border rounded px-2 py-0.5 text-xs font-bold hover:border-blue-400/60 transition"
              title="축소"
            >−</button>
            {zoom > 1 && (
              <>
                <button
                  onClick={() => setOffset((o) => Math.min(o + Math.ceil(visibleCount / 4), maxOffset))}
                  className="surface-soft border rounded px-2 py-0.5 text-xs font-bold hover:border-blue-400/60 transition"
                >◀</button>
                <button
                  onClick={() => setOffset((o) => Math.max(o - Math.ceil(visibleCount / 4), 0))}
                  className="surface-soft border rounded px-2 py-0.5 text-xs font-bold hover:border-blue-400/60 transition"
                >▶</button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MinuteSelector active={activeInterval} onChange={onChangeInterval} />
            <RangeButtons active={activeRange} onChange={(r) => { onChangeRange(r); setZoom(1); setOffset(0); }} />
          </div>
        </div>
      </div>

      {/* 호버 정보 */}
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="text-muted">
          종가 <span className="font-semibold" style={{ color: "var(--text-main)" }}>
            {hoverPoint ? formatDisplayPrice(hoverPoint.close) : "-"}
          </span>
        </span>
        <span className="text-muted">
          고 <span className="font-semibold text-up">{hoverPoint ? formatDisplayPrice(hoverPoint.high) : "-"}</span>
        </span>
        <span className="text-muted">
          저 <span className="font-semibold text-down">{hoverPoint ? formatDisplayPrice(hoverPoint.low) : "-"}</span>
        </span>
        <span className="text-muted">
          거래량 <span className="font-semibold" style={{ color: "var(--text-main)" }}>
            {hoverPoint?.volume ? fmt(hoverPoint.volume) : "-"}
          </span>
        </span>
        {hoverPoint && (
          <span className="text-dim ml-auto">{fmtDate(hoverPoint.ts, activeRange)}</span>
        )}
      </div>

      {/* SVG 차트 */}
      <div
        ref={chartAreaRef}
        className="surface-soft relative rounded-xl border overflow-hidden"
        onWheel={handleWheelZoom}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={() => setHoverIdx(null)}
        title="마우스 휠/트랙패드로 확대·축소"
        style={{ cursor: dragState.active ? "grabbing" : "grab", userSelect: "none" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 100 ${CHART_H + VOL_H}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: CHART_H + VOL_H }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* 가격 격자선 */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD_TOP + PRICE_H * (1 - t);
            return (
              <line
                key={t}
                x1="0" y1={y} x2="100" y2={y}
                stroke="rgba(148,163,184,0.08)"
                strokeWidth="0.3"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* 현재가 점선 */}
          {latest > 0 && (
            <>
              <line
                x1="0" y1={toVisY(latest)} x2="100" y2={toVisY(latest)}
                stroke="rgba(148,163,184,0.45)"
                strokeWidth="0.35"
                strokeDasharray="1.2 0.8"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}

          {/* 캔들스틱 */}
          {visibleCandles.map((p, i) => {
            const n = visibleCandles.length;
            const cx = (i / n) * 100 + candleWidth / 2;
            const isGreen = p.close >= p.open;
            const color = isGreen
              ? "var(--color-up, #ef4444)"
              : "var(--color-down, #60a5fa)";
            const bodyTop = toVisY(Math.max(p.open, p.close));
            const bodyBot = toVisY(Math.min(p.open, p.close));
            const bodyH = Math.max(bodyBot - bodyTop, 0.5);
            const wickTop = toVisY(p.high);
            const wickBot = toVisY(p.low);
            const volH = ((p.volume ?? 0) / visMaxVol) * (VOL_H - 4);
            const isHovered = hoverIdx === i;

            return (
              <g key={i}>
                {/* 거래량 바 */}
                <rect
                  x={(i / n) * 100}
                  y={CHART_H + VOL_H - volH - 2}
                  width={candleWidth * 0.9}
                  height={volH}
                  fill={color}
                  opacity={isHovered ? 0.6 : 0.25}
                />
                {/* 윗 꼬리 */}
                <line x1={cx} y1={wickTop} x2={cx} y2={bodyTop} stroke={color} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                {/* 아랫 꼬리 */}
                <line x1={cx} y1={bodyBot} x2={cx} y2={wickBot} stroke={color} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                {/* 캔들 몸통 */}
                <rect x={(i / n) * 100 + candleWidth * 0.05} y={bodyTop} width={candleWidth * 0.9} height={bodyH} fill={color} opacity={isHovered ? 1 : 0.85} rx="0.1" />
                {/* 호버 영역 */}
                <rect x={(i / n) * 100} y={0} width={100 / n} height={CHART_H + VOL_H} fill="transparent" onMouseEnter={() => setHoverIdx(i)} />

                {/* 호버 세로선 */}
                {isHovered && (
                  <line
                    x1={cx} y1={0}
                    x2={cx} y2={CHART_H + VOL_H}
                    stroke="rgba(148,163,184,0.3)"
                    strokeWidth="0.3"
                    strokeDasharray="1 0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {latest > 0 && (
          <div
            className="pointer-events-none absolute right-1.5 z-10 -translate-y-1/2 rounded-md px-2 py-0.5 text-[10px] font-semibold text-white shadow"
            style={{
              top: `${latestYPercent}%`,
              background: isUp ? "var(--color-up)" : "var(--color-down)"
            }}
          >
            {formatDisplayPrice(latest)}
          </div>
        )}

        {/* 날짜 축 */}
        <div className="flex justify-between px-2 pb-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
          {[0, Math.floor(visibleCandles.length / 4), Math.floor(visibleCandles.length / 2), Math.floor(visibleCandles.length * 3 / 4), visibleCandles.length - 1]
            .filter((i) => visibleCandles[i])
            .map((i) => (
              <span key={i}>{fmtDate(visibleCandles[i].ts, activeRange)}</span>
            ))}
        </div>
      </div>
    </section>
  );
}

function MinuteSelector({
  active,
  onChange
}: {
  active: string;
  onChange: (i: "1m" | "3m" | "5m" | "15m" | "30m" | "60m") => void;
}) {
  return (
    <div className="surface-soft border rounded-lg px-1.5 py-0.5">
      <select
        value={active}
        onChange={(e) => onChange(e.target.value as "1m" | "3m" | "5m" | "15m" | "30m" | "60m")}
        className="bg-transparent text-xs font-semibold outline-none"
      >
        {INTERVALS.map((i) => (
          <option key={i} value={i} className="bg-slate-900 text-slate-100">
            {i}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeButtons({ active, onChange }: { active: string; onChange: (r: "1d" | "1w" | "1m" | "1y") => void }) {
  return (
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition ${
            active === r
              ? "bg-blue-500 text-white"
              : "surface-soft border text-muted hover:text-blue-500"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
