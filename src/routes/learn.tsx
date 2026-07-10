import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import {
  Brain, Languages, GraduationCap, CalendarRange, Ear, ScanSearch, Sparkles, Play, Loader2, CheckCircle2, XCircle, ExternalLink, Mic, Square, Smartphone,
} from "lucide-react";
import {
  translationCompare, generateQuiz, memorizationCoach, revisionPlanner,
} from "@/lib/ai.functions";
import { ayahAudioUrl, RECITERS } from "@/lib/reciters";

export const Route = createFileRoute("/learn")({
  validateSearch: (search: Record<string, unknown>) => ({
    tool: search.tool === "mistake" ? ("mistake" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Learn — Quiz, Memorization Coach & Translation Compare · Verse Wise Mentor" },
      {
        name: "description",
        content:
          "AI-powered Quran learning: translation compare, quiz mode, memorization coach, revision planner, listening test and mistake checker.",
      },
      { property: "og:title", content: "AI Learn — Verse Wise Mentor" },
      { property: "og:description", content: "Six AI-guided tools to learn, memorize and revise the Quran." },
    ],
  }),
  component: () => (<RequireAuth><LearnPage /></RequireAuth>),
});

type Tab = "compare" | "quiz" | "coach" | "revise" | "listen" | "mistake";

const TABS: { id: Tab; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "compare", label: "Translation compare", icon: <Languages className="size-4" />, hint: "See 5 translations side-by-side + AI notes" },
  { id: "quiz",    label: "Quiz mode",           icon: <Brain className="size-4" />,      hint: "AI-generated MCQ on any topic" },
  { id: "coach",   label: "Memorization coach",  icon: <GraduationCap className="size-4" />, hint: "Personalized hifz plan for one surah" },
  { id: "revise",  label: "Revision planner",    icon: <CalendarRange className="size-4" />, hint: "Weekly cycle across memorized surahs" },
  { id: "listen",  label: "Listening test",      icon: <Ear className="size-4" />,        hint: "Listen and identify the ayah" },
  { id: "mistake", label: "Mistake checker",     icon: <ScanSearch className="size-4" />, hint: "Compare your recitation to the ayah" },
];

