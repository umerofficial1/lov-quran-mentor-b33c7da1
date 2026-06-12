import { createFileRoute, Link } from "@tanstack/react-router";
import { SURAHS } from "@/lib/surahs";
import { useEffect, useState } from "react";
import { getLastRead, getBookmarks, type Bookmark } from "@/lib/quran-api";
import { BookOpen, Bookmark as BookmarkIcon, Search, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/quran/")({
  head: () => ({
    meta: [
      { title: "قرآن مجید — Love Qran" },
      { name: "description", content: "Full Quran with all 114 surahs, audio recitation, translations and bookmarks." },
      { property: "og:title", content: "قرآن مجید — Love Qran" },
      { property: "og:description", content: "تمام 114 سورتیں، صوتی تلاوت، ترجمہ اور بک مارکس۔" },
    ],
  }),
  component: QuranIndex,
});

function QuranIndex() {
  const [q, setQ] = useState("");
  const [lastRead, setLastRead] = useState<Bookmark | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setLastRead(getLastRead());
    setBookmarks(getBookmarks());
  }, []);

  const filtered = SURAHS.filter(
    (s) =>
      String(s.n).includes(q) ||
      s.nameAr.includes(q) ||
      s.nameUr.includes(q),
  );

  return (
    <div className="min-h-screen text-slate-200 font-ui pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-emerald-950/60 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="size-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              قرآن مجید
            </h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest">All 114 Surahs</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pt-6 space-y-6">
        {/* Last read */}
        {lastRead && (
          <Link
            to="/quran/$surahId"
            params={{ surahId: String(lastRead.surah) }}
            hash={`ayah-${lastRead.ayah}`}
            className="block rounded-3xl p-6 bg-gradient-to-br from-emerald-700/40 via-emerald-800/30 to-emerald-950/40 border border-amber-400/20 hover:border-amber-400/50 transition-all shadow-[0_0_30px_-10px_rgba(245,158,11,0.4)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-400 tracking-widest uppercase">Continue Reading</p>
                <p className="text-lg font-bold text-white mt-1">{lastRead.surahName}</p>
                <p className="text-sm text-slate-300">آیت {lastRead.ayah}</p>
              </div>
              <BookOpen className="size-10 text-amber-400/70" />
            </div>
          </Link>
        )}

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <BookmarkIcon className="size-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Bookmarks</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
              {bookmarks.map((b) => (
                <Link
                  key={`${b.surah}-${b.ayah}`}
                  to="/quran/$surahId"
                  params={{ surahId: String(b.surah) }}
                  hash={`ayah-${b.ayah}`}
                  className="shrink-0 rounded-2xl px-4 py-3 bg-white/5 border border-white/10 hover:border-amber-400/40 transition"
                >
                  <p className="text-xs text-amber-400 font-bold">{b.surahName}</p>
                  <p className="text-[11px] text-slate-400">آیت {b.ayah}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search surah..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition"
          />
        </div>

        {/* Surah grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((s) => (
            <Link
              key={s.n}
              to="/quran/$surahId"
              params={{ surahId: String(s.n) }}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-white/10 transition-all"
            >
              <div className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-600/20 border border-amber-400/30 text-amber-300 font-bold text-sm shrink-0">
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{s.nameUr}</p>
                <p className="text-[11px] text-slate-400">Surah {s.n}</p>
              </div>
              <p className="text-2xl text-amber-300 font-arabic">{s.nameAr}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
