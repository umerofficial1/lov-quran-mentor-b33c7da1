import { createFileRoute, Link } from "@tanstack/react-router";
import tajweedBasics from "@/assets/tajweed-basics.jpg";
import tajweedAdvanced from "@/assets/tajweed-advanced.jpg";
import { RecitersSection } from "@/components/ReciterSection";
import { FamousClipsSection } from "@/components/FamousClipsSection";
import { LanguagesSection } from "@/components/LanguagesSection";
import { DailyAyah } from "@/components/DailyAyah";
import { SiteNav } from "@/components/SiteNav";
import { BookOpen, MessageSquare, Mic, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Love Qran — قرآن سیکھنے کا اسلامی پلیٹ فارم" },
      {
        name: "description",
        content:
          "Learn the Holy Quran with tajweed, translations, hifz tracking, AI teacher, and recitations from world-renowned Qaris.",
      },
      { property: "og:title", content: "Love Qran — قرآن سیکھنے کا پلیٹ فارم" },
      {
        property: "og:description",
        content: "تجوید، ترجمہ، حفظ ٹریکر اور AI قرآن ٹیچر — ایک ہی جگہ پر۔",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen text-slate-200 font-ui selection:bg-amber-500/30">
      <SiteNav />

      {/* Feature shortcuts */}
      <section className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/quran" className="group p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-400/30 hover:bg-white/10 transition-all">
          <BookOpen className="size-6 text-amber-400 mb-3" />
          <p className="font-bold text-white">Full Quran</p>
          <p className="text-xs text-slate-400 mt-1">114 surahs • audio • bookmarks</p>
        </Link>
        <Link to="/chat" className="group p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-400/30 hover:bg-white/10 transition-all">
          <MessageSquare className="size-6 text-amber-400 mb-3" />
          <p className="font-bold text-white">AI Teacher</p>
          <p className="text-xs text-slate-400 mt-1">Quran, Tafsir, Tajweed Q&amp;A</p>
        </Link>
        <Link to="/chat" className="group p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-400/30 hover:bg-white/10 transition-all">
          <Mic className="size-6 text-amber-400 mb-3" />
          <p className="font-bold text-white">Tajweed Coach</p>
          <p className="text-xs text-slate-400 mt-1">Ask for pronunciation help</p>
        </Link>
        <Link to="/auth" className="group p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-400/30 hover:bg-white/10 transition-all">
          <Trophy className="size-6 text-amber-400 mb-3" />
          <p className="font-bold text-white">Track Hifz</p>
          <p className="text-xs text-slate-400 mt-1">Sign in to save progress</p>
        </Link>
      </section>


      <main className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <h1 className="sr-only">Love Qran — Learn the Quran</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">
            <DailyAyah />

            {/* Featured Courses */}
            <section id="tajweed">
              <div className="flex items-end justify-between mb-6 px-2">
                <div>
                  <h2 className="text-2xl font-bold text-white">تجوید لرننگ</h2>
                  <p className="text-slate-400 text-sm">قرآن کو خوبصورتی سے پڑھنا سیکھیں</p>
                </div>
                <a href="#languages" className="text-amber-400 font-bold text-sm hover:text-amber-300">
                  View All Courses
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <article className="group rounded-3xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-amber-400/30 transition-all">
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={tajweedBasics}
                      alt="Tajweed basics — Islamic calligraphy"
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">مخارج الحروف</h3>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                      حروف کے درست تلفظ اور ان کے نکلنے کی جگہوں کی پہچان۔
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-400/20">
                        Beginner
                      </span>
                      <span className="text-amber-400 text-xs font-bold">12 اسباق</span>
                    </div>
                  </div>
                </article>
                <article className="group rounded-3xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-amber-400/30 transition-all">
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={tajweedAdvanced}
                      alt="Advanced tajweed — open Quran pages"
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">مد اور غنہ کے قواعد</h3>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                      تلاوت میں خوبصورتی پیدا کرنے کے لیے مد اور غنہ کا استعمال۔
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-400/20">
                        Advanced
                      </span>
                      <span className="text-amber-400 text-xs font-bold">08 اسباق</span>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Progress Tracker */}
            <div id="hifz" className="rounded-3xl bg-emerald-800/40 backdrop-blur-xl border border-emerald-400/20 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs bg-amber-500/5">
                    14%
                  </div>
                  <h3 className="text-xl font-bold text-white">آپ کی ترقی</h3>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-emerald-300/80">
                    <span>حفظ القرآن</span>
                    <span>14%</span>
                  </div>
                  <div className="h-2 w-full bg-emerald-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 w-[14%] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-[10px] text-slate-400 mt-1">یاد کی گئی سورتیں</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-bold text-white">152</p>
                    <p className="text-[10px] text-slate-400 mt-1">ٹوٹل منٹس</p>
                  </div>
                </div>
                <button className="w-full py-3 rounded-2xl bg-white text-emerald-950 font-bold text-sm hover:bg-amber-50 transition-colors shadow-lg">
                  پروگریس دیکھیں
                </button>
              </div>
            </div>

            {/* AI Teacher */}
            <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-lg shadow-amber-500/30">
                  <div className="size-2 bg-emerald-950 rounded-full animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-white">قرآن ٹیچر AI</h4>
                  <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Online Assistant</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-4">
                <p className="text-sm text-slate-300 italic leading-relaxed" dir="rtl">
                  "کیا آپ سورۃ الفاتحہ کی تجوید چیک کرنا چاہتے ہیں؟"
                </p>
              </div>
              <input
                type="text"
                placeholder="سوال پوچھیں..."
                dir="rtl"
                className="w-full text-sm bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:bg-black/30 transition-all"
              />
            </div>

            {/* Prayer Times */}
            <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase">14 Shaban</span>
                <h4 className="font-bold text-white">اسلامی کیلنڈر</h4>
              </div>
              <div className="p-2">
                {[
                  { name: "Fajr", time: "05:12 AM", active: false },
                  { name: "Dhuhr", time: "12:30 PM", active: true },
                  { name: "Asr", time: "04:45 PM", active: false },
                  { name: "Maghrib", time: "06:58 PM", active: false },
                  { name: "Isha", time: "08:22 PM", active: false },
                ].map((p) => (
                  <div
                    key={p.name}
                    className={
                      p.active
                        ? "flex justify-between items-center p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30"
                        : "flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 transition-colors"
                    }
                  >
                    <span className={p.active ? "text-sm font-bold text-emerald-300" : "text-sm text-slate-400"}>
                      {p.name}
                    </span>
                    <span className={p.active ? "text-sm font-bold text-white" : "text-sm font-medium text-slate-300"}>
                      {p.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div id="reciters">
        <RecitersSection />
      </div>
      <FamousClipsSection />
      <LanguagesSection />

      {/* Sticky Player */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg z-40">
        <div className="bg-emerald-950/85 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-600 border border-emerald-400/30 shadow-lg grid place-items-center text-white font-bold">
            01
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Now Playing</p>
            <p className="text-sm font-bold text-white truncate">Surah Al-Fatihah — Mishary Alafasy</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button aria-label="Previous" className="size-8 rounded-full bg-white/5 text-white/70 hover:text-white flex items-center justify-center">
              ⏮
            </button>
            <button aria-label="Play" className="size-10 rounded-full bg-white text-emerald-950 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              ▶
            </button>
            <button aria-label="Next" className="size-8 rounded-full bg-white/5 text-white/70 hover:text-white flex items-center justify-center">
              ⏭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
