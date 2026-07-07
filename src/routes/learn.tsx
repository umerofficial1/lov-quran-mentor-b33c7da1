import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import {
  Brain, Languages, GraduationCap, CalendarRange, Ear, ScanSearch, Sparkles, Play, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import {
  translationCompare, generateQuiz, memorizationCoach, revisionPlanner, mistakeChecker, listeningTest,
} from "@/lib/ai.functions";
import { ayahAudioUrl, RECITERS } from "@/lib/reciters";

export const Route = createFileRoute("/learn")({
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
  const [tab, setTab] = useState<Tab>("compare");
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
  const evalFn = useServerFn(listeningTest);
  const [surah, setSurah] = useState(112);
  const [ayah, setAyah] = useState(1);
  const [reciterId, setReciterId] = useState(RECITERS[1].id);
  const [answer, setAnswer] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { loading, error, data, run, setData } = useRun((a) => evalFn({ data: a as { verseKey: string; answer: string } }));

  const play = () => {
    const r = RECITERS.find((x) => x.id === reciterId) ?? RECITERS[1];
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = ayahAudioUrl(r, surah, ayah);
    void audioRef.current.play();
  };

  return (
    <div className="space-y-4">
      <ToolHeader title="Listening test" desc="Play a random or chosen ayah, then write what you heard. AI scores your answer." />
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
      </div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        placeholder="Type what you heard (Arabic or transliteration)…"
        dir="rtl"
        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/40"
      />
      <SubmitBtn loading={loading} onClick={() => run({ verseKey: `${surah}:${ayah}`, answer })}>Check my answer</SubmitBtn>
      <ErrorBox error={error} />
      {data && (
        <div className={`rounded-2xl border p-4 ${
          data.verdict === "correct" ? "bg-emerald-500/10 border-emerald-400/40"
          : data.verdict === "close" ? "bg-amber-400/10 border-amber-400/40"
          : "bg-rose-500/10 border-rose-400/40"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {data.verdict === "correct" ? <CheckCircle2 className="size-5 text-emerald-300" /> : <XCircle className="size-5 text-rose-300" />}
            <p className="font-bold text-white">Score: {data.score}/100 · {data.verdict}</p>
          </div>
          <p className="text-slate-200 text-sm">{data.notes}</p>
          <p className="mt-3 font-uthmani text-white text-right text-2xl leading-loose" dir="rtl">{data.correct}</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Mistake ---------- */
function MistakeTool() {
  const checkFn = useServerFn(mistakeChecker);
  const [verseKey, setVerseKey] = useState("1:1");
  const [transcript, setTranscript] = useState("");
  const { loading, error, data, run } = useRun((a) => checkFn({ data: a as { verseKey: string; transcript: string } }));

  return (
    <div className="space-y-4">
      <ToolHeader title="Mistake checker" desc="Type or transcribe what you recited. AI compares to the exact ayah and flags mistakes." />
      <Input label="Verse (Surah:Ayah)"><input value={verseKey} onChange={(e) => setVerseKey(e.target.value)} className={inputCls} /></Input>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={4}
        dir="rtl"
        placeholder="Paste your recitation transcript…"
        className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/40"
      />
      <SubmitBtn loading={loading} onClick={() => run({ verseKey, transcript })}>Check for mistakes</SubmitBtn>
      <ErrorBox error={error} />
      {data && (
        <div className="space-y-3">
          <div className="rounded-xl bg-black/20 border border-white/10 p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Correct</p>
            <p className="font-uthmani text-white text-right text-2xl leading-loose mt-1" dir="rtl">{data.correct}</p>
          </div>
          <AiCard title="AI feedback" md={data.feedback} />
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
