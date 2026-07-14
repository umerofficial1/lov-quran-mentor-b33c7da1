import { useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Gauge,
  Download, Loader2, ChevronDown, Radio, X, ScrollText, Check,
  Volume2, VolumeX, Volume1,
} from "lucide-react";
import { useAudioPlayer, type RepeatMode } from "@/hooks/use-audio-player";
import { RECITERS } from "@/lib/reciters";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const REPEAT_MODES: { id: RepeatMode; label: string; icon: React.ReactNode }[] = [
  { id: "none",  label: "No repeat",   icon: <Repeat className="size-3.5 opacity-60" /> },
  { id: "ayah",  label: "Repeat Ayah", icon: <Repeat1 className="size-3.5" /> },
  { id: "page",  label: "Repeat Page", icon: <Repeat className="size-3.5" /> },
  { id: "surah", label: "Repeat Surah",icon: <Repeat className="size-3.5" /> },
];

function fmt(t: number): string {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerBar() {
  const p = useAudioPlayer();
  const [open, setOpen] = useState(false);

  if (!p.queue.length) return null;

  const cur = p.currentIndex >= 0 ? p.queue[p.currentIndex] : p.queue[0];
  const label = cur ? `Surah ${cur.surah} · Ayah ${cur.ayah}` : "";

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-3xl z-40">
      <button
        type="button"
        onClick={() => { setOpen(false); p.stop(); }}
        aria-label="Close player"
        title="Close player"
        className="absolute -top-2.5 right-1 z-50 size-7 grid place-items-center rounded-full bg-[#0B1730] hover:bg-red-500 text-white/90 hover:text-white border border-amber-400/40 hover:border-red-400 shadow-[0_4px_14px_rgba(0,0,0,0.6)] transition-colors"
      >
        <X className="size-3.5" />
      </button>
      <div className="rounded-2xl bg-[#0B1730]/95 backdrop-blur-3xl border border-amber-400/20 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Main bar */}
        <div className="flex items-center gap-3 p-3">
          <button
            onClick={() => void p.prev()}
            className="size-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 grid place-items-center"
            aria-label="Previous ayah"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            onClick={() => void p.toggle()}
            className="size-12 rounded-full bg-amber-400 text-black grid place-items-center shadow-lg hover:scale-105 transition-transform"
            aria-label={p.playing ? "Pause" : "Play"}
          >
            {p.loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : p.playing ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5 ml-0.5" />
            )}
          </button>
          <button
            onClick={() => void p.next()}
            className="size-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 grid place-items-center"
            aria-label="Next ayah"
          >
            <SkipForward className="size-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest truncate">{p.reciter.name}</p>
            <p className="text-sm font-bold text-white truncate">{label}</p>
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Audio settings"
            className={`size-9 rounded-full grid place-items-center border transition ${
              open ? "bg-amber-400 text-black border-amber-300" : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
            }`}
          >
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Progress bar (seekable) */}
        <div className="px-4 pb-3">
          <input
            type="range"
            min={0}
            max={1000}
            value={p.duration > 0 ? Math.floor((p.currentTime / p.duration) * 1000) : 0}
            onChange={(e) => p.seekPct(Number(e.target.value) / 1000)}
            aria-label="Seek"
            className="w-full h-1 accent-amber-400 cursor-pointer"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{fmt(p.currentTime)}</span>
            {p.buffering && (
              <span className="inline-flex items-center gap-1 text-teal-300">
                <Loader2 className="size-3 animate-spin" /> Buffering…
              </span>
            )}
            <span>{fmt(p.duration)}</span>
          </div>
        </div>

        {/* Progress strip during caching */}
        {p.caching.active && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 text-[11px] text-teal-300">
              <Loader2 className="size-3 animate-spin" /> Caching {p.caching.done}/{p.caching.total}
            </div>
            <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-teal-400 transition-all"
                style={{ width: `${(p.caching.done / Math.max(1, p.caching.total)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded controls */}
        {open && (
          <div className="border-t border-white/10 p-4 space-y-4">
            {/* Reciter */}
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 inline-flex items-center gap-1">
                <Radio className="size-3" /> Reciter
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RECITERS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => p.setReciter(r.id)}
                    className={`text-left rounded-xl border px-3 py-2 text-xs ${
                      p.reciter.id === r.id
                        ? "bg-amber-400 text-black border-amber-300 font-bold"
                        : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="truncate">{r.name}</div>
                    <div className={`truncate text-[10px] ${p.reciter.id === r.id ? "text-black/70" : "text-slate-400"}`} dir="rtl">
                      {r.arabic}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Repeat */}
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Repeat</p>
              <div className="grid grid-cols-4 gap-2">
                {REPEAT_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => p.setRepeat(m.id)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-bold inline-flex items-center justify-center gap-1 ${
                      p.repeat === m.id
                        ? "bg-amber-400 text-black border-amber-300"
                        : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {m.icon}{m.label.replace("Repeat ", "").replace("No repeat", "Off")}
                  </button>
                ))}
              </div>
            </section>

            {/* Speed */}
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 inline-flex items-center gap-1">
                <Gauge className="size-3" /> Playback speed
              </p>
              <div className="flex flex-wrap gap-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => p.setPlaybackRate(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                      Math.abs(p.playbackRate - s) < 0.01
                        ? "bg-amber-400 text-black border-amber-300"
                        : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </section>

            {/* Toggles + actions */}
            <section className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white cursor-pointer">
                <ScrollText className="size-3.5 text-teal-300" />
                Auto scroll
                <input
                  type="checkbox"
                  checked={p.autoScroll}
                  onChange={(e) => p.setAutoScroll(e.target.checked)}
                  className="size-3.5 accent-amber-400"
                />
              </label>
              <button
                onClick={() => void p.cacheQueue()}
                disabled={p.caching.active}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500/15 border border-teal-400/40 text-teal-200 px-3 py-2 text-xs font-bold hover:bg-teal-500/25 disabled:opacity-60"
              >
                {p.caching.active ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                Cache for offline
              </button>
              {p.caching.done > 0 && !p.caching.active && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                  <Check className="size-3" /> {p.caching.done} ayahs cached
                </span>
              )}
              <button
                onClick={() => p.stop()}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 px-3 py-2 text-xs hover:bg-white/10"
                aria-label="Stop playback"
              >
                <X className="size-3.5" /> Stop
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
