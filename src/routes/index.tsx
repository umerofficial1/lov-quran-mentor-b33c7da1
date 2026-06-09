import { createFileRoute } from "@tanstack/react-router";
import tajweedBasics from "@/assets/tajweed-basics.jpg";
import tajweedAdvanced from "@/assets/tajweed-advanced.jpg";
import { RecitersSection } from "@/components/ReciterSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muhy Loveable — قرآن سیکھنے کا اسلامی پلیٹ فارم" },
      {
        name: "description",
        content:
          "Learn the Holy Quran with tajweed, translations, hifz tracking, AI teacher, and recitations from world-renowned Qaris.",
      },
      { property: "og:title", content: "Muhy Loveable — قرآن سیکھنے کا پلیٹ فارم" },
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
    <div className="min-h-screen bg-paper text-emerald-deep font-ui selection:bg-gold-leaf/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-emerald-deep/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold tracking-tight text-emerald-deep">
              MUHY <span className="text-gold-leaf">LOVEABLE</span>
            </span>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium opacity-70">
              <a href="#quran" className="hover:text-gold-leaf transition-colors">قرآن مجید</a>
              <a href="#tajweed" className="hover:text-gold-leaf transition-colors">تجوید</a>
              <a href="#hifz" className="hover:text-gold-leaf transition-colors">حفظ ٹریکر</a>
              <a href="#community" className="hover:text-gold-leaf transition-colors">کمیونٹی</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-widest opacity-50">Next Prayer</p>
              <p className="text-sm font-semibold">Asr • 4:45 PM</p>
            </div>
            <button className="bg-emerald-deep text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-emerald-deep/90 transition-all shadow-lg shadow-emerald-deep/10">
              سیکھنا شروع کریں
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <h1 className="sr-only">Muhy Loveable — Learn the Quran</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left */}
          <div className="lg:col-span-8 space-y-12">
            {/* Hero: Daily Ayah */}
            <section className="relative group">
              <div className="absolute -inset-4 bg-emerald-deep/5 rounded-[2rem] -rotate-1 group-hover:rotate-0 transition-transform duration-500" />
              <div className="relative bg-white border border-emerald-deep/10 p-10 rounded-[2rem] shadow-sm">
                <span className="inline-block px-4 py-1 rounded-full bg-gold-leaf/10 text-gold-leaf text-xs font-bold mb-6 uppercase tracking-widest">
                  آج کی آیت
                </span>
                <div className="space-y-8 text-center">
                  <p
                    className="font-arabic text-4xl md:text-5xl leading-[1.8] text-emerald-deep mb-4"
                    dir="rtl"
                  >
                    فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ
                  </p>
                  <p
                    className="font-urdu text-xl md:text-2xl text-emerald-deep/80 leading-relaxed"
                    dir="rtl"
                  >
                    پس تم مجھے یاد کرو، میں تمہیں یاد کروں گا، اور میرا شکر ادا کرو اور ناشکری نہ کرو۔
                  </p>
                  <div className="pt-4 border-t border-emerald-deep/5 flex justify-center gap-4">
                    <button className="px-4 py-3 rounded-full border border-emerald-deep/10 hover:bg-emerald-deep hover:text-white transition-colors">
                      <span className="text-xs font-bold">LISTEN</span>
                    </button>
                    <button className="px-4 py-3 rounded-full border border-emerald-deep/10 hover:bg-emerald-deep hover:text-white transition-colors">
                      <span className="text-xs font-bold">SHARE</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Courses */}
            <section id="tajweed">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">تجوید لرننگ</h2>
                  <p className="text-emerald-deep/60">قرآن کو خوبصورتی سے پڑھنا سیکھیں</p>
                </div>
                <button className="text-gold-leaf font-semibold text-sm hover:underline">
                  View All Courses
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <article className="group bg-white p-6 rounded-2xl border border-emerald-deep/5 hover:border-gold-leaf/30 transition-all">
                  <img
                    src={tajweedBasics}
                    alt="Tajweed basics — Islamic calligraphy"
                    className="w-full aspect-video object-cover rounded-xl mb-4"
                    loading="lazy"
                  />
                  <h3 className="text-lg font-bold mb-2">مخارج الحروف</h3>
                  <p className="text-sm text-emerald-deep/60 mb-4">
                    حروف کے درست تلفظ اور ان کے نکلنے کی جگہوں کی پہچان۔
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gold-leaf">12 اسباق</span>
                    <span className="text-xs bg-emerald-deep/5 px-2 py-1 rounded">Beginner</span>
                  </div>
                </article>
                <article className="group bg-white p-6 rounded-2xl border border-emerald-deep/5 hover:border-gold-leaf/30 transition-all">
                  <img
                    src={tajweedAdvanced}
                    alt="Advanced tajweed — open Quran pages"
                    className="w-full aspect-video object-cover rounded-xl mb-4"
                    loading="lazy"
                  />
                  <h3 className="text-lg font-bold mb-2">مد اور غنہ کے قواعد</h3>
                  <p className="text-sm text-emerald-deep/60 mb-4">
                    تلاوت میں خوبصورتی پیدا کرنے کے لیے مد اور غنہ کا استعمال۔
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gold-leaf">08 اسباق</span>
                    <span className="text-xs bg-emerald-deep/5 px-2 py-1 rounded">Advanced</span>
                  </div>
                </article>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Progress Tracker */}
            <div id="hifz" className="bg-emerald-deep text-white p-8 rounded-[2rem] shadow-xl shadow-emerald-deep/20">
              <h3 className="text-xl font-bold mb-6">آپ کی ترقی</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-70">
                    <span>حفظ القرآن</span>
                    <span>14%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-leaf w-[14%] rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-[10px] uppercase opacity-60">یاد کی گئی سورتیں</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-2xl font-bold">152</p>
                    <p className="text-[10px] uppercase opacity-60">ٹوٹل منٹس</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 bg-white text-emerald-deep py-3 rounded-xl font-bold text-sm hover:bg-gold-leaf hover:text-white transition-all">
                پروگریس دیکھیں
              </button>
            </div>

            {/* AI Teacher */}
            <div className="bg-white border border-emerald-deep/10 p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-10 bg-gold-leaf/10 rounded-full grid place-items-center">
                  <div className="size-2 bg-gold-leaf rounded-full animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold">AI قرآن ٹیچر</h4>
                  <p className="text-xs text-emerald-deep/50">آن لائن مدد کے لیے دستیاب</p>
                </div>
              </div>
              <div className="bg-emerald-deep/5 p-4 rounded-xl mb-4">
                <p className="text-sm italic">"کیا آپ سورۃ الفاتحہ کی تجوید چیک کرنا چاہتے ہیں؟"</p>
              </div>
              <input
                type="text"
                placeholder="سوال پوچھیں..."
                className="w-full text-sm bg-paper border border-emerald-deep/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gold-leaf"
              />
            </div>

            {/* Prayer Times */}
            <div className="bg-white border border-emerald-deep/10 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold">اسلامی کیلنڈر</h4>
                <span className="text-xs font-bold text-gold-leaf uppercase">14 Shaban</span>
              </div>
              <div className="space-y-3">
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
                        ? "flex justify-between items-center p-3 rounded-lg bg-emerald-deep/5 border-l-4 border-gold-leaf"
                        : "flex justify-between items-center p-3 rounded-lg hover:bg-emerald-deep/5 transition-colors"
                    }
                  >
                    <span className={p.active ? "text-sm font-bold" : "text-sm font-medium"}>
                      {p.name}
                    </span>
                    <span className="text-sm font-bold">{p.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky Player */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg bg-white/90 backdrop-blur-xl border border-emerald-deep/10 shadow-2xl rounded-2xl p-4 flex items-center gap-4 z-40">
        <div className="size-12 bg-emerald-deep rounded-lg grid place-items-center text-white font-bold">
          01
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gold-leaf uppercase tracking-widest">Now Playing</p>
          <p className="text-sm font-bold truncate">Surah Al-Fatihah — Mishary Rashid Alafasy</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button aria-label="Previous" className="size-8 rounded-full bg-emerald-deep/5 flex items-center justify-center">
            ⏮
          </button>
          <button aria-label="Play" className="size-10 rounded-full bg-emerald-deep text-white flex items-center justify-center">
            ▶
          </button>
          <button aria-label="Next" className="size-8 rounded-full bg-emerald-deep/5 flex items-center justify-center">
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
