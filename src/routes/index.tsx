import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RecitersSection } from "@/components/ReciterSection";
import { FamousClipsSection } from "@/components/FamousClipsSection";
import { LanguagesSection } from "@/components/LanguagesSection";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { BookOpen, MessageSquare, Compass, Trophy, Mic, GraduationCap, Users, ArrowRight, Play, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useReadingStats, formatDuration } from "@/hooks/use-reading-stats";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verse Wise Mentor — AI-guided Quran learning" },
      { name: "description", content: "A cinematic, scholarly Quran learning platform. AI tajweed voice coach, trilingual translations, tafsir library, hifz tracker and daily practice." },
      { property: "og:title", content: "Verse Wise Mentor — AI-guided Quran learning" },
      { property: "og:description", content: "Recitation, tafsir, hifz and Islamic tools in Arabic, English & Urdu — refined by AI, guided by tradition." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen text-[#EEF2FB] font-ui selection:bg-[#1FB6B0]/30">
      <SiteNav />

      {/* ============ HERO ============ */}
      <section className="relative min-h-[86vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#0F1E3D_0%,_#070C1F_70%)] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #C9A24C 1px, transparent 0)", backgroundSize: "44px 44px" }}
        />
        <div className="relative z-10 max-w-5xl text-center space-y-10 pt-20">
          <div className="inline-block px-4 py-1.5 border border-[#C9A24C]/30 rounded-full text-[#C9A24C] text-[11px] tracking-[0.35em] uppercase bg-[#0F1E3D]/50 backdrop-blur-sm">
            The Verse Wise Experience
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight">
            Master the <span className="text-[#1FB6B0] italic font-normal">Divine</span> Dialogue
          </h1>

          <p className="max-w-2xl mx-auto text-white/60 text-lg leading-relaxed">
            An AI-guided journey through the Quran — trilingual translations, tajweed voice coaching, tafsir excerpts, and daily practice, honoring classical scholarship.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-4">
            <div className="text-center md:text-right space-y-2 px-6">
              <p className="font-arabic text-5xl md:text-6xl leading-[1.5] text-[#1FB6B0]" dir="rtl">
                وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
              </p>
              <p className="font-urdu text-xl text-white/70 leading-loose" dir="rtl">
                اور قرآن کو ٹھہر ٹھہر کر ترتیل کے ساتھ پڑھیں
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              to="/quran"
              className="px-10 py-4 bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] font-semibold text-base rounded-sm transition-all shadow-[0_0_30px_rgba(201,162,76,0.25)] hover:shadow-[0_0_40px_rgba(201,162,76,0.45)] uppercase tracking-widest"
            >
              Begin Your Journey
            </Link>
            <Link
              to="/chat"
              className="px-8 py-4 border border-white/20 hover:border-[#1FB6B0] text-white/80 hover:text-[#1FB6B0] transition-colors text-sm uppercase tracking-widest inline-flex items-center gap-2"
            >
              <Play className="size-4" /> Meet the AI Mentor
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-[10px] tracking-[0.4em] uppercase">
          Scroll for today's ayah
        </div>
      </section>

      {/* ============ AYAH OF THE DAY + RIGHT RAIL ============ */}
      <section className="max-w-7xl mx-auto py-24 px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-[#C9A24C] text-[11px] uppercase tracking-[0.4em]">01 —</span>
            <span className="text-white/50 text-[11px] uppercase tracking-[0.3em]">Ayah of the Day</span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#C9A24C]/15 to-[#1FB6B0]/15 rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity" />
            <article className="relative bg-[#0F1E3D]/80 border border-white/10 p-8 md:p-12 rounded-lg backdrop-blur-sm">
              <div className="flex justify-between items-start mb-8">
                <span className="text-[#C9A24C] font-display italic text-xl">Al-Baqarah · 2:255</span>
                <button className="text-xs text-white/40 hover:text-[#1FB6B0] uppercase tracking-widest inline-flex items-center gap-1">
                  <Play className="size-3" /> Listen
                </button>
              </div>
              <p className="font-arabic text-4xl md:text-6xl text-center leading-[1.9] text-[#EEF2FB] mb-10" dir="rtl">
                اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
                <div className="space-y-2">
                  <p className="text-[#C9A24C] text-[10px] uppercase tracking-[0.3em]">English</p>
                  <p className="text-white/85 leading-relaxed font-display italic text-lg">
                    Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence.
                  </p>
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <p className="text-[#C9A24C] text-[10px] uppercase tracking-[0.3em] text-left">اردو</p>
                  <p className="font-urdu text-lg text-white/85 leading-[2.2]">
                    اللہ کے سوا کوئی معبود نہیں، وہ ہمیشہ زندہ اور سب کا قائم رکھنے والا ہے۔
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap items-center gap-4">
                <Link to="/quran/$surahId" params={{ surahId: "2" }} className="text-[#1FB6B0] hover:text-[#EEF2FB] text-sm uppercase tracking-widest inline-flex items-center gap-2 transition-colors">
                  Open Surah <ArrowRight className="size-4" />
                </Link>
                <span className="text-white/20">·</span>
                <Link to="/chat" className="text-white/60 hover:text-[#C9A24C] text-sm uppercase tracking-widest transition-colors">
                  Ask the Mentor about this Ayah
                </Link>
              </div>
            </article>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0F1E3D]/50 border-l-2 border-[#1FB6B0] p-6 backdrop-blur-sm">
            <h3 className="text-[#1FB6B0] font-semibold text-[11px] uppercase tracking-[0.35em] mb-4">Scholarly Assistant</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6 italic font-display">
              "Assalamu alaikum. Ayat al-Kursi anchors today's practice — shall I walk through its recitation, tafsir, and root words?"
            </p>
            <Link to="/chat" className="block w-full text-center py-3 bg-[#1FB6B0]/10 border border-[#1FB6B0]/40 text-[#1FB6B0] hover:bg-[#1FB6B0]/20 transition-colors text-xs font-medium uppercase tracking-widest">
              Open Mentor Insight
            </Link>
          </div>

          <JourneyPanel />


          <div className="bg-[#0F1E3D]/50 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[#C9A24C] font-display text-lg">Prayer Times</h4>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Today</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {[
                { name: "Fajr", time: "05:12", active: false },
                { name: "Dhuhr", time: "12:30", active: true },
                { name: "Asr", time: "16:45", active: false },
                { name: "Maghrib", time: "18:58", active: false },
                { name: "Isha", time: "20:22", active: false },
              ].map((p) => (
                <div key={p.name} className={`flex justify-between items-center px-3 py-2 rounded-sm ${p.active ? "bg-[#1FB6B0]/10 border-l-2 border-[#1FB6B0]" : ""}`}>
                  <span className={p.active ? "text-[#1FB6B0] font-medium" : "text-white/60"}>{p.name}</span>
                  <span className={p.active ? "text-[#EEF2FB] tabular-nums font-medium" : "text-white/50 tabular-nums"}>{p.time}</span>
                </div>
              ))}
            </div>
            <Link to="/tools" className="mt-4 inline-flex items-center gap-2 text-white/60 hover:text-[#C9A24C] text-xs uppercase tracking-widest transition-colors">
              Qibla & Islamic Tools <ArrowRight className="size-3" />
            </Link>
          </div>
        </aside>
      </section>

      {/* ============ FEATURE GRID ============ */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="mb-10 flex items-center gap-3">
          <span className="text-[#C9A24C] text-[11px] uppercase tracking-[0.4em]">02 —</span>
          <span className="text-white/50 text-[11px] uppercase tracking-[0.3em]">Explore</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureTile to="/quran" icon={<BookOpen className="size-5" />} title="Full Quran" sub="114 surahs · audio · bookmarks" />
          <FeatureTile to="/chat" icon={<MessageSquare className="size-5" />} title="AI Mentor" sub="Tafsir · tajweed · Q&A" />
          <FeatureTile to="/tools" icon={<Compass className="size-5" />} title="Islamic Tools" sub="Prayer · Qibla · Tasbeeh" />
          <FeatureTile to="/hifz" icon={<Trophy className="size-5" />} title="Hifz Tracker" sub="Memorize · revise · streaks" />
        </div>
      </section>

      {/* ============ ACADEMIC MODULES ============ */}
      <section className="max-w-7xl mx-auto py-24 px-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[#C9A24C] text-[11px] uppercase tracking-[0.4em]">03 —</span>
              <span className="text-white/50 text-[11px] uppercase tracking-[0.3em]">Academic Modules</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl">Scholarly Tracks</h2>
            <p className="text-white/50 font-urdu text-lg" dir="rtl">اعلیٰ تعلیمی نصاب اور تحقیق</p>
          </div>
          <Link to="/quran" className="text-[#1FB6B0] hover:text-[#EEF2FB] transition-colors flex items-center gap-2 text-sm uppercase tracking-widest gold-underline">
            View Curricula <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CourseCard
            arabicMark="ع"
            level="Beginner"
            title="Art of Recitation"
            desc="Mastering Makharij and phonetic nuance through AI-guided voice feedback."
            meta="12 Lessons · 8 Hours"
            levelTone="teal"
          />
          <CourseCard
            arabicMark="ت"
            level="Intermediate"
            title="Linguistic Miracles"
            desc="A deep dive into the Balagha and grammatical structure of the Quranic text."
            meta="24 Lessons · 16 Hours"
            levelTone="gold"
          />
          <CourseCard
            arabicMark="ق"
            level="Research"
            title="Historical Tafsir"
            desc="The evolution of Quranic exegesis, from classical mufassirun to modern thought."
            meta="18 Lessons · 12 Hours"
            levelTone="teal"
          />
        </div>
      </section>

      {/* ============ AI TAJWEED VOICE COACH TEASER ============ */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-[#0F1E3D]/60 border border-white/10 p-10 md:p-16 rounded-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[#C9A24C] text-[11px] uppercase tracking-[0.4em]">04 —</span>
              <span className="text-white/50 text-[11px] uppercase tracking-[0.3em]">AI Voice Coach</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
              Recite. Listen. <span className="italic text-[#1FB6B0]">Refine.</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Real-time tajweed feedback: recite any ayah into your microphone and the AI compares your pronunciation, elongation, and articulation points to a master reciter — ayah by ayah.
            </p>
            <StartVoiceSessionButton />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(31,182,176,0.15)_0%,_transparent_60%)]" />
            <div className="relative">
              <div className="w-40 h-40 rounded-full border border-[#1FB6B0]/40 flex items-center justify-center bg-[#070C1F]/60 backdrop-blur-sm">
                <div className="w-28 h-28 rounded-full border border-[#1FB6B0]/60 flex items-center justify-center">
                  <Mic className="size-10 text-[#1FB6B0]" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border border-[#1FB6B0]/20 animate-ping" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ ROLE ENTRANCES ============ */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="mb-10 flex items-center gap-3">
          <span className="text-[#C9A24C] text-[11px] uppercase tracking-[0.4em]">05 —</span>
          <span className="text-white/50 text-[11px] uppercase tracking-[0.3em]">For Everyone</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RoleCard icon={<GraduationCap className="size-5" />} title="Students" desc="Personal learning paths, daily plans and revision reminders." to="/dashboard" />
          <RoleCard icon={<Users className="size-5" />} title="Teachers" desc="Create courses, assign lessons and monitor cohorts." to="/dashboard" />
          <RoleCard icon={<Trophy className="size-5" />} title="Parents" desc="Track your child's memorization, streaks and attendance." to="/dashboard" />
        </div>
      </section>

      {/* Existing rich sections */}
      <div id="reciters" className="border-t border-white/5 mt-16">
        <RecitersSection />
      </div>
      <FamousClipsSection />
      <LanguagesSection />

      {/* Footer */}
      <footer className="border-t border-[#C9A24C]/20 mt-16 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-white/40">
          <span>© 2026 Verse Wise Mentor</span>
          <span className="text-[#C9A24C]">Guided by wisdom · Refined by AI</span>
        </div>
      </footer>

      <MobileNav />
    </div>
  );
}

function StartVoiceSessionButton() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const startVoiceSession = async () => {
    setStarting(true);
    try {
      const { requestMicrophoneStream } = await import("@/lib/microphone.client");
      await requestMicrophoneStream();
    } catch {
      // Continue to the recorder so the user can retry or upload audio.
    }
    await navigate({ to: "/learn", search: { tool: "mistake", start: "voice" } });
  };

  return (
    <button type="button" onClick={startVoiceSession} disabled={starting}
      className="inline-flex items-center gap-3 px-6 py-3 bg-[#1FB6B0] hover:bg-[#0E7A7A] text-[#070C1F] font-semibold text-sm uppercase tracking-widest transition-colors disabled:opacity-60">
      {starting ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
      {starting ? "Starting…" : "Start Voice Session"}
    </button>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="group cursor-default">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/60">{label}</span>
        <span className="text-[#1FB6B0] tabular-nums">{value}%</span>
      </div>
      <div className="h-1 w-full bg-white/10 overflow-hidden">
        <div className="h-full bg-[#1FB6B0] transition-all group-hover:bg-[#C9A24C]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function JourneyPanel() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-5">
        <h4 className="text-[#C9A24C] font-display text-lg border-b border-[#C9A24C]/20 pb-2">Your Journey</h4>
        <div className="space-y-4 animate-pulse">
          <div className="h-3 bg-white/5 rounded" />
          <div className="h-3 bg-white/5 rounded" />
          <div className="h-3 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-5 relative">
        <h4 className="text-[#C9A24C] font-display text-lg border-b border-[#C9A24C]/20 pb-2 flex items-center gap-2">
          Your Journey <Lock className="size-3.5 text-white/40" />
        </h4>
        <div className="space-y-4 opacity-40 select-none pointer-events-none">
          <ProgressBar label="Quran read" value={0} />
          <ProgressBar label="Hifz · Juz 30" value={0} />
          <ProgressBar label="Reading time" value={0} />
        </div>
        <div className="p-5 bg-[#0F1E3D]/60 border border-[#C9A24C]/20">
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            Sign in to track your recitation, hifz and reading time across devices.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] text-[11px] font-semibold uppercase tracking-widest transition-colors"
          >
            Sign in to unlock <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    );
  }

  return <SignedInJourney />;
}