function LearnPage() {
  const { tool } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(tool ?? "compare");
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-28 md:pb-16">
      <SiteNav />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="size-3" /> AI Learning
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-white mt-3">Learn with AI</h1>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto">
            Six intelligent tools grounded in mainstream scholarship to help you understand, memorize and revise.
          </p>
        </header>

        {!user && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-4 text-center text-amber-100 text-sm">
            Sign in to use AI learning tools.
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                tab === t.id
                  ? "bg-amber-400 text-black border-amber-300"
                  : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
              }`}
              title={t.hint}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          {tab === "compare" && <TranslationCompareTool />}
          {tab === "quiz" && <QuizTool />}
          {tab === "coach" && <CoachTool />}
          {tab === "revise" && <ReviseTool />}
          {tab === "listen" && <ListenTool />}
          {tab === "mistake" && <MistakeTool />}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function useRun<TResult>(fn: (arg: unknown) => Promise<TResult>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);
  const run = async (arg: unknown) => {
    setLoading(true); setError(null);
    try {
      const r = await fn(arg);
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };
  return { loading, error, data, run, setData };
}

/* ---------- Translation Compare ---------- */
function TranslationCompareTool() {
  const compareFn = useServerFn(translationCompare);
  const [verseKey, setVerseKey] = useState("2:255");
  const { loading, error, data, run } = useRun((a) => compareFn({ data: a as { verseKey: string } }));

  return (
    <div className="space-y-4">
      <ToolHeader title="Translation comparison" desc="Paste a Surah:Ayah reference to compare 5 translations plus AI-generated notes on nuance." />
      <form
        onSubmit={(e) => { e.preventDefault(); run({ verseKey }); }}
        className="flex gap-2"
      >
        <input
          value={verseKey}
          onChange={(e) => setVerseKey(e.target.value)}
          placeholder="e.g. 2:255"
          className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/40"
        />
        <SubmitBtn loading={loading}>Compare</SubmitBtn>
      </form>
      <ErrorBox error={error} />
      {data && (
        <div className="space-y-4">
          <p className="font-uthmani text-white text-right text-2xl leading-loose" dir="rtl">{data.arabic}</p>
          <div className="space-y-2">
            {data.translations.map((t) => (
              <div key={t.label} className="rounded-xl bg-black/20 border border-white/10 p-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">{t.label}</p>
                <p className="text-slate-200 text-sm mt-1">{t.text}</p>
              </div>
            ))}
          </div>
          <AiCard title="AI nuance notes" md={data.comparison} />
        </div>
      )}
    </div>
  );
}

/* ---------- Quiz ---------- */
function QuizTool() {
  const genFn = useServerFn(generateQuiz);
  const [topic, setTopic] = useState("Stories of the Prophets");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const { loading, error, data, run } = useRun((a) => genFn({ data: a as { topic: string; difficulty: "easy"|"medium"|"hard"; count: number } }));

  const start = () => { setAnswers({}); run({ topic, difficulty, count }); };
  const score = data ? Object.entries(answers).filter(([i, v]) => Number(v) === data.questions[Number(i)].answerIndex).length : 0;
  const done = data ? Object.keys(answers).length === data.questions.length : false;

  return (
    <div className="space-y-4">
      <ToolHeader title="Quiz mode" desc="Pick a topic and difficulty. AI writes fresh multiple-choice questions with citations." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. Tajweed)"
          className="sm:col-span-1 rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-amber-400/40" />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy"|"medium"|"hard")}
          className="rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-amber-400/40">
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
        <select value={count} onChange={(e) => setCount(Number(e.target.value))}
          className="rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-amber-400/40">
          {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n} questions</option>)}
        </select>
      </div>
      <SubmitBtn loading={loading} onClick={start}>Generate quiz</SubmitBtn>
      <ErrorBox error={error} />

      {data && (
        <div className="space-y-4">
          {data.questions.map((q, i) => (
            <div key={i} className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <p className="text-white font-bold mb-3">{i + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.choices.map((c, ci) => {
                  const picked = answers[i] === ci;
                  const correct = ci === q.answerIndex;
                  const reveal = answers[i] != null;
                  return (
                    <button
                      key={ci}
                      disabled={reveal}
                      onClick={() => setAnswers({ ...answers, [i]: ci })}
                      className={`w-full text-left rounded-xl px-4 py-2 text-sm border transition ${
                        !reveal
                          ? "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                          : correct
                            ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-100"
                            : picked
                              ? "bg-rose-500/15 border-rose-400/40 text-rose-100"
                              : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {answers[i] != null && (
                <p className="text-[12px] text-slate-300 mt-3 italic">
                  {answers[i] === q.answerIndex ? "✓ " : "✗ "}{q.explanation}
                </p>
              )}
            </div>
          ))}
          {done && (
            <div className="rounded-2xl bg-amber-400/10 border border-amber-400/30 p-4 text-center">
              <p className="text-white font-bold">Score: {score} / {data.questions.length}</p>
              <button onClick={start} className="mt-2 text-amber-300 text-sm hover:text-amber-200 font-bold">
                Generate another quiz →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Coach ---------- */
function CoachTool() {
  const coachFn = useServerFn(memorizationCoach);
  const [surah, setSurah] = useState(78);
  const [minutes, setMinutes] = useState(30);
  const [strengths, setStrengths] = useState("");
  const [struggles, setStruggles] = useState("");
  const { loading, error, data, run } = useRun((a) => coachFn({ data: a as { surah: number; minutesPerDay: number; strengths?: string; struggles?: string } }));

  return (
    <div className="space-y-4">
      <ToolHeader title="Memorization coach" desc="Personalized daily hifz plan for the surah you're memorizing." />
      <form onSubmit={(e) => { e.preventDefault(); run({ surah, minutesPerDay: minutes, strengths, struggles }); }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Surah number (1–114)"><input type="number" min={1} max={114} value={surah} onChange={(e) => setSurah(Number(e.target.value))} className={inputCls} /></Input>
        <Input label="Minutes / day"><input type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={inputCls} /></Input>
        <Input label="Your strengths"><input value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="e.g. good voice, focused mornings" className={inputCls} /></Input>
        <Input label="Your struggles"><input value={struggles} onChange={(e) => setStruggles(e.target.value)} placeholder="e.g. long ayahs, distraction" className={inputCls} /></Input>
        <div className="sm:col-span-2"><SubmitBtn loading={loading}>Build my plan</SubmitBtn></div>
      </form>
      <ErrorBox error={error} />
      {data && <AiCard title="Your plan" md={data.markdown} />}
    </div>
  );
}

/* ---------- Revise ---------- */
function ReviseTool() {
  const reviseFn = useServerFn(revisionPlanner);
  const [surahs, setSurahs] = useState("78,79,80,81,82");
  const [minutes, setMinutes] = useState(210);
  const { loading, error, data, run } = useRun((a) => reviseFn({ data: a as { memorizedSurahs: number[]; weeklyMinutes: number } }));

  const submit = () => {
    const arr = surahs.split(/[,\s]+/).map((v) => Number(v.trim())).filter((v) => v >= 1 && v <= 114);
    run({ memorizedSurahs: arr, weeklyMinutes: minutes });
  };

  return (
    <div className="space-y-4">
      <ToolHeader title="Revision planner" desc="A 7-day cycle across every surah you've memorized." />
      <Input label="Memorized surahs (comma-separated numbers)">
        <input value={surahs} onChange={(e) => setSurahs(e.target.value)} className={inputCls} />
      </Input>
      <Input label="Weekly minutes">
        <input type="number" min={30} max={2000} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={inputCls} />
      </Input>
      <SubmitBtn loading={loading} onClick={submit}>Build revision plan</SubmitBtn>
      <ErrorBox error={error} />
      {data && <AiCard title="Weekly plan" md={data.markdown} />}
    </div>
  );
}

/* ---------- Listening test ---------- */
function ListenTool() {
  const [surah, setSurah] = useState(112);
  const [ayah, setAyah] = useState(1);
  const [reciterId, setReciterId] = useState(RECITERS[1].id);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MistakeResult | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const play = () => {
    const r = RECITERS.find((x) => x.id === reciterId) ?? RECITERS[1];
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = ayahAudioUrl(r, surah, ayah);
    void audioRef.current.play();
  };

  const checkRecording = async (blob: Blob) => {
    if (blob.size < 2048) { setError("Recording bohat chhoti hai. Dobara record karein."); return; }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("wav") ? "wav" : blob.type.includes("mpeg") ? "mp3" : "webm";
      fd.append("audio", blob, `recording.${ext}`);
      fd.append("verseKey", `${surah}:${ayah}`);
      const res = await fetch("/api/mistake-check-voice", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text().catch(() => "Voice check failed"));
      setData(await res.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Voice check failed");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    setData(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Mic browser mein available nahi. Neeche ‘Phone recorder’ use karein.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => void checkRecording(new Blob(chunksRef.current, { type: mime }));
      recRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Mic permission blocked hai. Lock icon se Allow karein ya ‘Phone recorder’ dabayen.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  return (
    <div className="space-y-4">
      <ToolHeader title="Listening test (voice)" desc="Ayah sunain, phir mic mein jo suna woh parhein. AI aapki voice check karega." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input label="Surah"><input type="number" min={1} max={114} value={surah} onChange={(e) => { setSurah(Number(e.target.value)); setData(null); }} className={inputCls} /></Input>
        <Input label="Ayah"><input type="number" min={1} value={ayah} onChange={(e) => { setAyah(Number(e.target.value)); setData(null); }} className={inputCls} /></Input>
        <Input label="Reciter">
          <select value={reciterId} onChange={(e) => setReciterId(e.target.value)} className={inputCls}>
            {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Input>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={play}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-400 text-black px-4 py-2.5 font-bold text-sm hover:scale-[1.02] transition">
          <Play className="size-4" /> Play ayah
        </button>
        {!recording ? (
          <button type="button" onClick={startRecording} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 text-white px-4 py-2.5 font-bold text-sm disabled:opacity-50">
            <Mic className="size-4" /> Start voice answer
          </button>
        ) : (
          <button type="button" onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2.5 font-bold text-sm">
            <Square className="size-4 fill-current" /> Stop &amp; check
          </button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-200">
          <Smartphone className="size-4" /> Phone recorder
          <input type="file" accept="audio/*" capture="user" className="sr-only"
            onChange={(event) => { const file = event.target.files?.[0]; if (file) void checkRecording(file); event.target.value = ""; }} />
        </label>
        {loading && <span className="inline-flex items-center gap-2 text-sm text-slate-300"><Loader2 className="size-4 animate-spin" /> Voice check ho rahi hai…</span>}
      </div>
      <ErrorBox error={error} />
      {data && (
        <div className={`rounded-2xl border p-4 ${
          data.overall === "correct" ? "bg-emerald-500/10 border-emerald-400/40"
          : data.overall === "minor" ? "bg-amber-400/10 border-amber-400/40"
          : "bg-rose-500/10 border-rose-400/40"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {data.overall === "correct" ? <CheckCircle2 className="size-5 text-emerald-300" /> : <XCircle className="size-5 text-rose-300" />}
            <p className="font-bold text-white">Score: {data.score}/100 · {data.overall}</p>
          </div>
          <p className="text-slate-200 text-sm">{data.summary}</p>
          <p className="mt-2 text-sm text-slate-400" dir="rtl">Aap ne parha: {data.transcript}</p>
          <p className="mt-3 font-uthmani text-white text-right text-2xl leading-loose" dir="rtl">{data.correct}</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Mistake (voice) ---------- */
type WordDiff = { expected: string; heard: string; status: "ok" | "wrong" | "missing" | "extra"; issue: string };
type MistakeResult = {
  verseKey: string;
  correct: string;
  transcript: string;
  overall: "correct" | "minor" | "major";
  score: number;
  summary: string;
  words: WordDiff[];
  tips: string[];
};

function MistakeTool() {
  const [verseKey, setVerseKey] = useState("1:1");
  const [reciterId, setReciterId] = useState(RECITERS[1].id);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMicHelp, setShowMicHelp] = useState(false);
  const [data, setData] = useState<MistakeResult | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const openMicTab = () => {
    window.open(`${window.location.origin}/learn?tool=mistake`, "_blank", "noopener,noreferrer");
  };

  const start = async () => {
    setError(null);
    setShowMicHelp(false);
    setData(null);

    if (window.self !== window.top) {
      openMicTab();
      setShowMicHelp(true);
      setError("Mic preview ke andar block hai. Naya tab khul gaya hai—wahan Start recording dabayen aur Allow karein.");
      return;
    }

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setShowMicHelp(true);
      setError("Is browser mein microphone recording available nahi. App ko HTTPS par Chrome ya Safari mein kholen.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => void submit(new Blob(chunksRef.current, { type: mime }));
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (cause) {
      const permissionDenied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setShowMicHelp(true);
      setError(permissionDenied
        ? "Microphone blocked hai. Address bar ke lock icon se Microphone → Allow karein, page reload karein, phir dobara try karein."
        : "Microphone start nahi hua. Kisi doosre app ki recording band karke dobara try karein.");
    }
  };

  const stop = () => {
    setRecording(false);
    recRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const submit = async (blob: Blob) => {
    if (blob.size < 2048) { setError("Recording was too short. Please try again."); return; }
    setLoading(true);
    try {
      const [sur, ay] = verseKey.split(":").map(Number);
      if (!sur || !ay) throw new Error("Enter Surah:Ayah (e.g. 1:1)");
      const fd = new FormData();
      fd.append("audio", blob, `recording.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
      fd.append("verseKey", verseKey);
      const res = await fetch("/api/mistake-check-voice", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const playCorrect = () => {
    const [sur, ay] = verseKey.split(":").map(Number);
    const r = RECITERS.find((x) => x.id === reciterId) ?? RECITERS[1];
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = ayahAudioUrl(r, sur, ay);
    void audioRef.current.play();
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ur-PK";
    window.speechSynthesis.speak(u);
  };

  const badge =
    data?.overall === "correct" ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
    : data?.overall === "minor" ? "bg-amber-400/15 border-amber-400/40 text-amber-200"
    : "bg-rose-500/15 border-rose-400/40 text-rose-200";

  return (
    <div className="space-y-4">
      <ToolHeader title="Mistake checker (voice)" desc="Record karein — jahan galti hogi wo lafz red mein highlight ho jayega, sath tajweed ka sabab bhi." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input label="Verse (Surah:Ayah)"><input value={verseKey} onChange={(e) => setVerseKey(e.target.value)} className={inputCls} /></Input>
        <Input label="Correct-ayah reciter">
          <select value={reciterId} onChange={(e) => setReciterId(e.target.value)} className={inputCls}>
            {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Input>
      </div>

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <button type="button" onClick={start} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 text-white px-5 py-2.5 font-bold text-sm hover:scale-[1.02] transition disabled:opacity-50">
            <span className="size-2 rounded-full bg-white animate-pulse" /> Start recording
          </button>
        ) : (
          <button type="button" onClick={stop}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-5 py-2.5 font-bold text-sm hover:scale-[1.02] transition">
            <span className="size-2 rounded-sm bg-rose-500" /> Stop & check
          </button>
        )}
        <button type="button" onClick={playCorrect}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-400 text-black px-4 py-2.5 font-bold text-sm hover:scale-[1.02] transition">
          <Play className="size-4" /> Play correct ayah
        </button>
        {loading && <span className="inline-flex items-center gap-2 text-slate-300 text-sm"><Loader2 className="size-4 animate-spin" /> Transcribing & analysing…</span>}
      </div>
      <ErrorBox error={error} />
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-200">
        <Smartphone className="size-4" /> Phone recorder (permission ke baghair)
        <input type="file" accept="audio/*" capture="user" className="sr-only"
          onChange={(event) => { const file = event.target.files?.[0]; if (file) void submit(file); event.target.value = ""; }} />
      </label>
      {showMicHelp && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
          <button type="button" onClick={openMicTab}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300">
            <ExternalLink className="size-4" /> Open microphone in new tab
          </button>
          <span className="text-xs text-amber-100">Naye tab mein Start recording → Allow dabayen.</span>
        </div>
      )}

      {data && (
        <div className="space-y-3">
          <div className={`rounded-2xl border p-4 ${badge}`}>
            <p className="font-bold">Score: {data.score}/100 · {data.overall.toUpperCase()}</p>
            <p className="text-sm mt-1">{data.summary}</p>
          </div>

          <div className="rounded-xl bg-black/20 border border-white/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-2">Word-by-word</p>
            <div dir="rtl" className="font-uthmani text-2xl leading-loose text-right flex flex-wrap gap-x-2 gap-y-1 justify-end">
              {data.words.map((w, i) => {
                const cls =
                  w.status === "ok" ? "text-white"
                  : w.status === "wrong" ? "bg-rose-500/25 text-rose-100 border-b-2 border-rose-400 px-1 rounded"
                  : w.status === "missing" ? "text-rose-300 line-through decoration-rose-400"
                  : "text-amber-300 italic";
                return (
                  <span key={i} className={cls} title={w.issue || w.status}>
                    {w.status === "extra" ? `+${w.heard}` : w.expected || w.heard}
                  </span>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              <span className="text-rose-300">Red</span> = wrong · <span className="line-through decoration-rose-400 text-rose-300">strike</span> = missing · <span className="text-amber-300">amber</span> = extra
            </p>
          </div>

          {data.words.some((w) => w.status !== "ok") && (
            <div className="rounded-xl bg-black/20 border border-white/10 p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Mistakes explained</p>
              {data.words.filter((w) => w.status !== "ok").map((w, i) => (
                <div key={i} className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-0">
                  <div className="text-sm">
                    <span className="font-uthmani text-lg text-white mr-2" dir="rtl">{w.expected || "—"}</span>
                    {w.heard && <span className="text-rose-300 text-xs">(aapne kaha: {w.heard})</span>}
                    <p className="text-slate-300 mt-0.5">{w.issue}</p>
                  </div>
                  <button onClick={() => speak(w.issue)} className="shrink-0 text-teal-300 hover:text-teal-200 text-xs inline-flex items-center gap-1">
                    <Ear className="size-3" /> Sunain
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-black/20 border border-white/10 p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">You said</p>
            <p className="font-uthmani text-white text-right text-xl leading-loose mt-1" dir="rtl">{data.transcript}</p>
          </div>

          {data.tips.length > 0 && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-400/20 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Practice tips</p>
              <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
                {data.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ---------- Shared ---------- */
const inputCls = "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/40";

function Input({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function SubmitBtn({ loading, onClick, children }: { loading: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-black px-5 py-2.5 font-bold text-sm hover:scale-[1.02] transition disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {children}
    </button>
  );
}
function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-rose-300 text-sm">{error}</p>;
}
function ToolHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
    </div>
  );
}
function AiCard({ title, md }: { title: string; md: string }) {
  return (
    <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-2">{title}</p>
      <div className="prose prose-invert prose-sm max-w-none text-slate-200">
        <ReactMarkdown>{md}</ReactMarkdown>
      </div>
    </div>
  );
}
