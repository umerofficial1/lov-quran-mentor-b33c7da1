import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, X, Loader2, RotateCcw, Trophy, Sparkles } from "lucide-react";
import type { QuranVerse } from "@/components/VerseCard";
import { requestMicrophoneStream, releaseMicrophoneStream } from "@/lib/microphone";
import { startLiveWavRecorder, type LiveWavRecorder } from "@/lib/live-wav-recorder";
import { normalizeArabic } from "@/lib/ayah-diff";
import { syncRecitation, type TrackedWord, type WordState } from "@/lib/recitation-sync";

interface FlatWord {
  verseKey: string;
  verseNumber: number;
  wordIndex: number;
  display: string;
  normalized: string;
}

interface Feedback {
  overall: "excellent" | "good" | "needs_work";
  summary_urdu: string;
  tajweed_tips: string[];
  pronunciation_tips: string[];
  tajweed_score?: number;
  pronunciation_score?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  surahId: number;
  surahName: string;
  verses: QuranVerse[];
}

const INIT: TrackedWord = { state: "pending", confidence: 0 };

export function LiveRecitationDrawer({ open, onClose, surahId, surahName, verses }: Props) {
  const flat = useMemo<FlatWord[]>(() => {
    const out: FlatWord[] = [];
    for (const v of verses) {
      const text = v.text_uthmani ?? "";
      const parts = text.trim().split(/\s+/).filter(Boolean);
      parts.forEach((w, i) => {
        out.push({
          verseKey: v.verse_key,
          verseNumber: v.verse_number,
          wordIndex: i,
          display: w,
          normalized: normalizeArabic(w),
        });
      });
    }
    return out;
  }, [verses]);

  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [tracked, setTracked] = useState<TrackedWord[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [finished, setFinished] = useState(false);

  const recorderRef = useRef<LiveWavRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);

  // Reset when opening.
  useEffect(() => {
    if (open) {
      setTracked(new Array(flat.length).fill(INIT).map(() => ({ ...INIT })));
      setExtras([]);
      setCursor(0);
      setTranscript("");
      setFeedback(null);
      setFinished(false);
      setError(null);
    }
  }, [open, flat.length]);

  // Cleanup when closing.
  useEffect(() => {
    if (!open) void stopRecording();
    return () => { void stopRecording(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Run sync engine every time transcript grows.
  useEffect(() => {
    if (!flat.length) return;
    const spoken = transcript.trim().split(/\s+/).filter(Boolean).map(normalizeArabic);
    const result = syncRecitation({
      expected: flat.map((f) => f.normalized),
      spokenAll: spoken,
    });
    // If finished, convert lingering current/pending to missing.
    if (finished) {
      result.words = result.words.map((w) =>
        w.state === "pending" || w.state === "current" ? { state: "missing", confidence: 0 } : w,
      );
    }
    setTracked(result.words);
    setExtras(result.extras);
    setCursor(result.cursor);
  }, [transcript, flat, finished]);

  // Autoscroll current word into center.
  useEffect(() => {
    const el = wordRefs.current[cursor];
    if (el && recording) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [cursor, recording]);

  async function startRecording() {
    setError(null);
    setStarting(true);
    try {
      const { recorder, stream } = await startLiveWavRecorder(
        () => requestMicrophoneStream(),
        async (blob) => {
          try {
            const fd = new FormData();
            fd.append("audio", blob, "chunk.wav");
            const res = await fetch("/api/transcribe-chunk", { method: "POST", body: fd });
            if (!res.ok) return;
            const j = (await res.json()) as { text?: string };
            const text = (j.text ?? "").trim();
            if (text) setTranscript((prev) => (prev ? prev + " " + text : text));
          } catch { /* transient */ }
        },
      );
      recorderRef.current = recorder;
      streamRef.current = stream;
      setRecording(true);
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Mic ki ijazat nahi mili. Browser settings mein microphone allow karein.");
      } else if (name === "NotFoundError") {
        setError("Microphone nahi mila. Device check karein.");
      } else if (name === "NotSupportedError") {
        setError("Yeh browser microphone support nahi karta.");
      } else {
        setError("Recording start nahi hui. Dobara try karein.");
      }
    } finally {
      setStarting(false);
    }
  }

  async function stopRecording() {
    try { if (recorderRef.current) await recorderRef.current.stop(); } catch { /* ignore */ }
    recorderRef.current = null;
    if (streamRef.current) {
      releaseMicrophoneStream(streamRef.current);
      streamRef.current = null;
    }
    setRecording(false);
  }

  async function finishAndAnalyze() {
    await stopRecording();
    setFinished(true);

    // Compute final stats from tracked + extras (post-finish rerun will happen via effect).
    const finalTracked = tracked.map((w) =>
      w.state === "pending" || w.state === "current" ? { state: "missing" as WordState, confidence: 0 } : w,
    );
    const correct = finalTracked.filter((w) => w.state === "match").length;
    const wrong = finalTracked.filter((w) => w.state === "wrong").length;
    const missed = finalTracked.filter((w) => w.state === "missing").length;
    const total = flat.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Average confidence over attempted (match+wrong) = pronunciation quality
    const attempted = finalTracked.filter((w) => w.state === "match" || w.state === "wrong");
    const avgConf = attempted.length
      ? Math.round(attempted.reduce((a, w) => a + w.confidence, 0) / attempted.length)
      : 0;

    const mistakes = finalTracked
      .map((w, i) => (w.state === "wrong" || w.state === "missing"
        ? { expected: flat[i].display, verseKey: flat[i].verseKey, confidence: w.confidence, state: w.state }
        : null))
      .filter(Boolean)
      .slice(0, 60) as { expected: string; verseKey: string; confidence: number; state: WordState }[];

    setAnalyzing(true);
    try {
      const res = await fetch("/api/tajweed-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surahId,
          accuracy,
          pronunciationScore: avgConf,
          correct,
          wrong,
          missed,
          extras: extras.slice(0, 40),
          transcript: transcript.slice(0, 6000),
          mistakes,
        }),
      });
      if (res.ok) setFeedback((await res.json()) as Feedback);
    } catch { /* no-op */ } finally {
      setAnalyzing(false);
    }
  }

  function resetSession() {
    setTracked(new Array(flat.length).fill(INIT).map(() => ({ ...INIT })));
    setExtras([]);
    setCursor(0);
    setTranscript("");
    setFinished(false);
    setFeedback(null);
  }

  if (!open) return null;

  // Live stats
  const liveCorrect = tracked.filter((w) => w.state === "match").length;
  const liveWrong = tracked.filter((w) => w.state === "wrong").length;
  const liveMissed = tracked.filter((w) => w.state === "missing").length;
  const liveTotal = flat.length;
  const liveAcc = liveTotal > 0 ? Math.round((liveCorrect / liveTotal) * 100) : 0;
  const attempted = tracked.filter((w) => w.state === "match" || w.state === "wrong");
  const liveConf = attempted.length
    ? Math.round(attempted.reduce((a, w) => a + w.confidence, 0) / attempted.length)
    : 0;

  const currentAyah = flat[cursor]?.verseNumber ?? flat[flat.length - 1]?.verseNumber ?? 1;

  // Group flat words back by ayah for rendering.
  const groups: Array<{ verseKey: string; verseNumber: number; wordIdx: number[] }> = [];
  flat.forEach((w, i) => {
    const last = groups[groups.length - 1];
    if (last && last.verseKey === w.verseKey) last.wordIdx.push(i);
    else groups.push({ verseKey: w.verseKey, verseNumber: w.verseNumber, wordIdx: [i] });
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full md:max-w-2xl bg-madinah-bg/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03]">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gold font-bold flex items-center gap-1.5">
              <Sparkles className="size-3" /> AI Recitation Sync
            </p>
            <h2 className="text-lg text-pearl font-display truncate" dir="rtl">{surahName}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Ayah <span className="text-teal font-bold">{currentAyah}</span></p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className={`text-2xl font-bold leading-none ${liveAcc >= 80 ? "text-teal" : liveAcc >= 50 ? "text-gold" : "text-red-400"}`}>
                {liveAcc}<span className="text-sm">%</span>
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Accuracy</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-300" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Live stat chips */}
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-white/10 text-xs">
          <Chip label="✓" value={liveCorrect} color="text-emerald-400" />
          <Chip label="✗" value={liveWrong} color="text-red-400" />
          <Chip label="Missed" value={liveMissed} color="text-amber-400" />
          <Chip label="Extra" value={extras.length} color="text-fuchsia-400" />
          <Chip label="Conf" value={liveConf} suffix="%" color="text-sky-400" />
          <Chip label="/" value={liveTotal} color="text-pearl/70" prefix={`${cursor}`} />
        </div>

        {/* Mushaf */}
        <div className="flex-1 overflow-y-auto p-5">
          {groups.map((g) => (
            <div
              key={g.verseKey}
              className={`mb-6 rounded-2xl border p-4 transition-all ${
                g.verseNumber === currentAyah && recording
                  ? "bg-teal/[0.06] border-teal/40 shadow-[0_0_30px_rgba(31,182,176,0.15)]"
                  : "bg-white/[0.03] border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Ayah {g.verseNumber}</span>
                {g.verseNumber === currentAyah && recording && (
                  <span className="text-[10px] text-teal font-bold animate-pulse">● Live</span>
                )}
              </div>
              <p dir="rtl" className="font-arabic text-3xl leading-[2.5] text-right">
                {g.wordIdx.map((i) => {
                  const w = tracked[i] ?? INIT;
                  const cls = wordClass(w.state);
                  return (
                    <span
                      key={i}
                      ref={(el) => { wordRefs.current[i] = el; }}
                      className={`inline-block mx-1 transition-all duration-200 ${cls}`}
                      title={w.state === "match" || w.state === "wrong" ? `Confidence: ${w.confidence}%` : undefined}
                    >
                      {flat[i].display}
                    </span>
                  );
                })}
              </p>
            </div>
          ))}
        </div>

        {/* Report */}
        {finished && (
          <div className="border-t border-white/10 p-5 bg-white/[0.02] max-h-[50vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className={`size-6 ${liveAcc >= 80 ? "text-teal" : liveAcc >= 50 ? "text-gold" : "text-red-400"}`} />
              <h3 className="text-lg text-pearl font-bold">Session Report</h3>
              <span className="ml-auto text-2xl font-bold text-pearl">{liveAcc}%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <StatCard label="Correct" value={liveCorrect} color="bg-emerald-500/10 text-emerald-300 border-emerald-500/30" />
              <StatCard label="Wrong" value={liveWrong} color="bg-red-500/10 text-red-300 border-red-500/30" />
              <StatCard label="Missed" value={liveMissed} color="bg-amber-500/10 text-amber-300 border-amber-500/30" />
              <StatCard label="Extra" value={extras.length} color="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30" />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <ScorePill label="Pronunciation" value={feedback?.pronunciation_score ?? liveConf} />
              <ScorePill label="Tajweed" value={feedback?.tajweed_score ?? Math.max(0, liveConf - 10)} />
            </div>

            {analyzing ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 className="size-4 animate-spin" /> AI se tajweed feedback le rahe hain…
              </div>
            ) : feedback ? (
              <div className="space-y-3">
                <p className="text-sm text-pearl leading-relaxed" dir="rtl">{feedback.summary_urdu}</p>
                {feedback.tajweed_tips.length > 0 && (
                  <FeedbackList title="Tajweed Tips" items={feedback.tajweed_tips} />
                )}
                {feedback.pronunciation_tips.length > 0 && (
                  <FeedbackList title="Pronunciation" items={feedback.pronunciation_tips} />
                )}
              </div>
            ) : null}

            {extras.length > 0 && (
              <div className="mt-3 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/20 p-3">
                <p className="text-[10px] uppercase tracking-widest text-fuchsia-300 font-bold mb-1">Extra words heard</p>
                <p dir="rtl" className="font-arabic text-lg text-fuchsia-200/90">{extras.slice(0, 20).join(" · ")}</p>
              </div>
            )}

            <button
              onClick={resetSession}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-pearl"
            >
              <RotateCcw className="size-4" /> Retry Session
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="border-t border-white/10 p-4 bg-madinah-surface/60 backdrop-blur-xl">
          {error && <p className="text-xs text-red-400 mb-2 text-center">{error}</p>}
          <div className="flex items-center justify-center gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                disabled={starting || finished}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-br from-teal to-teal-deep text-white font-bold shadow-[0_0_40px_rgba(31,182,176,0.4)] hover:scale-[1.03] active:scale-95 transition disabled:opacity-50"
              >
                {starting ? <Loader2 className="size-6 animate-spin" /> : <Mic className="size-6" />}
                <span>{starting ? "Starting…" : "Start Reciting"}</span>
              </button>
            ) : (
              <button
                onClick={finishAndAnalyze}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:scale-[1.03] active:scale-95 transition"
              >
                <Square className="size-6 fill-white" />
                <span>Stop & Analyze</span>
              </button>
            )}
          </div>
          {recording && (
            <p className="text-center text-xs text-teal mt-2 animate-pulse">● Sun raha hoon…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function wordClass(state: WordState): string {
  switch (state) {
    case "match":
      return "text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]";
    case "current":
      return "text-sky-300 ring-2 ring-sky-400/70 rounded-md px-1 shadow-[0_0_18px_rgba(56,189,248,0.7)] animate-pulse";
    case "wrong":
      return "text-red-400 underline decoration-red-500 decoration-2 underline-offset-4";
    case "missing":
      return "text-red-300/70 line-through decoration-red-400/60";
    default:
      return "text-pearl/70";
  }
}

function Chip({ label, value, color, suffix, prefix }: { label: string; value: number; color: string; suffix?: string; prefix?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${color}`}>{prefix}{value}{suffix}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest mt-1 opacity-80">{label}</div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "from-emerald-500 to-teal-deep" : value >= 60 ? "from-gold to-amber-600" : "from-red-500 to-red-700";
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</span>
        <span className="text-sm text-pearl font-bold">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-1">{title}</p>
      <ul className="text-sm text-slate-200 space-y-1 list-disc list-inside" dir="rtl">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}
