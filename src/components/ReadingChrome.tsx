import { useEffect } from "react";
import type { QuranPrefs } from "@/hooks/use-quran-prefs";
import { formatDuration, useReadingStats } from "@/hooks/use-reading-stats";
import { BookOpenCheck, Clock, Timer } from "lucide-react";

/**
 * Wraps a reader page: applies night mode, brightness overlay, focus mode,
 * auto-scroll, and shows a slim reading-stats strip.
 * Also exposes a markRead callback via render prop for VerseCard onVisible.
 */
export function ReadingChrome({
  prefs,
  children,
}: {
  prefs: QuranPrefs;
  children: (api: { markRead: (key: string) => void; containerClass: string }) => React.ReactNode;
}) {
  const { markRead, uniqueRead, percent, estimatedRemainingMs, stats, totalAyahs } = useReadingStats();

  // Night mode on <html>
  useEffect(() => {
    const html = document.documentElement;
    if (prefs.nightMode) html.classList.add("night-mode");
    else html.classList.remove("night-mode");
    return () => html.classList.remove("night-mode");
  }, [prefs.nightMode]);

  // Focus mode on <body>
  useEffect(() => {
    const body = document.body;
    if (prefs.focusMode) body.classList.add("focus-mode");
    else body.classList.remove("focus-mode");
    return () => body.classList.remove("focus-mode");
  }, [prefs.focusMode]);

  // Auto-scroll
  useEffect(() => {
    if (!prefs.autoScroll) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      window.scrollBy({ top: prefs.autoScrollSpeed * dt, behavior: "auto" });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [prefs.autoScroll, prefs.autoScrollSpeed]);

  const layoutClass =
    prefs.layout === "15line"
      ? "layout-15line"
      : prefs.layout === "16line"
        ? "layout-16line"
        : prefs.layout === "madani"
          ? "layout-madani"
          : "";

  const containerClass = `${layoutClass} ${prefs.viewMode === "pageflip" ? "pageflip" : ""}`.trim();

  const dimOpacity = Math.max(0, Math.min(0.7, 1 - prefs.brightness));

  return (
    <>
      {/* Reading stats strip */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-4">
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <BookOpenCheck className="size-3.5" />
            <span className="font-bold uppercase tracking-widest">Read</span>
            <span className="text-white">{uniqueRead.toLocaleString()} / {totalAyahs.toLocaleString()}</span>
            <span className="text-slate-400">({percent.toFixed(2)}%)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <Clock className="size-3.5" />
            <span className="font-bold uppercase tracking-widest">Time</span>
            <span className="text-white">{formatDuration(stats.totalMs)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Timer className="size-3.5" />
            <span className="font-bold uppercase tracking-widest text-slate-400">Est. remaining</span>
            <span className="text-white">{formatDuration(estimatedRemainingMs)}</span>
          </div>
          <div className="ml-auto min-w-[120px] flex-1 max-w-xs">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {children({ markRead, containerClass })}

      {/* Brightness dimmer overlay */}
      {dimOpacity > 0 && (
        <div className="brightness-dim" style={{ opacity: dimOpacity }} aria-hidden />
      )}
    </>
  );
}
