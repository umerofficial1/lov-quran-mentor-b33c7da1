import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "vwm-theme";

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.remove("light", "dark");
  el.classList.add(theme);
  el.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let initial: Theme = "dark";
    try {
      const saved = localStorage.getItem(KEY) as Theme | null;
      if (saved === "light" || saved === "dark") initial = saved;
    } catch {
      /* ignore */
    }
    setTheme(initial);
    apply(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  };

  const set = (t: Theme) => {
    setTheme(t);
    apply(t);
    try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  };

  return { theme, toggle, set };
}
