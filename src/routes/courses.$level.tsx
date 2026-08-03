import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { ArrowRight, BookOpen, Mic, Sparkles, GraduationCap, Brain, ScanSearch, Languages, CalendarRange, Ear } from "lucide-react";

type LevelKey = "beginner" | "intermediate" | "research";

type Lesson = {
  title: string;
  desc: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  icon: React.ReactNode;
  cta: string;
};

type Course = {
  key: LevelKey;
  arabicMark: string;
  level: string;
  title: string;
  arabicTitle: string;
  urduTitle: string;
  tone: "teal" | "gold";
  intro: string;
  totalLessons: string;
  totalHours: string;
  lessons: Lesson[];
};

const COURSES: Record<LevelKey, Course> = {
  beginner: {
    key: "beginner",
    arabicMark: "ع",
    level: "Beginner",
    title: "Art of Recitation",
    arabicTitle: "فَنُّ التِّلَاوَة",
    urduTitle: "فن تلاوت",
    tone: "teal",
    intro:
      "Ground your recitation in classical tajweed. Twelve guided lessons walk you from the alphabet to fluent Surah recitation, with AI feedback on Makharij and articulation.",
    totalLessons: "12 Lessons",
    totalHours: "8 Hours",
    lessons: [
      {
        title: "Alphabet & Makharij",
        desc: "Learn the 28 Arabic letters and their exact points of articulation with slow master audio.",
        to: "/quran/$surahId",
        params: { surahId: "1" },
        icon: <BookOpen className="size-4" />,
        cta: "Open Surah Al-Fatiha",
      },
      {
        title: "Short vowels & sukun",
        desc: "Read Fatha, Kasra, Damma and Sukun with tajweed-colored text on the Uthmani mushaf.",
        to: "/quran/$surahId",
        params: { surahId: "112" },
        icon: <BookOpen className="size-4" />,
        cta: "Read Surah Al-Ikhlas",
      },
      {
        title: "AI voice coach — recite an ayah",
        desc: "Record any ayah and get real-time feedback on your pronunciation and flow.",
        to: "/learn",
        search: { tool: "mistake", start: "voice" },
        icon: <Mic className="size-4" />,
        cta: "Start voice session",
      },
      {
        title: "Common mistakes on Surah Al-Fatiha",
        desc: "AI checks your recitation against the reference and points out slips.",
        to: "/learn",
        icon: <ScanSearch className="size-4" />,
        cta: "Open mistake checker",
      },
    ],
  },
  intermediate: {
    key: "intermediate",
    arabicMark: "ت",
    level: "Intermediate",
    title: "Linguistic Miracles",
    arabicTitle: "بَلَاغَةُ الْقُرْآن",
    urduTitle: "قرآنی بلاغت",
    tone: "gold",
    intro:
      "Dive into Balagha, grammar and rhetorical structure. Compare translations, study word-by-word grammar and understand why the Quranic wording is unmatched.",
    totalLessons: "24 Lessons",
    totalHours: "16 Hours",
    lessons: [
      {
        title: "Word-by-word grammar walkthrough",
        desc: "Read Al-Baqarah with root letters, grammar notes and per-word pronunciation.",
        to: "/quran/$surahId",
        params: { surahId: "2" },
        icon: <BookOpen className="size-4" />,
        cta: "Open Al-Baqarah",
      },
      {
        title: "Translation compare (5 scholars)",
        desc: "See Saheeh Intl., Pickthall, Maududi, Jalandhari and Kanz-ul-Iman side by side with AI notes.",
        to: "/learn",
        icon: <Languages className="size-4" />,
        cta: "Open translation compare",
      },
      {
        title: "Balagha quiz — Ayat al-Kursi",
        desc: "AI generates multiple-choice questions on rhetoric and structure.",
        to: "/learn",
        icon: <Brain className="size-4" />,
        cta: "Open quiz mode",
      },
      {
        title: "Memorization coach",
        desc: "Get a personalized hifz plan for any surah, tailored to your pace.",
        to: "/learn",
        icon: <GraduationCap className="size-4" />,
        cta: "Plan a surah",
      },
    ],
  },
  research: {
    key: "research",
    arabicMark: "ق",
    level: "Research",
    title: "Historical Tafsir",
    arabicTitle: "تَارِيخُ التَّفْسِير",
    urduTitle: "تفسیر کی تاریخ",
    tone: "teal",
    intro:
      "Trace the evolution of Quranic exegesis from classical mufassirun to contemporary thought. Study five major tafasir side by side with primary sources.",
    totalLessons: "18 Lessons",
    totalHours: "12 Hours",
    lessons: [
      {
        title: "Compare five classical tafasir",
        desc: "Ibn Kathir, Maariful Quran, Tafheem, Jalalayn and Ibn Abbas — open any ayah's Tafsir panel.",
        to: "/quran/$surahId",
        params: { surahId: "2" },
        icon: <BookOpen className="size-4" />,
        cta: "Open Al-Baqarah",
      },
      {
        title: "Revision planner across surahs",
        desc: "AI plans a weekly cycle across your memorized surahs so review never lapses.",
        to: "/learn",
        icon: <CalendarRange className="size-4" />,
        cta: "Open revision planner",
      },
      {
        title: "Topic search & root words",
        desc: "Search across the Quran by topic, root word, ayah or surah in Arabic, English and Urdu.",
        to: "/search",
        icon: <ScanSearch className="size-4" />,
        cta: "Open advanced search",
      },
      {
        title: "Ask the AI mentor — scholarly mode",
        desc: "Context-aware answers with verse references and translation comparison.",
        to: "/chat",
        icon: <Sparkles className="size-4" />,
        cta: "Open AI mentor",
      },
      {
        title: "Listening test — identify the ayah",
        desc: "Sharpen recognition by identifying ayat from short audio clips.",
        to: "/learn",
        icon: <Ear className="size-4" />,
        cta: "Open listening test",
      },
    ],
  },
};

