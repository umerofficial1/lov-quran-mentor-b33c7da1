import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "vwm.quran.stats.v1";
const TOTAL_AYAHS = 6236;

export type ReadingStats = {
  versesRead: string[]; // "surah:ayah"
  totalMs: number; // total reading time
  sessions: number;
  lastReadAt: number | null;
};

const DEFAULTS: ReadingStats = {
  versesRead: [],
  totalMs: 0,
  sessions: 0,
  lastReadAt: null,
};

function read(): ReadingStats {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) } as ReadingStats;
  } catch {
    return DEFAULTS;
  }
}

function write(s: ReadingStats) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function useReadingStats() {
  const [stats, setStats] = useState<ReadingStats>(DEFAULTS);
  const readSet = useRef<Set<string>>(new Set());
  const sessionStart = useRef<number>(Date.now());
  const lastFlush = useRef<number>(Date.now());

  useEffect(() => {
    const initial = read();
    readSet.current = new Set(initial.versesRead);
    setStats({ ...initial, sessions: initial.sessions + 1 });
    write({ ...initial, sessions: initial.sessions + 1, lastReadAt: Date.now() });
    sessionStart.current = Date.now();
    lastFlush.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const delta = now - lastFlush.current;
      lastFlush.current = now;
      setStats((s) => {
        const next = {
          ...s,
          totalMs: s.totalMs + delta,
          lastReadAt: now,
          versesRead: Array.from(readSet.current),
        };
        write(next);
        return next;
      });
    };

    const flushInterval = window.setInterval(tick, 15000);
    const onVis = () => {
      if (document.hidden) tick();
      else lastFlush.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", tick);
    return () => {
      tick();
      window.clearInterval(flushInterval);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", tick);
    };
  }, []);

  const markRead = useCallback((key: string) => {
    if (readSet.current.has(key)) return;
    readSet.current.add(key);
  }, []);

  const reset = useCallback(() => {
    readSet.current = new Set();
    const next = { ...DEFAULTS, sessions: 1, lastReadAt: Date.now() };
    setStats(next);
    write(next);
  }, []);

  const uniqueRead = readSet.current.size || stats.versesRead.length;
  const percent = Math.min(100, (uniqueRead / TOTAL_AYAHS) * 100);
  const avgMsPerVerse = uniqueRead > 0 ? stats.totalMs / uniqueRead : 12000;
  const remaining = TOTAL_AYAHS - uniqueRead;
  const estimatedRemainingMs = remaining * avgMsPerVerse;

  return {
    stats,
    markRead,
    reset,
    totalAyahs: TOTAL_AYAHS,
    uniqueRead,
    percent,
    estimatedRemainingMs,
    avgMsPerVerse,
  };
}

export function formatDuration(ms: number) {
  if (!isFinite(ms) || ms <= 0) return "0m";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
