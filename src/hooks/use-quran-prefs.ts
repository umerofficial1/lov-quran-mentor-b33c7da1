import { useEffect, useState } from "react";

export type QuranScript = "uthmani" | "indopak";
export type MushafLayout = "flow" | "15line" | "16line" | "madani";
export type ViewMode = "continuous" | "pageflip";

export type QuranPrefs = {
  script: QuranScript;
  fontSize: number; // px for Arabic text
  lineSpacing: number; // line-height multiplier
  wordSpacing: number; // em; extra breathing between words
  showTranslation: boolean;
  tajweed: boolean;
  layout: MushafLayout;
  viewMode: ViewMode;
  zoom: number; // 0.8 – 1.6
  autoScroll: boolean;
  autoScrollSpeed: number; // px per second
  nightMode: boolean;
  focusMode: boolean;
  brightness: number; // 0.3 – 1
  wordByWord: boolean;
};

const KEY = "vwm.quran.prefs.v2";
const DEFAULTS: QuranPrefs = {
  script: "uthmani",
  fontSize: 32,
  lineSpacing: 2,
  wordSpacing: 0.1,
  showTranslation: true,
  tajweed: false,
  layout: "flow",
  viewMode: "continuous",
  zoom: 1,
  autoScroll: false,
  autoScrollSpeed: 30,
  nightMode: false,
  focusMode: false,
  brightness: 1,
  wordByWord: false,
};

function read(): QuranPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) } as QuranPrefs;
  } catch {
    return DEFAULTS;
  }
}

export function useQuranPrefs() {
  const [prefs, setPrefs] = useState<QuranPrefs>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(read());
    setReady(true);
  }, []);

  const update = (patch: Partial<QuranPrefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return { prefs, update, ready };
}
