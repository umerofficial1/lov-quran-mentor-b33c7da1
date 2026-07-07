import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SURAHS } from "@/lib/surahs";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { fetchSurahVerses } from "@/lib/quran-api";
import { VerseCard } from "@/components/VerseCard";
import { QuranSettings } from "@/components/QuranSettings";
import { QuranJumpBar } from "@/components/QuranJumpBar";
import { useQuranPrefs } from "@/hooks/use-quran-prefs";

export const Route = createFileRoute("/quran/$surahId")({
  head: ({ params }) => {
    const s = SURAHS.find((x) => x.n === Number(params.surahId));
    const label = s ? `Surah ${s.n} — ${s.nameAr}` : `Surah ${params.surahId}`;
    return {
      meta: [
        { title: `${label} — Verse Wise Mentor` },
        { name: "description", content: `Read ${label} in Uthmani and IndoPak script with English and Urdu translation, verse-by-verse audio, sajdah indicators and bookmarks.` },
        { property: "og:title", content: `${label} — Verse Wise Mentor` },
        { property: "og:description", content: `Recite ${label} with adjustable script, font size and translation.` },
      ],
    };
  },
  component: SurahReader,
});

const RECITERS = [
  { id: 7, name: "Mishary Alafasy" },
  { id: 1, name: "AbdulBaset (Mujawwad)" },
  { id: 2, name: "AbdulBaset (Murattal)" },
  { id: 3, name: "Abdur-Rahman as-Sudais" },
  { id: 4, name: "Abu Bakr al-Shatri" },
  { id: 5, name: "Hani ar-Rifai" },
  { id: 6, name: "Mahmoud Khalil Al-Husary" },
  { id: 9, name: "Mohamed Siddiq al-Minshawi" },
  { id: 10, name: "Maher al-Muaiqly" },
];

async function fetchAudio(reciterId: number, surahId: number) {
  const res = await fetch(
    `https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surahId}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.audio_file?.audio_url as string | undefined;
}

function SurahReader() {
  const { surahId } = useParams({ from: "/quran/$surahId" });
  const id = Math.max(1, Math.min(114, Number(surahId) || 1));
  const surah = SURAHS.find((s) => s.n === id)!;
  const [reciter, setReciter] = useState(7);
  const [translation, setTranslation] = useState(131);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loop, setLoop] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const { prefs, update } = useQuranPrefs();

  const verses = useQuery({
    queryKey: ["surah-v2", id, translation],
    queryFn: () => fetchSurahVerses(id, translation),
  });

  const audioUrl = useQuery({
    queryKey: ["audio", reciter, id],
    queryFn: () => fetchAudio(reciter, id),
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setUserId(data.session.user.id);
      const { data: rows } = await supabase
        .from("bookmarks")
        .select("surah, ayah")
        .eq("user_id", data.session.user.id)
        .eq("surah", id);
      if (rows) setBookmarks(new Set(rows.map((r) => `${r.surah}:${r.ayah}`)));
      await supabase.from("last_read").upsert({
        user_id: data.session.user.id,
        surah: id,
        ayah: 1,
        updated_at: new Date().toISOString(),
      });
    });
  }, [id]);

  const toggleBookmark = async (ayah: number) => {
    if (!userId) {
      alert("Sign in to save bookmarks");
      return;
    }
    const key = `${id}:${ayah}`;
    const next = new Set(bookmarks);
    if (bookmarks.has(key)) {
      next.delete(key);
      await supabase.from("bookmarks").delete().eq("user_id", userId).eq("surah", id).eq("ayah", ayah);
    } else {
      next.add(key);
      await supabase.from("bookmarks").insert({ user_id: userId, surah: id, ayah });
    }
    setBookmarks(next);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  };

  const prev = useMemo(() => (id > 1 ? id - 1 : null), [id]);
  const next = useMemo(() => (id < 114 ? id + 1 : null), [id]);

  return (
    <div className="min-h-screen pb-40 md:pb-24">
      <SiteNav />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6 text-sm">
          <Link to="/quran" className="text-slate-400 hover:text-amber-300">← All Surahs</Link>
          <div className="flex items-center gap-2">
            {prev && (
              <Link to="/quran/$surahId" params={{ surahId: String(prev) }} aria-label="Previous surah" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300">
                <ChevronRight className="size-4" />
              </Link>
            )}
            {next && (
              <Link to="/quran/$surahId" params={{ surahId: String(next) }} aria-label="Next surah" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300">
                <ChevronLeft className="size-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="text-center mb-6 rounded-3xl bg-gradient-to-b from-emerald-800/40 to-emerald-950/40 backdrop-blur-xl border border-white/10 p-10">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Surah {id}</p>
          <h1 className="text-5xl font-bold text-white mt-2 font-arabic" dir="rtl">{surah.nameAr}</h1>
          <p className="text-slate-400 mt-2" dir="rtl">{surah.nameUr}</p>
          {id !== 9 && id !== 1 && (
            <p className="text-3xl text-amber-200 mt-6 font-arabic" dir="rtl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          )}
        </div>

        <div className="mb-4">
          <QuranJumpBar current={{ mode: "surah", id }} />
        </div>

        <div className="flex flex-wrap gap-3 items-center mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Reciter</label>
          <select
            value={reciter}
            onChange={(e) => setReciter(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-2">Translation</label>
          <select
            value={translation}
            onChange={(e) => setTranslation(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
          >
            <option value={131}>English — Saheeh Intl.</option>
            <option value={20}>English — Sahih Intl. (alt)</option>
            <option value={97}>Urdu — Fateh Muhammad Jalandhari</option>
            <option value={158}>Urdu — Maududi</option>
          </select>
          <button
            onClick={() => setLoop((l) => !l)}
            className={`ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
              loop ? "bg-amber-500/20 border-amber-400/40 text-amber-300" : "bg-white/5 border-white/10 text-slate-300"
            }`}
          >
            <Repeat className="size-4" /> Loop
          </button>
        </div>

        {verses.isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {verses.isError && (
          <p className="text-red-400 text-center py-10">Failed to load. Please refresh.</p>
        )}

        <div className="space-y-4">
          {verses.data?.map((v) => (
            <VerseCard
              key={v.id}
              v={v}
              prefs={prefs}
              isBookmarked={bookmarks.has(`${id}:${v.verse_number}`)}
              onToggleBookmark={() => toggleBookmark(v.verse_number)}
            />
          ))}
        </div>
      </main>

      {audioUrl.data && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-2xl z-40">
          <div className="bg-emerald-950/90 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl p-4 flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="size-12 rounded-full bg-white text-emerald-950 grid place-items-center shadow-lg hover:scale-105 transition-transform"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Now Playing</p>
              <p className="text-sm font-bold text-white truncate" dir="rtl">{surah.nameAr}</p>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl.data}
              loop={loop}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              controls
              className="hidden sm:block h-10"
            />
          </div>
        </div>
      )}

      <QuranSettings prefs={prefs} update={update} />
      <MobileNav />
    </div>
  );
}
