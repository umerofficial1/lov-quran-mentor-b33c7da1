import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { SURAHS } from "@/lib/surahs";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, Bookmark } from "lucide-react";
import { QuranJumpBar } from "@/components/QuranJumpBar";

export const Route = createFileRoute("/quran/")({
  head: () => ({
    meta: [
      { title: "Read the Quran — Verse Wise Mentor" },
      { name: "description", content: "All 114 surahs of the Quran with Arabic, English and Urdu translations, world-class reciters and bookmarks." },
      { property: "og:title", content: "Read the Quran — Verse Wise Mentor" },
      { property: "og:description", content: "The complete Quran with translation, audio and personal bookmarks." },
    ],
  }),
  component: () => (<RequireAuth><QuranIndex /></RequireAuth>),
});

function QuranIndex() {
  const [q, setQ] = useState("");
  const [last, setLast] = useState<{ surah: number; ayah: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: row } = await supabase
        .from("last_read")
        .select("surah, ayah")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (row) setLast({ surah: row.surah, ayah: row.ayah });
    });
  }, []);

  const filtered = SURAHS.filter(
    (s) =>
      !q ||
      s.nameAr.includes(q) ||
      s.nameUr.includes(q) ||
      String(s.n) === q,
  );

  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">القرآن الكريم</h1>
            <p className="text-slate-400 mt-1">114 Surahs • Word-by-word translation • Audio</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/quran/bookmarks"
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-200 hover:text-[#C9A24C] hover:border-[#C9A24C]/40 transition-all inline-flex items-center gap-2"
            >
              <Bookmark className="size-4" /> Bookmarks
            </Link>
            {last && (
              <Link
                to="/quran/$surahId"
                params={{ surahId: String(last.surah) }}
                className="px-5 py-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 transition-all inline-flex items-center gap-2"
              >
                <BookOpen className="size-4" /> Continue — Surah {last.surah}:{last.ayah}
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6">
          <QuranJumpBar />
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search surah by name or number…"
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Link
              key={s.n}
              to="/quran/$surahId"
              params={{ surahId: String(s.n) }}
              className="group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 hover:bg-white/10 hover:border-amber-400/30 transition-all flex items-center gap-4"
            >
              <div className="size-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/30 grid place-items-center text-amber-300 font-bold shrink-0">
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate" dir="rtl">{s.nameUr}</p>
                <p className="text-xs text-slate-400 truncate">Surah {s.n}</p>
              </div>
              <span className="font-arabic text-2xl text-amber-300/80 group-hover:text-amber-300" dir="rtl">
                {s.nameAr}
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
