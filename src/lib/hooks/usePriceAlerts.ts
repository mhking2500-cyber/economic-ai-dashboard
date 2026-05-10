"use client";

import { useCallback, useEffect, useState } from "react";
import { MarketQuote } from "@/lib/types/domain";

export type PriceAlert = {
  id: string;
  symbol: string;
  condition: "above" | "below";
  targetPrice: number;
  triggered: boolean;
  createdAt: string;
};

const STORAGE_KEY = "dashboard-price-alerts";

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAlerts(JSON.parse(saved) as PriceAlert[]);
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: PriceAlert[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAlerts(next);
  }, []);

  const addAlert = useCallback((symbol: string, condition: "above" | "below", targetPrice: number) => {
    const next: PriceAlert = {
      id: `${symbol}_${condition}_${targetPrice}_${Date.now()}`,
      symbol,
      condition,
      targetPrice,
      triggered: false,
      createdAt: new Date().toISOString()
    };
    setAlerts((prev) => {
      const updated = [...prev, next];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const checkAlerts = useCallback((quotes: MarketQuote[]) => {
    setAlerts((prev) => {
      let changed = false;
      const updated = prev.map((alert) => {
        if (alert.triggered) return alert;
        const quote = quotes.find((q) => q.symbol === alert.symbol);
        if (!quote) return alert;
        const hit =
          alert.condition === "above"
            ? quote.price >= alert.targetPrice
            : quote.price <= alert.targetPrice;
        if (!hit) return alert;
        changed = true;
        if (typeof window !== "undefined" && "Notification" in window) {
          const send = () => {
            new Notification(`📊 가격 알림: ${alert.symbol}`, {
              body: `${alert.symbol}이 ${alert.condition === "above" ? "▲" : "▼"} ${alert.targetPrice.toLocaleString()}에 도달했습니다. (현재: ${quote.price.toLocaleString()})`,
              icon: "/favicon.ico"
            });
          };
          if (Notification.permission === "granted") {
            send();
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((p) => { if (p === "granted") send(); });
          }
        }
        return { ...alert, triggered: true };
      });
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return changed ? updated : prev;
    });
  }, []);

  return { alerts, addAlert, removeAlert, checkAlerts, persist };
}
