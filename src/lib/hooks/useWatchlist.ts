"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dashboard-watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWatchlist(JSON.parse(saved) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (symbol: string) => watchlist.includes(symbol),
    [watchlist]
  );

  return { watchlist, toggle, isWatched };
}