function SignedInJourney() {
  const { percent, uniqueRead, totalAyahs, stats } = useReadingStats();
  const timeMin = Math.round(stats.totalMs / 60000);
  const timePct = Math.min(100, (timeMin / 600) * 100); // 10h baseline
  const sessionsPct = Math.min(100, (stats.sessions / 30) * 100);

  return (
    <div className="space-y-5">
      <h4 className="text-[#C9A24C] font-display text-lg border-b border-[#C9A24C]/20 pb-2">Your Journey</h4>
      <ProgressBar label={`Quran read · ${uniqueRead}/${totalAyahs} ayat`} value={percent} />
      <ProgressBar label={`Reading time · ${formatDuration(stats.totalMs)}`} value={timePct} />
      <ProgressBar label={`Sessions · ${stats.sessions}`} value={sessionsPct} />
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-[#1FB6B0] text-xs uppercase tracking-widest transition-colors">
        View Full Progress <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function FeatureTile({ to, icon, title, sub }: { to: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      to={to}
      className="group p-6 bg-[#0F1E3D]/60 border border-white/8 hover:border-[#C9A24C]/40 hover:bg-[#0F1E3D] transition-all backdrop-blur-sm"
    >
      <div className="text-[#C9A24C] mb-4 group-hover:text-[#1FB6B0] transition-colors">{icon}</div>
      <p className="font-display text-lg text-[#EEF2FB] mb-1">{title}</p>
      <p className="text-xs text-white/50 leading-relaxed">{sub}</p>
    </Link>
  );
}

function CourseCard({
  arabicMark,
  level,
  title,
  desc,
  meta,
  levelTone,
}: {
  arabicMark: string;
  level: string;
  title: string;
  desc: string;
  meta: string;
  levelTone: "teal" | "gold";
}) {
  const slug = level.toLowerCase() as "beginner" | "intermediate" | "research";
  return (
    <Link
      to="/courses/$level"
      params={{ level: slug }}
      className="group block bg-[#0F1E3D] border border-white/5 hover:border-[#C9A24C]/40 transition-all"
    >
      <div className="aspect-video bg-[#070C1F] relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1E3D] via-transparent to-transparent" />
        <span className="font-arabic text-[10rem] text-white/10 leading-none select-none group-hover:text-[#1FB6B0]/25 transition-colors">
          {arabicMark}
        </span>
        <div className="absolute bottom-4 left-4">
          <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${levelTone === "teal" ? "bg-[#1FB6B0] text-[#070C1F]" : "bg-[#C9A24C] text-[#070C1F]"}`}>
            {level}
          </span>
        </div>
      </div>
      <div className="p-7 space-y-4">
        <h3 className="text-xl font-display group-hover:text-[#C9A24C] transition-colors">{title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest pt-2 border-t border-white/5">
          <span className="text-white/40">{meta}</span>
          <span className="text-[#1FB6B0] group-hover:text-[#C9A24C] inline-flex items-center gap-1 transition-colors">
            Start <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function RoleCard({ icon, title, desc, to }: { icon: React.ReactNode; title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="group block p-8 bg-[#0F1E3D]/50 border border-white/8 hover:border-[#1FB6B0]/40 transition-all">
      <div className="text-[#C9A24C] mb-4">{icon}</div>
      <h3 className="font-display text-2xl mb-2 group-hover:text-[#1FB6B0] transition-colors">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#C9A24C]">
        Enter <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}
