import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { toCleanText } from "@/lib/clean-html";
import { Bookmark, BookmarkCheck, Play, Pause } from "lucide-react";
import type { QuranPrefs } from "@/hooks/use-quran-prefs";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { TafsirButton } from "@/components/TafsirPanel";
import { WordByWord } from "@/components/WordByWord";

export type QuranVerse = {
  id: number;
  verse_key: string; // "s:a"
  verse_number: number;
  text_uthmani?: string;
  text_uthmani_tajweed?: string;
  text_indopak?: string;
  juz_number?: number;
  hizb_number?: number;
  rub_el_hizb_number?: number;
  page_number?: number;
  sajdah_number?: number | null;
  sajdah_type?: string | null;
  translations?: { text: string }[];
};

const TAJWEED_SANITIZE = {
  ADD_TAGS: ["tajweed"],
  ADD_ATTR: ["class"],
};

export function VerseCard({
  v,
  prefs,
  isBookmarked,
  onToggleBookmark,
  showSurahInHeader = false,
  onVisible,
  onPlayFrom,
}: {
  v: QuranVerse;
  prefs: QuranPrefs;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  showSurahInHeader?: boolean;
  onVisible?: (key: string) => void;
  onPlayFrom?: (verseKey: string) => void;
}) {
  const audio = useAudioPlayer();
  const isCurrent = audio.currentKey === v.verse_key;
  const isCurrentPlaying = isCurrent && audio.playing;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!onVisible || !ref.current || typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            onVisible(v.verse_key);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: [0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onVisible, v.verse_key]);

  const useTajweed = prefs.tajweed && !!v.text_uthmani_tajweed && prefs.script !== "indopak";
  const arabicPlain =
    prefs.script === "indopak"
      ? v.text_indopak ?? v.text_uthmani ?? ""
      : v.text_uthmani ?? v.text_indopak ?? "";
  const scriptClass = prefs.script === "indopak" ? "font-indopak" : "font-uthmani";
  const effectiveFontSize = Math.round(prefs.fontSize * (prefs.zoom || 1));

  return (
    <article
      ref={ref}
      id={`v-${v.verse_key.replace(":", "-")}`}
      className={`verse-card rounded-2xl bg-white/5 backdrop-blur-xl border p-6 transition-all scroll-mt-24 ${
        isCurrent ? "border-amber-400/70 shadow-[0_0_0_2px_rgba(201,162,76,0.25)] bg-amber-400/[0.04] is-focused" : "border-white/10 hover:border-amber-400/20"
      }`}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-full bg-amber-500/15 border border-amber-400/30 grid place-items-center text-amber-300 text-xs font-bold">
            {showSurahInHeader ? v.verse_key : v.verse_number}
          </div>
          {v.juz_number != null && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Juz {v.juz_number} · Hizb {v.hizb_number} · Rub {v.rub_el_hizb_number} · Pg {v.page_number}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {v.sajdah_number != null && (
            <span
              title={`Sajdah (${v.sajdah_type ?? "recommended"})`}
              className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-200 text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest"
            >
              ۩ Sajdah
            </span>
          )}
          {onPlayFrom && (
            <button
              onClick={() => (isCurrentPlaying ? audio.pause() : onPlayFrom(v.verse_key))}
              className={`p-2 rounded-lg transition-colors ${
                isCurrent ? "text-amber-300 bg-amber-400/10" : "text-slate-400 hover:text-amber-300 hover:bg-white/5"
              }`}
              aria-label={isCurrentPlaying ? "Pause" : "Play from this ayah"}
            >
              {isCurrentPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
          )}
          <button
            onClick={onToggleBookmark}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-300 transition-colors"
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark verse"}
          >
            {isBookmarked ? <BookmarkCheck className="size-5 text-amber-400" /> : <Bookmark className="size-5" />}
          </button>
        </div>
      </div>

      {useTajweed ? (
        <p
          className={`text-white text-right tajweed ${scriptClass}`}
          dir="rtl"
          lang="ar"
          style={{ fontSize: `${effectiveFontSize}px`, lineHeight: prefs.lineSpacing, wordSpacing: `${prefs.wordSpacing}em` }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(v.text_uthmani_tajweed ?? "", TAJWEED_SANITIZE),
          }}
        />
      ) : (
        <p
          className={`text-white text-right ${scriptClass}`}
          dir="rtl"
          lang="ar"
          style={{ fontSize: `${effectiveFontSize}px`, lineHeight: prefs.lineSpacing, wordSpacing: `${prefs.wordSpacing}em` }}
        >
          {arabicPlain}
          {v.rub_el_hizb_number != null && v.verse_number === 1 && (
            <span className="text-amber-300 mx-1" aria-hidden>۞</span>
          )}
        </p>
      )}

      {prefs.wordByWord && <WordByWord verseKey={v.verse_key} />}

      {prefs.showTranslation && v.translations?.[0]?.text && (
        <p className="text-slate-300 mt-4 leading-relaxed">
          {toCleanText(v.translations[0].text)}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <TafsirButton verseKey={v.verse_key} />
      </div>
    </article>
  );
}
