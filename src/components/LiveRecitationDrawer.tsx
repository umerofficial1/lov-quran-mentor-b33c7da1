import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, X, Loader2, RotateCcw, Trophy } from "lucide-react";
import type { QuranVerse } from "@/components/VerseCard";
import { requestMicrophoneStream, releaseMicrophoneStream } from "@/lib/microphone";
import { startLiveWavRecorder, type LiveWavRecorder } from "@/lib/live-wav-recorder";
import type { LiveSpeechHandle } from "@/lib/live-speech";
import { normalizeArabic, tokenize } from "@/lib/ayah-diff";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Flatten verses into a global word sequence for cross-ayah live diffing.
interface FlatWord {
  verseKey: string;
  verseNumber: number;
  wordIndex: number;
  display: string;    // with tashkeel, for rendering
  normalized: string; // for matching
}

type WordStatus = "pending" | "current" | "match" | "wrong" | "skipped" | "missing";

interface Feedback {
  overall: "excellent" | "good" | "needs_work";
  summary_urdu: string;
  tajweed_tips: string[];
  pronunciation_tips: string[];
  tajweed_mistakes?: string[];
  makharij_mistakes?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  surahId: number;
  surahName: string;
  verses: QuranVerse[];
}

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
  const [statuses, setStatuses] = useState<WordStatus[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveMistake, setLiveMistake] = useState<{ expected: string; verseNumber: number; at: number } | null>(null);

  const prevStatusesRef = useRef<WordStatus[]>([]);
  const recorderRef = useRef<LiveWavRecorder | null>(null);
  const speechRef = useRef<LiveSpeechHandle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const scrollBoxRef = useRef<HTMLDivElement | null>(null);

  // Re-init statuses when opening or verses change.
  useEffect(() => {
    if (open) {
      setStatuses(new Array(flat.length).fill("pending"));
      prevStatusesRef.current = new Array(flat.length).fill("pending");
      setCurrentIdx(0);
      setTranscript("");
      setFeedback(null);
      setFinished(false);
      setError(null);
      setLiveMistake(null);
    }
  }, [open, flat.length]);

  // Cleanup on close.
  useEffect(() => {
    if (!open) {
      void stopRecording();
    }
    return () => {
      void stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Diff transcript against expected sequence whenever transcript grows.
  useEffect(() => {
    if (!flat.length) return;
    const spoken = tokenize(transcript);
    const exp = flat.map((f) => f.normalized);
    const n = exp.length;
    const m = spoken.length;
    // Greedy forward alignment: preserves order, marks skipped/wrong live.
    const next: WordStatus[] = new Array(n).fill("pending");
    let ei = 0;
    let si = 0;
    while (ei < n && si < m) {
      if (exp[ei] === spoken[si]) {
        next[ei] = "match";
        ei++;
        si++;
      } else {
        // Look ahead a few expected words for a match — user may have skipped.
        let found = -1;
        for (let k = 1; k <= 3 && ei + k < n; k++) {
          if (exp[ei + k] === spoken[si]) {
            found = k;
            break;
          }
        }
        if (found > 0) {
          for (let k = 0; k < found; k++) next[ei + k] = "skipped"; // jumped over
          next[ei + found] = "match";
          ei += found + 1;
          si++;
        } else {
          // Look ahead in spoken (extra word said)
          let sfound = -1;
          for (let k = 1; k <= 3 && si + k < m; k++) {
            if (exp[ei] === spoken[si + k]) {
              sfound = k;
              break;
            }
          }
          if (sfound > 0) {
            si += sfound; // extras are ignored, next spoken matches
          } else {
            next[ei] = "wrong"; // mispronounced
            ei++;
            si++;
          }
        }
      }
    }
    // ei is the next-expected pointer.
    const cur = Math.min(ei, n - 1);
    if (!finished && ei < n) next[cur] = next[cur] === "pending" ? "current" : next[cur];
    setStatuses(next);
    setCurrentIdx(ei);

    // Detect NEW mistakes (transition from pending/current → wrong) and fire live feedback.
    const prev = prevStatusesRef.current;
    let newestWrong = -1;
    for (let i = 0; i < next.length; i++) {
      if (next[i] === "wrong" && prev[i] !== "wrong") newestWrong = i;
    }
    if (newestWrong >= 0 && flat[newestWrong]) {
      setLiveMistake({
        expected: flat[newestWrong].display,
        verseNumber: flat[newestWrong].verseNumber,
        at: Date.now(),
      });
      // Gentle haptic buzz on mobile
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.([40, 60, 40]); } catch { /* ignore */ }
      }
    }
    prevStatusesRef.current = next;
  }, [transcript, flat, finished]);

  // Auto-hide the mistake banner after 3.5s.
  useEffect(() => {
    if (!liveMistake) return;
    const id = window.setTimeout(() => setLiveMistake(null), 3500);
    return () => window.clearTimeout(id);
  }, [liveMistake]);

  // Autoscroll current word into view.
  useEffect(() => {
    const el = wordRefs.current[currentIdx];
    if (el && recording) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [currentIdx, recording]);

  // Elapsed timer while recording.
  useEffect(() => {
    if (!recording || !startedAt) return;
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 500);
    return () => window.clearInterval(id);
  }, [recording, startedAt]);

  async function startRecording() {
    setError(null);
    setStarting(true);
    try {
      // PRIMARY: server-side gpt-4o-transcribe with 700ms WAV chunks.
      // More accurate for Arabic than Web Speech API (which fails silently on ar-SA in most browsers).
      const stream = await requestMicrophoneStream();
      streamRef.current = stream;

      const { recorder } = await startLiveWavRecorder(
        async () => stream,
        async (blob) => {
          try {
            const fd = new FormData();
            fd.append("audio", blob, "chunk.wav");
            const res = await fetch("/api/transcribe-chunk", { method: "POST", body: fd });
            if (!res.ok) return;
            const j = (await res.json()) as { text?: string };
            const text = (j.text ?? "").trim();
            if (text) setTranscript((prev) => (prev ? prev + " " + text : text));
          } catch { /* ignore */ }
        },
      );
      recorderRef.current = recorder;

      // (Web Speech disabled — Arabic recognition is unreliable across browsers
      // and its interim text corrupted the word-by-word diff. Server chunks only.)

      setRecording(true);
      setStartedAt(Date.now());
      setElapsedMs(0);
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Mic ki ijazat nahi mili. Browser settings mein microphone allow karein.");
      } else if (name === "NotFoundError") {
        setError("Microphone nahi mila. Device check karein.");
      } else if (name === "NotSupportedError") {
        setError("Yeh browser microphone support nahi karta. Chrome ya Safari try karein.");
      } else {
        setError("Recording start nahi hui. Dobara try karein.");
      }
    } finally {
      setStarting(false);
    }
  }

  async function stopRecording() {
    try {
      if (speechRef.current) {
        speechRef.current.stop();
      }
      if (recorderRef.current) {
        await recorderRef.current.stop();
      }
    } catch { /* ignore */ }
    speechRef.current = null;
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
    // Mark remaining pending as missing.
    setStatuses((prev) =>
      prev.map((s) => (s === "pending" || s === "current" ? "missing" : s)),
    );

    // Compute stats from statuses that we just applied.
    const finalStatuses = statuses.map((s, i) =>
      i >= currentIdx || s === "pending" || s === "current" ? "missing" : s,
    ) as WordStatus[];
    const correct = finalStatuses.filter((s) => s === "match").length;
    const wrong = finalStatuses.filter((s) => s === "wrong").length;
    const missed = finalStatuses.filter((s) => s === "missing").length;
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / (correct + wrong + missed)) * 100) : 0;

    const mistakes = finalStatuses
      .map((s, i) => (s === "wrong" || s === "missing" ? { expected: flat[i].display, verseKey: flat[i].verseKey } : null))
      .filter(Boolean)
      .slice(0, 60) as { expected: string; verseKey: string }[];

    setAnalyzing(true);
    let aiAdvice: string | null = null;
    try {
      const res = await fetch("/api/tajweed-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surahId,
          accuracy,
          correct,
          wrong,
          missed,
          transcript: transcript.slice(0, 6000),
          mistakes,
        }),
      });
      if (res.ok) {
        const fb = (await res.json()) as Feedback;
        setFeedback(fb);
        aiAdvice = [fb.summary_urdu, ...(fb.tajweed_tips ?? []), ...(fb.pronunciation_tips ?? [])]
          .filter(Boolean).join("\n");
      }
    } catch {
      // no-op
    } finally {
      setAnalyzing(false);
    }

    // Persist session + evaluate achievements
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        const startAyah = flat[0]?.verseNumber ?? 1;
        const endAyah = flat[flat.length - 1]?.verseNumber ?? startAyah;
        const durationMs = startedAt ? Date.now() - startedAt : elapsedMs;
        const wpmFinal = durationMs > 0 ? Math.round(((correct + wrong) / (durationMs / 1000)) * 60) : 0;
        const completedRun = missed === 0 && wrong <= Math.max(1, Math.floor(flat.length * 0.05));

        const { error: insErr } = await supabase.from("recitation_sessions").insert({
          user_id: uid,
          surah_id: surahId,
          start_ayah: startAyah,
          end_ayah: endAyah,
          words_total: flat.length,
          words_matched: correct,
          words_wrong: wrong,
          words_missing: missed,
          accuracy,
          pronunciation_score: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
          wpm: wpmFinal,
          duration_ms: durationMs,
          tajweed_notes: feedback?.tajweed_tips ?? [],
          word_states: finalStatuses,
          ai_advice: aiAdvice,
          completed: completedRun,
        });
        if (insErr) throw insErr;

        // Evaluate achievements
        const { count: sessionCount } = await supabase
          .from("recitation_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid);
        const toUnlock: string[] = [];
        if ((sessionCount ?? 0) >= 1) toUnlock.push("first_session");
        if ((sessionCount ?? 0) >= 10) toUnlock.push("sessions_10");
        if ((sessionCount ?? 0) >= 50) toUnlock.push("sessions_50");
        if (accuracy >= 80) toUnlock.push("accuracy_80");
        if (accuracy >= 95) toUnlock.push("accuracy_95");
        if (completedRun) toUnlock.push("surah_complete");

        if (toUnlock.length) {
          const rows = toUnlock.map((id) => ({ user_id: uid, achievement_id: id, progress: 100 }));
          const { data: newlyUnlocked } = await supabase
            .from("user_achievements")
            .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true })
            .select("achievement_id, achievement:achievements(title, icon)");
          (newlyUnlocked ?? []).forEach((row: { achievement?: { title?: string } | null }) => {
            const t = row?.achievement?.title;
            if (t) toast.success(`🏆 Achievement unlocked: ${t}`);
          });
        }

        toast.success("Session saved");
      }
    } catch (e) {
      console.error("save session failed", e);
    }
  }

  function retryMistakes() {
    // Reset statuses, keep only positions at wrong/missing as targets by clearing transcript.
    // Simple retry: reset everything to pending, clear transcript.
    setStatuses(new Array(flat.length).fill("pending"));
    setCurrentIdx(0);
    setTranscript("");
    setFinished(false);
    setFeedback(null);
  }

  if (!open) return null;

  // Stats live
  const liveCorrect = statuses.filter((s) => s === "match").length;
  const liveWrong = statuses.filter((s) => s === "wrong").length;
  const liveAttempted = liveCorrect + liveWrong;
  const liveAcc = liveAttempted > 0 ? Math.round((liveCorrect / liveAttempted) * 100) : 0;
  const wordsDone = liveCorrect + liveWrong;
  const wordsRemaining = Math.max(0, flat.length - wordsDone);
  const elapsedSec = Math.max(1, Math.round(elapsedMs / 1000));
  const wpm = wordsDone > 0 ? Math.round((wordsDone / elapsedSec) * 60) : 0;
  const etaSec = wpm > 0 ? Math.round((wordsRemaining / wpm) * 60) : 0;
  const pronScore = liveAttempted > 0 ? Math.round((liveCorrect / liveAttempted) * 100) : 0;
  const currentVerse = flat[Math.min(currentIdx, flat.length - 1)]?.verseNumber ?? 1;
  const fmt = (s: number) => {
    if (!s || !Number.isFinite(s)) return "—";
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  // Group words back by ayah for rendering.
  const groups: Array<{ verseKey: string; verseNumber: number; wordIdx: number[] }> = [];
  flat.forEach((w, i) => {
    const last = groups[groups.length - 1];
    if (last && last.verseKey === w.verseKey) last.wordIdx.push(i);
    else groups.push({ verseKey: w.verseKey, verseNumber: w.verseNumber, wordIdx: [i] });
  });

  const finalCorrect = statuses.filter((s) => s === "match").length;
  const finalWrong = statuses.filter((s) => s === "wrong").length;
  const finalMissed = statuses.filter((s) => s === "missing").length;
  const finalAcc =
    flat.length > 0 ? Math.round((finalCorrect / flat.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full md:max-w-2xl bg-madinah-bg/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03]">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Live Recitation</p>
            <h2 className="text-lg text-pearl font-display" dir="rtl">{surahName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Accuracy</span>
            <span className={`text-lg font-bold ${liveAcc >= 80 ? "text-teal" : liveAcc >= 50 ? "text-gold" : "text-red-400"}`}>
              {liveAcc}%
            </span>
            <button onClick={onClose} className="ml-2 p-2 rounded-lg hover:bg-white/10 text-slate-300" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Live stats panel */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 px-4 py-3 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
          <LiveStat label="Ayah" value={String(currentVerse)} tone="pearl" />
          <LiveStat label="Word" value={`${wordsDone}/${flat.length}`} tone="pearl" />
          <LiveStat label="Accuracy" value={`${liveAcc}%`} tone={liveAcc >= 80 ? "teal" : liveAcc >= 50 ? "gold" : "red"} />
          <LiveStat label="Pronunciation" value={`${pronScore}%`} tone={pronScore >= 80 ? "teal" : "gold"} />
          <LiveStat label="Speed" value={wpm ? `${wpm} wpm` : "—"} tone="pearl" />
          <LiveStat label="ETA" value={fmt(etaSec)} tone="pearl" />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 text-[11px] text-slate-400">
          <span>Time <span className="text-pearl font-mono">{fmt(elapsedSec)}</span></span>
          <span>Remaining <span className="text-pearl font-mono">{wordsRemaining}</span> words</span>
          <span className="hidden sm:inline">Correct <span className="text-emerald-400 font-bold">{liveCorrect}</span> · Wrong <span className="text-red-400 font-bold">{liveWrong}</span></span>
        </div>

        {/* Teleprompter — big current word, live mistake banner */}
        {recording && !finished && (
          <div className="px-4 py-4 border-b border-white/10 bg-gradient-to-r from-teal/15 via-teal/5 to-transparent">
            <div className="text-[10px] uppercase tracking-widest text-teal font-bold mb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-teal animate-pulse" />
              Ab yeh parhein
              <span className="ml-auto text-slate-400">Ayah {flat[currentIdx]?.verseNumber ?? "—"}</span>
            </div>
            <div dir="rtl" className="flex items-baseline justify-end gap-4 font-arabic">
              {/* previous word (faded) */}
              {currentIdx > 0 && (
                <span className="text-2xl text-emerald-400/40 truncate max-w-[30%]">
                  {flat[currentIdx - 1]?.display}
                </span>
              )}
              {/* current word — hero */}
              <span
                key={currentIdx}
                className="text-5xl md:text-6xl text-emerald-300 font-bold drop-shadow-[0_0_24px_rgba(52,211,153,0.85)] animate-pulse"
              >
                {flat[currentIdx]?.display ?? "—"}
              </span>
              {/* next word (hint) */}
              {currentIdx + 1 < flat.length && (
                <span className="text-2xl text-pearl/40 truncate max-w-[30%]">
                  {flat[currentIdx + 1]?.display}
                </span>
              )}
            </div>
            {liveMistake && (
              <div key={liveMistake.at} className="mt-3 flex items-center gap-3 rounded-xl bg-red-500/15 border border-red-500/40 px-3 py-2 animate-fade-in">
                <span className="text-red-300 text-lg">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-red-300 font-bold">Yahan galti — ayah {liveMistake.verseNumber}</div>
                  <div className="text-xs text-slate-300">Sahi lafz tha:</div>
                </div>
                <div dir="rtl" className="font-arabic text-2xl text-red-100 font-bold">{liveMistake.expected}</div>
              </div>
            )}
          </div>
        )}

        {/* Mushaf — continuous flowing page */}
        <div ref={scrollBoxRef} className="flex-1 overflow-y-auto px-5 py-6">
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6">
            <p
              dir="rtl"
              className="font-arabic text-[2rem] md:text-[2.25rem] leading-[2.6] text-right text-pearl/80"
              style={{ wordSpacing: "0.15em" }}
            >
              {groups.map((g, gi) => (
                <span key={g.verseKey}>
                  {g.wordIdx.map((i) => {
                    const st = statuses[i] ?? "pending";
                    const cls =
                      st === "match"
                        ? "text-emerald-400/85"
                        : st === "current"
                        ? "text-emerald-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.9)] animate-pulse"
                        : st === "wrong"
                        ? "text-red-400 underline decoration-red-500 decoration-2 underline-offset-4"
                        : st === "missing"
                        ? "text-red-300/70 line-through decoration-red-400/60"
                        : "text-pearl/70";
                    return (
                      <span
                        key={i}
                        ref={(el) => { wordRefs.current[i] = el; }}
                        className={`inline-block mx-[0.15em] transition-all duration-300 ${cls}`}
                      >
                        {flat[i].display}
                      </span>
                    );
                  })}
                  {/* Ayah end marker */}
                  <span
                    className="inline-flex items-center justify-center align-middle mx-2 w-8 h-8 rounded-full border border-gold/40 text-gold text-[0.7em] font-bold bg-gold/5"
                    aria-label={`Ayah ${g.verseNumber}`}
                  >
                    {toArabicNumeral(g.verseNumber)}
                  </span>
                  {gi < groups.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Report */}
        {finished && (
          <div className="border-t border-white/10 p-5 bg-white/[0.02] max-h-[45vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className={`size-6 ${finalAcc >= 80 ? "text-teal" : finalAcc >= 50 ? "text-gold" : "text-red-400"}`} />
              <h3 className="text-lg text-pearl font-bold">Session Report</h3>
              <span className="ml-auto text-2xl font-bold text-pearl">{finalAcc}%</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatCard label="Correct" value={finalCorrect} color="bg-emerald-500/10 text-emerald-300 border-emerald-500/30" />
              <StatCard label="Incorrect" value={finalWrong} color="bg-red-500/10 text-red-300 border-red-500/30" />
              <StatCard label="Missed" value={finalMissed} color="bg-amber-500/10 text-amber-300 border-amber-500/30" />
            </div>
            {analyzing ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 className="size-4 animate-spin" /> AI se tajweed feedback le rahe hain…
              </div>
            ) : feedback ? (
              <div className="space-y-3">
                <p className="text-sm text-pearl leading-relaxed" dir="rtl">{feedback.summary_urdu}</p>
                {feedback.tajweed_tips.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gold font-bold mb-1">Tajweed Tips</p>
                    <ul className="text-sm text-slate-200 space-y-1 list-disc list-inside" dir="rtl">
                      {feedback.tajweed_tips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.pronunciation_tips.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gold font-bold mb-1">Pronunciation</p>
                    <ul className="text-sm text-slate-200 space-y-1 list-disc list-inside" dir="rtl">
                      {feedback.pronunciation_tips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
            <button
              onClick={retryMistakes}
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
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-br from-teal to-teal-deep text-white font-bold shadow-[0_0_40px_rgba(31,182,176,0.4)] hover:scale-[1.03] active:scale-95 transition disabled:opacity-50"
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
          {transcript && (
            <p dir="rtl" className="mt-3 text-xs text-slate-400 font-arabic max-h-16 overflow-y-auto text-right">
              {transcript}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function toArabicNumeral(n: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).split("").map((d) => digits[Number(d)] ?? d).join("");
}

function LiveStat({ label, value, tone }: { label: string; value: string; tone: "teal" | "gold" | "red" | "pearl" }) {
  const toneCls =
    tone === "teal" ? "text-teal" : tone === "gold" ? "text-gold" : tone === "red" ? "text-red-400" : "text-pearl";
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2 py-2 text-center">
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{label}</div>
      <div className={`text-sm font-bold font-mono mt-0.5 ${toneCls}`}>{value}</div>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
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
