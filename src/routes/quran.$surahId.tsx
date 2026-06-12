import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  fetchSurah,
  RECITERS,
  setLastRead,
  toggleBookmark,
  isBookmarked,
  type ReciterId,
} from "@/lib/quran-api";
import { SURAHS } from "@/lib/surahs";
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Play,
  Pause,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/quran/$surahId")({
  component: SurahReader,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center text-slate-300 p-6 text-center">
      <div>
        <p className="text-amber-400 mb-2">Couldn't load surah</p>
        <p className="text-xs text-slate-500 mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-amber-500 text-emerald-950 font-bold">
          Retry
        </button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-slate-300">
      Surah not found
    </div>
  ),
});

function SurahReader() {
  const { surahId } = Route.useParams();
  const n = Number(surahId);
  if (!Number.isInteger(n) || n < 1 || n > 114) throw notFound();

  const meta = SURAHS.find((s) => s.n === n)!;
  const [reciter, setReciter] = useState<ReciterId>("ar.alafasy");
  const [playing, setPlaying] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["surah", n, reciter],
    queryFn: () => fetchSurah(n, reciter),
    staleTime: 1000 * 60 * 60,
  });

  // Last-read tracker on scroll
  useEffect(() => {
    if (!data) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const ayah = Number((visible.target as HTMLElement).dataset.ayah);
          if (ayah) setLastRead(n, ayah, meta.nameUr);
        }
      },
      { threshold: [0.5] },
    );
    document.querySelectorAll<HTMLElement>("[data-ayah]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [data, n, meta.nameUr]);

  const playAyah = (ayahNum: number, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playing === ayahNum) {
      setPlaying(null);
      return;
    }
    const a = new Audio(url);
    a.loop = repeat;
    a.onended = () => {
      if (!repeat) setPlaying(null);
    };
    a.play().catch(() => setPlaying(null));
    audioRef.current = a;
    setPlaying(ayahNum);
  };

  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <div className="min-h-screen text-slate-200 font-ui pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-emerald-950/70 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link to="/quran" className="size-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Surah {n}</p>
            <h1 className="text-lg font-bold text-white truncate">{meta.nameUr}</h1>
          </div>
          <button
            onClick={() => setRepeat((r) => !r)}
            className={`size-10 grid place-items-center rounded-full border transition ${
              repeat ? "bg-amber-500/20 border-amber-400/50 text-amber-300" : "bg-white/5 border-white/10 text-slate-400"
            }`}
            title="Repeat ayah"
          >
            <Repeat className="size-4" />
          </button>
        </div>
        {/* Reciter selector */}
        <div className="max-w-3xl mx-auto px-5 pb-3 flex gap-2 overflow-x-auto">
          {RECITERS.map((r) => (
            <button
              key={r.id}
              onClick={() => setReciter(r.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                reciter === r.id
                  ? "bg-amber-500 text-emerald-950"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-8">
        {/* Bismillah */}
        {n !== 1 && n !== 9 && (
          <div className="text-center mb-8">
            <p className="text-4xl text-amber-300 font-arabic leading-loose">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-20">
            <Loader2 className="size-8 mx-auto animate-spin text-amber-400" />
            <p className="text-sm text-slate-400 mt-4">Loading surah...</p>
          </div>
        )}

        {error && <p className="text-center text-red-400">Failed to load.</p>}

        {data && (
          <div className="space-y-6">
            {data.arabic.ayahs.map((ayah, i) => {
              const urdu = data.urdu.ayahs[i];
              const english = data.english.ayahs[i];
              const bookmarked = isBookmarked(n, ayah.numberInSurah);
              return (
                <article
                  key={ayah.number}
                  id={`ayah-${ayah.numberInSurah}`}
                  data-ayah={ayah.numberInSurah}
                  className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:border-amber-400/30 transition-all backdrop-blur-xl"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="size-9 grid place-items-center rounded-full bg-gradient-to-br from-amber-500/30 to-emerald-600/30 border border-amber-400/40 text-amber-200 text-xs font-bold">
                      {ayah.numberInSurah}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playAyah(ayah.numberInSurah, ayah.audio)}
                        className="size-9 grid place-items-center rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 hover:bg-amber-500/30 transition"
                      >
                        {playing === ayah.numberInSurah ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </button>
                      <button
                        onClick={() => {
                          toggleBookmark({
                            surah: n,
                            ayah: ayah.numberInSurah,
                            surahName: meta.nameUr,
                            savedAt: Date.now(),
                          });
                          setBookmarkVersion((v) => v + 1);
                        }}
                        className="size-9 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:border-amber-400/40 text-slate-300 transition"
                      >
                        {bookmarked ? (
                          <BookmarkCheck className="size-4 text-amber-400" key={bookmarkVersion} />
                        ) : (
                          <BookmarkIcon className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Arabic */}
                  <p
                    className="text-3xl md:text-4xl text-white leading-loose text-right font-arabic mb-5"
                    dir="rtl"
                  >
                    {ayah.text}
                  </p>

                  {/* Urdu */}
                  <p className="text-lg text-emerald-100 leading-loose text-right mb-3" dir="rtl">
                    {urdu.text}
                  </p>

                  {/* English */}
                  <p className="text-sm text-slate-400 leading-relaxed italic">
                    {english.text}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        {/* Nav */}
        <div className="flex justify-between mt-10">
          {n > 1 ? (
            <Link
              to="/quran/$surahId"
              params={{ surahId: String(n - 1) }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition"
            >
              <ChevronLeft className="size-4" /> Previous
            </Link>
          ) : <span />}
          {n < 114 ? (
            <Link
              to="/quran/$surahId"
              params={{ surahId: String(n + 1) }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-emerald-950 font-bold hover:bg-amber-400 transition"
            >
              Next <ChevronRight className="size-4" />
            </Link>
          ) : <span />}
        </div>
      </main>
    </div>
  );
}
