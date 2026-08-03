import { useEffect, useRef } from "react";
import {
  Mic, Square, Pause, Play, Trash2, Download, AlertTriangle, ShieldOff,
  Loader2, Circle,
} from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VoiceRecorder() {
  const r = useVoiceRecorder();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>([]);

  // Draw a scrolling waveform strip.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const history = historyRef.current;
    if (r.state === "recording") history.push(r.waveform);
    else if (r.state === "idle") history.length = 0;
    const maxBars = Math.floor(cssW / 4);
    if (history.length > maxBars) history.splice(0, history.length - maxBars);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "rgba(224,177,90,0.9)";
    const barW = 2;
    const gap = 2;
    for (let i = 0; i < history.length; i++) {
      const v = Math.min(1, history[i] * 3); // amplify for visibility
      const h = Math.max(2, v * cssH * 0.9);
      const x = cssW - (history.length - i) * (barW + gap);
      const y = (cssH - h) / 2;
      ctx.fillRect(x, y, barW, h);
    }
    // idle: baseline dashed line
    if (r.state !== "recording" && history.length === 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, cssH / 2);
      ctx.lineTo(cssW, cssH / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [r.waveform, r.state]);

  const status = permissionBadge(r.permission, r.supported);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl font-display text-white">Voice recorder</h2>
          <p className="text-sm text-slate-400">Record your recitation, replay, download or delete.</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${status.className}`}
          role="status"
        >
          {status.icon}
          {status.label}
        </span>
      </header>

      {/* Waveform + timer */}
      <div className="rounded-2xl bg-black/40 border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 text-sm text-slate-300">
            {r.state === "recording" && (
              <span className="inline-flex items-center gap-1.5 text-red-400 font-bold">
                <Circle className="size-2.5 fill-red-500 text-red-500 animate-pulse" />
                REC
              </span>
            )}
            {r.state === "paused" && <span className="text-amber-300 font-bold">PAUSED</span>}
          </div>
          <div className="font-mono text-2xl text-white tabular-nums">{fmtTime(r.elapsed)}</div>
        </div>
        <canvas ref={canvasRef} className="w-full h-24 rounded-lg bg-white/[0.02]" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {r.state === "idle" && (
          <button
            onClick={() => void r.start()}
            disabled={!r.supported || r.permission === "denied"}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 font-bold text-white shadow-lg"
          >
            <Mic className="size-5" /> Start recording
          </button>
        )}
        {r.state === "recording" && (
          <>
            <button
              onClick={() => r.pause()}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 px-5 py-3 font-bold text-black"
            >
              <Pause className="size-5" /> Pause
            </button>
            <button
              onClick={() => void r.stop()}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black hover:bg-slate-200 px-5 py-3 font-bold"
            >
              <Square className="size-5" /> Stop
            </button>
          </>
        )}
        {r.state === "paused" && (
          <>
            <button
              onClick={() => r.resume()}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 hover:bg-red-400 px-5 py-3 font-bold text-white"
            >
              <Mic className="size-5" /> Resume
            </button>
            <button
              onClick={() => void r.stop()}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black hover:bg-slate-200 px-5 py-3 font-bold"
            >
              <Square className="size-5" /> Stop
            </button>
          </>
        )}
      </div>

      {r.error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 inline-flex items-start gap-2">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{r.error}</span>
        </div>
      )}

      {r.permission === "denied" && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
          Microphone is blocked. Click the address bar's lock icon → Site settings → allow Microphone, then reload.
        </div>
      )}

      {/* Recordings list */}
      {r.recordings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Your recordings ({r.recordings.length})</h3>
            <button
              onClick={r.clearAll}
              className="text-xs text-slate-400 hover:text-red-300 inline-flex items-center gap-1"
            >
              <Trash2 className="size-3" /> Clear all
            </button>
          </div>
          <ul className="space-y-3">
            {r.recordings.map((rec) => (
              <li
                key={rec.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">
                    {new Date(rec.createdAt).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {fmtTime(rec.duration)} · {fmtSize(rec.size)} · {rec.mimeType.split(";")[0]}
                  </div>
                </div>
                <audio
                  src={rec.url}
                  controls
                  preload="metadata"
                  className="w-full md:w-72 h-9 rounded"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => r.download(rec.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-3 py-2 text-xs font-bold hover:bg-emerald-500/25"
                    aria-label="Download recording"
                  >
                    <Download className="size-3.5" /> Download
                  </button>
                  <button
                    onClick={() => r.remove(rec.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-400/30 text-red-200 px-3 py-2 text-xs font-bold hover:bg-red-500/20"
                    aria-label="Delete recording"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function permissionBadge(p: ReturnType<typeof useVoiceRecorder>["permission"], supported: boolean) {
  if (!supported || p === "unsupported")
    return {
      label: "Unsupported",
      icon: <ShieldOff className="size-3" />,
      className: "bg-slate-500/15 border-slate-400/30 text-slate-300",
    };
  if (p === "granted")
    return {
      label: "Mic ready",
      icon: <Mic className="size-3" />,
      className: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300",
    };
  if (p === "denied")
    return {
      label: "Blocked",
      icon: <ShieldOff className="size-3" />,
      className: "bg-red-500/15 border-red-400/40 text-red-300",
    };
  if (p === "prompt")
    return {
      label: "Will ask",
      icon: <Mic className="size-3" />,
      className: "bg-amber-500/15 border-amber-400/40 text-amber-200",
    };
  return {
    label: "Checking…",
    icon: <Loader2 className="size-3 animate-spin" />,
    className: "bg-white/5 border-white/10 text-slate-300",
  };
}
