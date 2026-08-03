import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Volume2 } from "lucide-react";
import { fetchWordByWord, WORD_AUDIO_BASE, type QuranWord } from "@/lib/quran-words";

export function WordByWord({ verseKey }: { verseKey: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["wbw", verseKey],
    queryFn: () => fetchWordByWord(verseKey),
    staleTime: 1000 * 60 * 30,
  });

  const words = useMemo(
    () => (q.data ?? []).filter((w) => w.char_type_name === "word"),
    [q.data],
  );

  const playWord = (w: QuranWord) => {
    if (!w.audio_url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = WORD_AUDIO_BASE + w.audio_url;
    audioRef.current.onended = () => setPlaying(null);
    void audioRef.current.play();
    setPlaying(w.id);
  };

  if (q.isLoading) {
    return <div className="mt-4 h-16 rounded-xl bg-white/5 animate-pulse" />;
  }
  if (q.isError) {
    return <p className="mt-4 text-xs text-red-400">Failed to load word-by-word.</p>;
  }

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3" dir="rtl">
      <div className="flex flex-wrap-reverse gap-2 justify-end">
        {words.map((w) => {
          const romanized = w.transliteration?.text ?? "";
          const en = w.translation?.text ?? "";
          const ur = w.urdu_translation ?? "";
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => playWord(w)}
              className={`group min-w-[92px] rounded-lg border px-2.5 py-2 text-center transition ${
                playing === w.id
                  ? "border-amber-400/70 bg-amber-400/10"
                  : "border-white/10 bg-white/[0.03] hover:border-amber-400/40 hover:bg-white/5"
              }`}
              title={w.root ? `Root: ${w.root}` : undefined}
              aria-label={`Play word ${romanized || en}`}
            >
              <div className="font-uthmani text-white text-2xl leading-tight" lang="ar">
                {w.text_uthmani ?? w.text_indopak}
              </div>
              {en && (
                <div className="mt-1 text-[11px] text-amber-200/90 leading-tight" dir="ltr">
                  {en}
                </div>
              )}
              {romanized && (
                <div className="text-[10px] text-slate-400 italic leading-tight" dir="ltr">
                  {romanized}
                </div>
              )}
              {ur && (
                <div
                  className="text-[11px] text-emerald-200/90 leading-tight mt-0.5"
                  lang="ur"
                  dir="rtl"
                  style={{ fontFamily: '"Noto Nastaliq Urdu", serif' }}
                >
                  {ur}
                </div>
              )}
              {w.root && (
                <div
                  className="mt-1 text-[10px] text-slate-500 leading-tight font-uthmani"
                  dir="rtl"
                >
                  ج: {w.root}
                </div>
              )}
              <Volume2 className="size-3 mx-auto mt-1 text-slate-500 group-hover:text-amber-300" />
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-slate-500 text-center uppercase tracking-widest">
        Tap any word to hear pronunciation · Root letters shown as ج:
      </p>
    </div>
  );
}
