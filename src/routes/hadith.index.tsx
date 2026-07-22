import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { HADITH_BOOKS } from "@/lib/hadith";
import { BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/hadith/")({
  component: HadithIndex,
});

function HadithIndex() {
  return (
    <div className="min-h-dvh flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24C]/15 border border-[#C9A24C]/40 text-[#C9A24C] text-xs font-bold uppercase tracking-widest">
            <BookOpen className="size-3" /> Kutub-e-Hadith
          </div>
          <h1
            className="mt-4 font-display text-4xl md:text-5xl font-bold text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg,#F4E4A6 0%,#D4AF37 55%,#0F6D4F 140%)" }}
          >
            احادیثِ نبوی ﷺ
          </h1>
          <p className="mt-3 text-white/70 max-w-2xl mx-auto">
            مستند ترین مجموعۂ احادیث — عربی متن، اردو ترجمہ اور ہر کتاب کے ساتھ آپ کا ذاتی AI مینٹر جو ہر ہدیث کی تفصیل، پس منظر اور آپ کے سوالات کا جواب دے۔
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HADITH_BOOKS.map((b, i) => (
            <Link
              key={b.id}
              to="/hadith/$bookId"
              params={{ bookId: b.id }}
              className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F1E3D]/80 to-[#070C1F]/80 p-5 hover:border-[#C9A24C]/50 hover:shadow-[0_10px_40px_-15px_rgba(201,162,76,0.35)] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#C9A24C]/80">
                    Book {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-2 font-display text-2xl text-white leading-tight" dir="rtl" lang="ar">
                    {b.titleAr}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/90">{b.title}</div>
                  <div className="text-[11px] text-white/50 mt-0.5">{b.author}</div>
                </div>
                <span className="shrink-0 grid place-items-center size-10 rounded-full bg-[#C9A24C]/10 border border-[#C9A24C]/30 text-[#C9A24C]">
                  <BookOpen className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-[13px] text-white/70 leading-relaxed" dir="rtl" lang="ur" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                {b.blurb}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">Arabic</span>
                {b.hasUrdu ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300">Urdu</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">English</span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-[#C9A24C] font-bold">
                  <Sparkles className="size-3" /> AI Mentor
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
