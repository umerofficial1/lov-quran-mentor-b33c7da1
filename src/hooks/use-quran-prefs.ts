import { useEffect, useState } from "react";

export type QuranScript = "uthmani" | "indopak";

export type QuranPrefs = {
  script: QuranScript;
  fontSize: number; // px for Arabic text
  lineSpacing: number; // line-height multiplier
  showTranslation: boolean;
};

const KEY = "vwm.quran.prefs.v1";
const DEFAULTS: QuranPrefs = {
  script: "uthmani",
  fontSize: 32,
  lineSpacing: 2,
  showTranslation: true,
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
