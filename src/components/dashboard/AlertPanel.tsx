"use client";

import { useState } from "react";
import { PriceAlert } from "@/lib/hooks/usePriceAlerts";

type AlertPanelProps = {
  alerts: PriceAlert[];
  symbols: string[];
  onAdd: (symbol: string, condition: "above" | "below", price: number) => void;
  onRemove: (id: string) => void;
};

export function AlertPanel({ alerts, symbols, onAdd, onRemove }: AlertPanelProps) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState(symbols[0] ?? "");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");

  const handleAdd = () => {
    const parsed = parseFloat(price.replace(/,/g, ""));
    if (!symbol || !parsed || isNaN(parsed)) return;
    onAdd(symbol, condition, parsed);
    setPrice("");
  };

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <section className="surface rounded-2xl border shadow-[0_8px_30px_rgba(3,10,24,0.35)]">
      {/* 헤더 */}
      <button
        className="flex w-full items-center justify-between px-4 py-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">가격 알림</span>
          {activeAlerts.length > 0 && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
              {activeAlerts.length}개 대기
            </span>
          )}
        </div>
        <span className="text-dim text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border)" }}>
          {/* 추가 폼 */}
          <div className="mb-4 space-y-2">
            <p className="text-muted text-xs font-medium">새 알림 추가</p>
            <div className="flex flex-wrap gap-2">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="surface-soft rounded-lg border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: "var(--border)" }}
              >
                {symbols.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as "above" | "below")}
                className="surface-soft rounded-lg border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="above">이상 (▲)</option>
                <option value="below">이하 (▼)</option>
              </select>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="목표 가격"
                className="surface-soft w-28 rounded-lg border px-2 py-1.5 text-xs outline-none placeholder:text-gray-500"
                style={{ borderColor: "var(--border)" }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              />
              <button
                onClick={handleAdd}
                className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/30"
              >
                추가
              </button>
            </div>
          </div>

          {/* 대기 중 알림 */}
          {activeAlerts.length > 0 && (
            <div className="mb-3">
              <p className="text-muted mb-2 text-xs font-medium">대기 중</p>
              <ul className="space-y-1.5">
                {activeAlerts.map((a) => (
                  <li key={a.id} className="surface-soft flex items-center justify-between rounded-xl border px-3 py-2 text-xs" style={{ borderColor: "var(--border)" }}>
                    <span>
                      <span className="font-semibold">{a.symbol}</span>
                      {" "}
                      <span className="text-muted">{a.condition === "above" ? "▲ 이상" : "▼ 이하"}</span>
                      {" "}
                      <span className="font-mono">{a.targetPrice.toLocaleString()}</span>
                    </span>
                    <button onClick={() => onRemove(a.id)} className="text-dim hover:text-down ml-2 transition">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 도달 완료 */}
          {triggeredAlerts.length > 0 && (
            <div>
              <p className="text-muted mb-2 text-xs font-medium">도달 완료</p>
              <ul className="space-y-1.5">
                {triggeredAlerts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl border border-dashed px-3 py-2 text-xs opacity-60" style={{ borderColor: "var(--border)" }}>
                    <span>
                      <span className="font-semibold">{a.symbol}</span>
                      {" "}
                      <span className="text-muted">{a.condition === "above" ? "▲ 이상" : "▼ 이하"}</span>
                      {" "}
                      <span className="font-mono">{a.targetPrice.toLocaleString()}</span>
                    </span>
                    <button onClick={() => onRemove(a.id)} className="text-dim hover:text-down ml-2 transition">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {alerts.length === 0 && (
            <p className="text-dim py-3 text-center text-xs">설정된 알림이 없습니다.</p>
          )}
        </div>
      )}
    </section>
  );
}
