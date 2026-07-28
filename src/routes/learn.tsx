import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import {
  Brain, Languages, GraduationCap, CalendarRange, Ear, ScanSearch, Sparkles, Play, Loader2, CheckCircle2, XCircle, Mic, Square, Smartphone, AudioLines,
} from "lucide-react";
import {
  translationCompare, generateQuiz, memorizationCoach, revisionPlanner,
} from "@/lib/ai.functions";
import { ayahAudioUrl, RECITERS } from "@/lib/reciters";
import { releaseMicrophoneStream, requestMicrophoneStream } from "@/lib/microphone";
import { diffAyah } from "@/lib/ayah-diff";
import { startLiveWavRecorder, type LiveWavRecorder } from "@/lib/live-wav-recorder";
import { mergeArabicTranscript } from "@/lib/ayah-diff";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "sonner";


export const Route = createFileRoute("/learn")({
  validateSearch: (search: Record<string, unknown>) => ({
    tool:
      search.tool === "mistake" ? ("mistake" as const)
      : search.tool === "record" ? ("record" as const)
      : undefined,
    start: search.start === "voice" ? ("voice" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Learn — Quiz, Memorization Coach & Translation Compare · Verse Wise Mentor" },
      {
        name: "description",
        content:
          "AI-powered Quran learning: translation compare, quiz mode, memorization coach, revision planner, listening test, mistake checker and voice recorder.",
      },
      { property: "og:title", content: "AI Learn — Verse Wise Mentor" },
      { property: "og:description", content: "Seven AI-guided tools to learn, memorize and revise the Quran." },
      { property: "og:url", content: "https://lov-quran-mentor.lovable.app/learn" },
    ],
    links: [{ rel: "canonical", href: "https://lov-quran-mentor.lovable.app/learn" }],
  }),
  component: () => (<RequireAuth><LearnPage /></RequireAuth>),
});

type Tab = "compare" | "quiz" | "coach" | "revise" | "listen" | "mistake" | "record";

const TABS: { id: Tab; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "compare", label: "Translation compare", icon: <Languages className="size-4" />, hint: "See 5 translations side-by-side + AI notes" },
  { id: "quiz",    label: "Quiz mode",           icon: <Brain className="size-4" />,      hint: "AI-generated MCQ on any topic" },
  { id: "coach",   label: "Memorization coach",  icon: <GraduationCap className="size-4" />, hint: "Personalized hifz plan for one surah" },
  { id: "revise",  label: "Revision planner",    icon: <CalendarRange className="size-4" />, hint: "Weekly cycle across memorized surahs" },
  { id: "listen",  label: "Listening test",      icon: <Ear className="size-4" />,        hint: "Listen and identify the ayah" },
  { id: "mistake", label: "Mistake checker",     icon: <ScanSearch className="size-4" />, hint: "Compare your recitation to the ayah" },
  { id: "record",  label: "Voice recorder",      icon: <AudioLines className="size-4" />, hint: "Record, replay, download your recitation" },
];

