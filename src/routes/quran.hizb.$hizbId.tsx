import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchHizbVerses } from "@/lib/quran-api";
import { VerseCard } from "@/components/VerseCard";
import { QuranSettings } from "@/components/QuranSettings";
import { QuranJumpBar } from "@/components/QuranJumpBar";
import { ReadingChrome } from "@/components/ReadingChrome";
import { useQuranPrefs } from "@/hooks/use-quran-prefs";
import { HIZB_COUNT } from "@/lib/quran-meta";

export const Route = createFileRoute("/quran/hizb/$hizbId")({
  head: ({ params }) => ({
    meta: [
      { title: `Hizb ${params.hizbId} — Verse Wise Mentor` },
      { name: "description", content: `Read Hizb ${params.hizbId} of the Holy Quran (one of 60 hizbs) in Uthmani or IndoPak script.` },
      { property: "og:title", content: `Hizb ${params.hizbId} — Verse Wise Mentor` },
    ],
  }),
  component: () => (<RequireAuth><HizbReader /></RequireAuth>),
});

function HizbReader() {
  const { hizbId } = useParams({ from: "/quran/hizb/$hizbId" });
  const id = Math.max(1, Math.min(HIZB_COUNT, Number(hizbId) || 1));
  const { prefs, update } = useQuranPrefs();
  const verses = useQuery({
    queryKey: ["hizb", id, 131],
    queryFn: () => fetchHizbVerses(id, 131),
  });

  const prev = id > 1 ? id - 1 : null;
  const next = id < HIZB_COUNT ? id + 1 : null;

  return (
    <div className="min-h-dvh pb-24">
      <SiteNav />
      <ReadingChrome prefs={prefs}>
        {({ markRead, containerClass }) => (
      <main className={`max-w-4xl mx-auto px-4 md:px-6 py-8 ${containerClass}`}>
        <div className="flex items-center justify-between mb-6 text-sm">
          <Link to="/quran" className="text-slate-400 hover:text-amber-300">← Quran home</Link>
          <div className="flex items-center gap-2">
            {prev && (
              <Link to="/quran/hizb/$hizbId" params={{ hizbId: String(prev) }} aria-label="Previous hizb" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300">
                <ChevronRight className="size-4" />
              </Link>
            )}
            {next && (
              <Link to="/quran/hizb/$hizbId" params={{ hizbId: String(next) }} aria-label="Next hizb" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300">
                <ChevronLeft className="size-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="text-center mb-6 rounded-3xl bg-gradient-to-b from-amber-800/20 to-emerald-950/40 border border-white/10 p-8">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Half-juz</p>
          <h1 className="text-5xl font-bold text-white mt-2">Hizb {id} <span className="text-amber-300">۞</span></h1>
          <p className="text-slate-400 mt-2">One of 60 hizbs (240 rub el hizb quarters)</p>
        </div>

        <div className="mb-4">
          <QuranJumpBar current={{ mode: "hizb", id }} />
        </div>

        {verses.isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}
        {verses.isError && <p className="text-red-400 text-center py-10">Failed to load. Please refresh.</p>}

        <div className="space-y-4">
          {verses.data?.map((v) => (
            <VerseCard key={v.id} v={v} prefs={prefs} isBookmarked={false} onToggleBookmark={() => {}} showSurahInHeader onVisible={markRead} />
          ))}
        </div>
      </main>
        )}
      </ReadingChrome>

      <QuranSettings prefs={prefs} update={update} />
      <MobileNav />
    </div>
  );
}