export const Route = createFileRoute("/courses/$level")({
  head: ({ params }) => {
    const c = COURSES[(params.level as LevelKey)] ?? null;
    const label = c ? `${c.level} — ${c.title}` : "Course";
    return {
      meta: [
        { title: `${label} · Verse Wise Mentor` },
        {
          name: "description",
          content: c?.intro ?? "Structured Quran learning track at Verse Wise Mentor.",
        },
        { property: "og:title", content: `${label} · Verse Wise Mentor` },
        { property: "og:description", content: c?.intro ?? "Structured Quran learning track." },
      ],
    };
  },
  loader: ({ params }) => {
    if (!COURSES[params.level as LevelKey]) throw notFound();
    return null;
  },
  notFoundComponent: CourseNotFound,
  component: () => (<CoursePage />),
});

function CoursePage() {
  const { level } = Route.useParams();
  const c = COURSES[level as LevelKey];
  const toneBg = c.tone === "teal" ? "bg-[#2FD4A7] text-[#04100D]" : "bg-[#E0B15A] text-[#04100D]";
  const toneText = c.tone === "teal" ? "text-[#2FD4A7]" : "text-[#E0B15A]";

  return (
    <div className="min-h-dvh pb-28 md:pb-16 bg-[#04100D] text-white">
      <SiteNav />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <Link
          to="/"
          className="text-white/50 hover:text-[#E0B15A] text-[11px] uppercase tracking-[0.3em] transition-colors"
        >
          ← Back to home
        </Link>

        <header className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end border-b border-white/10 pb-10">
          <div>
            <span className={`inline-block px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${toneBg}`}>
              {c.level}
            </span>
            <h1 className="font-display text-4xl md:text-6xl mt-4 leading-tight">{c.title}</h1>
            <p className="font-arabic text-2xl text-white/80 mt-3" dir="rtl">{c.arabicTitle}</p>
            <p className="font-urdu text-lg text-white/60 mt-1" dir="rtl">{c.urduTitle}</p>
            <p className="text-white/60 leading-relaxed mt-5 max-w-2xl">{c.intro}</p>
            <div className="flex flex-wrap gap-3 mt-6 text-[10px] uppercase tracking-widest text-white/50">
              <span className="px-3 py-1 border border-white/10">{c.totalLessons}</span>
              <span className="px-3 py-1 border border-white/10">{c.totalHours}</span>
              <span className="px-3 py-1 border border-white/10">Self-paced</span>
            </div>
          </div>
          <span className="font-arabic text-[8rem] leading-none text-white/10 select-none hidden md:block">
            {c.arabicMark}
          </span>
        </header>

        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <span className={`text-[11px] uppercase tracking-[0.4em] ${toneText}`}>Curriculum</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <ol className="space-y-4">
            {c.lessons.map((l, i) => (
              <li key={l.title}>
                <Link
                  to={l.to}
                  params={l.params as never}
                  search={l.search as never}
                  className="group grid grid-cols-[auto_1fr_auto] gap-5 items-center p-5 md:p-6 bg-[#0B2420]/60 border border-white/10 hover:border-[#E0B15A]/40 hover:bg-[#0B2420] transition-all"
                >
                  <span className="font-display text-2xl text-white/40 group-hover:text-[#E0B15A] w-10 text-center transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="flex items-center gap-2 text-[#E9F5F0] font-display text-lg">
                      <span className={toneText}>{l.icon}</span>
                      {l.title}
                    </span>
                    <span className="block text-sm text-white/60 mt-1 leading-relaxed">{l.desc}</span>
                  </span>
                  <span className="hidden md:inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/60 group-hover:text-[#E0B15A] transition-colors">
                    {l.cta} <ArrowRight className="size-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 flex flex-wrap gap-4">
          {(["beginner", "intermediate", "research"] as LevelKey[])
            .filter((k) => k !== c.key)
            .map((k) => (
              <Link
                key={k}
                to="/courses/$level"
                params={{ level: k }}
                className="text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-[#E0B15A] transition-colors inline-flex items-center gap-2 border border-white/10 px-4 py-2"
              >
                Continue to {COURSES[k].level} <ArrowRight className="size-3" />
              </Link>
            ))}
        </section>
      </main>

      <MobileNav />
    </div>
  );
}

function CourseNotFound() {
  return (
    <div className="min-h-dvh bg-[#04100D] text-white">
      <SiteNav />
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-[#E0B15A] text-[11px] uppercase tracking-[0.4em]">404</p>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Course not found</h1>
        <p className="text-white/60 mt-4">Pick a level to continue.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {(["beginner", "intermediate", "research"] as LevelKey[]).map((k) => (
            <Link
              key={k}
              to="/courses/$level"
              params={{ level: k }}
              className="px-5 py-2 bg-[#2FD4A7] text-[#04100D] text-[11px] uppercase tracking-widest font-semibold hover:bg-[#0F7A63] transition-colors"
            >
              {COURSES[k].level}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