function LearnPage() {
  const { tool } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(tool ?? "compare");
  const { user } = useAuth();

  return (
    <div className="min-h-dvh pb-28 md:pb-16">
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
          {tab === "record" && <VoiceRecorder />}
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
        onSubmit={(e) => {
          e.preventDefault();
          const v = verseKey.trim();
          if (!/^\d+:\d+$/.test(v)) {
            toast.error("Enter a valid reference like 2:255");
            return;
          }
          run({ verseKey: v });
        }}
        className="flex gap-2"
      >
        <input
          value={verseKey}
          onChange={(e) => setVerseKey(e.target.value)}
          placeholder="e.g. 2:255"
          inputMode="text"
          pattern="\d+:\d+"
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
      const res = await authFetch("/api/mistake-check-voice", { method: "POST", body: fd });
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
      const stream = await requestMicrophoneStream();
      streamRef.current = stream;
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => void checkRecording(new Blob(chunksRef.current, { type: recorder.mimeType || mime || "audio/webm" }));
      recRef.current = recorder;
      recorder.start(250);
      setRecording(true);
    } catch (cause) {
      releaseMicrophoneStream(streamRef.current);
      const permissionDenied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setError(permissionDenied
        ? "Browser ne microphone access deny kiya. Start voice answer dobara dabayen aur saamne aane wale Allow button ko select karein."
        : "Microphone start nahi hua. Kisi doosre app ki recording band karke dobara try karein.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recRef.current?.stop();
    releaseMicrophoneStream(streamRef.current);
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
  const [expected, setExpected] = useState<string>("");
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MistakeResult | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const liveRecorderRef = useRef<LiveWavRecorder | null>(null);
  const transcriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch the correct Arabic whenever verseKey changes.
  useEffect(() => {
    if (!/^\d+:\d+$/.test(verseKey)) { setExpected(""); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${verseKey}`);
        const j = r.ok ? await r.json() : { verses: [] };
        const text = j.verses?.[0]?.text_uthmani ?? "";
        if (!cancelled) setExpected(text);
      } catch { if (!cancelled) setExpected(""); }
    })();
    return () => { cancelled = true; };
  }, [verseKey]);

  const sendChunk = async ({ blob, speechDetected }: { blob: Blob; speechDetected: boolean }) => {
    if (!speechDetected) return;
    if (blob.size < 1024) return;
    const fd = new FormData();
    fd.append("audio", blob, "chunk.wav");
    const shortContext = expected.trim().split(/\s+/).slice(0, 30).join(" ");
    if (shortContext) fd.append("quranContext", shortContext);
    try {
      const r = await authFetch("/api/transcribe-chunk", { method: "POST", body: fd });
      const result = await r.json() as { text?: string; error?: string };
      if (!r.ok) {
        setError(result.error || "Voice process nahi hui. Dobara parhein.");
        return;
      }
      const clean = (result.text ?? "").trim().replace(/^[\s.,،۔…!?؟]+$|^[\s]+$/g, "");
      if (!clean) return;
      transcriptRef.current = mergeArabicTranscript(transcriptRef.current, clean);
      setLiveTranscript(transcriptRef.current);
      setError(null);
    } catch {
      setError("Internet ki wajah se voice process nahi hui. Recording jari rakhein.");
    }
  };

  const startLive = async () => {
    setError(null);
    setData(null);
    setLiveTranscript("");
    transcriptRef.current = "";

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Is browser mein microphone recording available nahi. App ko HTTPS par Chrome ya Safari mein kholen.");
      return;
    }
    try {
      const { recorder, stream } = await startLiveWavRecorder(
        requestMicrophoneStream,
        sendChunk,
      );
      streamRef.current = stream;
      liveRecorderRef.current = recorder;
      setRecording(true);
    } catch (cause) {
      releaseMicrophoneStream(streamRef.current);
      streamRef.current = null;
      liveRecorderRef.current = null;
      const denied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      const unavailable = cause instanceof DOMException && (cause.name === "NotFoundError" || cause.name === "NotReadableError");
      setError(denied
        ? "Mic access allow nahi hua. Start reciting dobara dabayen aur browser ke Allow par tap karein."
        : unavailable
          ? "Is device par microphone available nahi mila."
          : "Mic start nahi ho saka. Start reciting dobara dabayen.");
    }
  };

  const stopLive = async () => {
    setRecording(false);
    await liveRecorderRef.current?.stop();
    liveRecorderRef.current = null;
    releaseMicrophoneStream(streamRef.current);
    streamRef.current = null;

    const finalTranscript = transcriptRef.current.trim();
    if (!finalTranscript) {
      setError("Koi awaaz sunai nahi di. Mic check karke dobara Start dabayen.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await authFetch("/api/mistake-check-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscript, verseKey }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // Cleanup on unmount.
  useEffect(() => () => {
    void liveRecorderRef.current?.stop();
    releaseMicrophoneStream(streamRef.current);
  }, []);

  const liveDiff = expected ? diffAyah(expected, liveTranscript, { finished: false }) : null;

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
      <ToolHeader title="Live recitation coach" desc="Ayah parhna shuru karein — lafz sath sath likhy jayenge aur galtiyan wahi highlight ho jayengi." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input label="Verse (Surah:Ayah)"><input value={verseKey} onChange={(e) => setVerseKey(e.target.value)} className={inputCls} /></Input>
        <Input label="Correct-ayah reciter">
          <select value={reciterId} onChange={(e) => setReciterId(e.target.value)} className={inputCls}>
            {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Input>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {!recording ? (
          <button type="button" onClick={startLive} disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 text-white px-5 py-2.5 font-bold text-sm hover:scale-[1.02] transition disabled:opacity-50">
            <Mic className="size-4" /> Start reciting
          </button>
        ) : (
          <button type="button" onClick={stopLive}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-5 py-2.5 font-bold text-sm hover:scale-[1.02] transition">
            <Square className="size-4 fill-current" /> Stop & analyse
          </button>
        )}
        <button type="button" onClick={playCorrect}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-400 text-black px-4 py-2.5 font-bold text-sm hover:scale-[1.02] transition">
          <Play className="size-4" /> Play correct ayah
        </button>
        {recording && (
          <span className="inline-flex items-center gap-2 text-rose-300 text-sm">
            <span className="size-2 rounded-full bg-rose-400 animate-pulse" /> Sun raha hoon…
          </span>
        )}
        {analyzing && (
          <span className="inline-flex items-center gap-2 text-slate-300 text-sm">
            <Loader2 className="size-4 animate-spin" /> Full analysis…
          </span>
        )}
        {liveDiff && (
          <span className="text-xs text-slate-400 ml-auto">{liveDiff.matched}/{liveDiff.total} words matched</span>
        )}
      </div>

      <ErrorBox error={error} />

      {expected && (
        <div className="rounded-2xl bg-black/25 border border-white/10 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-2">Expected ayah (live)</p>
          <div dir="rtl" className="font-uthmani text-3xl leading-loose text-right flex flex-wrap gap-x-3 gap-y-1 justify-end">
            {liveDiff?.words.map((w, i) => {
              const cls =
                w.status === "match" ? "text-emerald-300"
                : w.status === "wrong" ? "text-rose-300 underline decoration-rose-400 decoration-2"
                : w.status === "missing" ? "text-rose-400 line-through decoration-rose-400"
                : "text-slate-500";
              return <span key={i} className={cls}>{w.word}</span>;
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            <span className="text-emerald-300">Green</span> = sahi ·{" "}
            <span className="text-rose-300">Red</span> = galat ·{" "}
            <span className="text-slate-500">Grey</span> = abhi tak nahi parha
          </p>
          {liveDiff && liveDiff.extras.length > 0 && (
            <p className="text-[11px] text-amber-300 mt-2">
              Extra bola: {liveDiff.extras.slice(-6).join(" ")}
            </p>
          )}
        </div>
      )}

      {liveTranscript && (
        <div className="rounded-xl bg-black/20 border border-white/10 p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Aap ne parha (live)</p>
          <div className="font-uthmani text-right text-xl leading-loose mt-1 flex flex-wrap gap-x-2 justify-end" dir="rtl">
            {liveDiff?.spokenWords.map((word, index) => (
              <span
                key={`${word.word}-${index}`}
                className={word.status === "match" ? "text-emerald-300" : "text-rose-300 underline decoration-rose-400"}
              >
                {word.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-3">
          <div className={`rounded-2xl border p-4 ${badge}`}>
            <p className="font-bold">Score: {data.score ?? 0}/100 · {(data.overall ?? "minor").toUpperCase()}</p>
            <p className="text-sm mt-1">{data.summary ?? ""}</p>
          </div>

          {(data.words?.length ?? 0) > 0 && (
            <div className="rounded-xl bg-black/20 border border-white/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-2">Word-by-word (AI)</p>
              <div dir="rtl" className="font-uthmani text-2xl leading-loose text-right flex flex-wrap gap-x-2 gap-y-1 justify-end">
                {(data.words ?? []).map((w, i) => {
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
            </div>
          )}

          {(data.words ?? []).some((w) => w.status !== "ok") && (
            <div className="rounded-xl bg-black/20 border border-white/10 p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Mistakes explained</p>
              {(data.words ?? []).filter((w) => w.status !== "ok").map((w, i) => (
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

          {(data.tips?.length ?? 0) > 0 && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-400/20 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Practice tips</p>
              <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
                {(data.tips ?? []).map((t, i) => <li key={i}>{t}</li>)}
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
