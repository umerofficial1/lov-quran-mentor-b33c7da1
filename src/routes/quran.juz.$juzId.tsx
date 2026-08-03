import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { ChevronLeft, ChevronRight, Mic } from "lucide-react";
import { fetchJuzVerses } from "@/lib/quran-api";
import { VerseCard } from "@/components/VerseCard";
import { QuranSettings } from "@/components/QuranSettings";
import { QuranJumpBar } from "@/components/QuranJumpBar";
import { ReadingChrome } from "@/components/ReadingChrome";
import { useQuranPrefs } from "@/hooks/use-quran-prefs";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { LiveRecitationDrawer } from "@/components/LiveRecitationDrawer";
import { SURAHS } from "@/lib/surahs";
import { JUZ_COUNT } from "@/lib/quran-meta";

export const Route = createFileRoute("/quran/juz/$juzId")({
  head: ({ params }) => ({
    meta: [
      { title: `Juz ${params.juzId} — Verse Wise Mentor` },
      { name: "description", content: `Read Juz ${params.juzId} of the Holy Quran verse-by-verse in Uthmani or IndoPak script.` },
      { property: "og:title", content: `Juz ${params.juzId} — Verse Wise Mentor` },
    ],
  }),
  component: () => (<JuzReader />),
});

function JuzReader() {
  const { juzId } = useParams({ from: "/quran/juz/$juzId" });
  const id = Math.max(1, Math.min(JUZ_COUNT, Number(juzId) || 1));
  const { prefs, update } = useQuranPrefs();
  const audio = useAudioPlayer();
  const [reciteOpen, setReciteOpen] = useState(false);
  const verses = useQuery({
    queryKey: ["juz", id, 131],
    queryFn: () => fetchJuzVerses(id, 131),
  });

  const playFromKey = (verseKey: string) => {
    const data = verses.data ?? [];
    if (!data.length) return;
    const q = data.map((v) => {
      const [s, a] = v.verse_key.split(":").map(Number);
      return { surah: s, ayah: a, page: v.page_number ?? null };
    });
    const idx = q.findIndex((it) => `${it.surah}:${it.ayah}` === verseKey);
    void audio.loadQueue(q, Math.max(0, idx), true);
  };

  const prev = id > 1 ? id - 1 : null;
  const next = id < JUZ_COUNT ? id + 1 : null;

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
              <Link to="/quran/juz/$juzId" params={{ juzId: String(prev) }} aria-label="Previous juz" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300">
                <ChevronRight className="size-4" />
              </Link>
            )}
            {next && (
              <Link to="/quran/juz/$juzId" params={{ juzId: String(next) }} aria-label="Next juz" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300">
                <ChevronLeft className="size-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="text-center mb-6 rounded-3xl bg-gradient-to-b from-teal-800/30 to-emerald-950/40 border border-white/10 p-8">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Part</p>
          <h1 className="text-5xl font-bold text-white mt-2">Juz {id}</h1>
          <p className="text-slate-400 mt-2">One of 30 parts of the Holy Quran</p>
        </div>

        <div className="mb-4">
          <QuranJumpBar current={{ mode: "juz", id }} />
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
            <VerseCard
              key={v.id}
              v={v}
              prefs={prefs}
              isBookmarked={false}
              onToggleBookmark={() => {}}
              showSurahInHeader
              onVisible={markRead}
              onPlayFrom={playFromKey}
            />
          ))}
        </div>
      </main>
        )}
      </ReadingChrome>

      <QuranSettings prefs={prefs} update={update} />

      <button
        onClick={() => setReciteOpen(true)}
        disabled={!verses.data?.length}
        className="fixed bottom-24 md:bottom-8 right-5 z-40 group inline-flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-bold shadow-[0_0_30px_rgba(47,212,167,0.5)] hover:scale-105 active:scale-95 transition disabled:opacity-40"
        aria-label="Start live recitation"
      >
        <span className="relative flex size-8 items-center justify-center rounded-full bg-white/15">
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <Mic className="size-5 relative" />
        </span>
        <span className="text-sm">Live Recite</span>
      </button>

      <LiveRecitationDrawer
        open={reciteOpen}
        onClose={() => setReciteOpen(false)}
        surahId={verses.data?.[0] ? Number(verses.data[0].verse_key.split(":")[0]) : 1}
        surahName={(() => {
          const s = verses.data?.[0] ? SURAHS.find((x) => x.n === Number(verses.data![0].verse_key.split(":")[0])) : null;
          return s ? s.nameAr : `Juz ${id}`;
        })()}
        verses={verses.data ?? []}
      />

      <MobileNav />
    </div>
  );
}
