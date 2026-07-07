import DOMPurify from "dompurify";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { QuranPrefs } from "@/hooks/use-quran-prefs";

export type QuranVerse = {
  id: number;
  verse_key: string; // "s:a"
  verse_number: number;
  text_uthmani?: string;
  text_indopak?: string;
  juz_number?: number;
  hizb_number?: number;
  rub_el_hizb_number?: number;
  page_number?: number;
  sajdah_number?: number | null;
  sajdah_type?: string | null;
  translations?: { text: string }[];
};

export function VerseCard({
  v,
  prefs,
  isBookmarked,
  onToggleBookmark,
  showSurahInHeader = false,
}: {
  v: QuranVerse;
  prefs: QuranPrefs;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  showSurahInHeader?: boolean;
}) {
  const arabic =
    prefs.script === "indopak"
      ? v.text_indopak ?? v.text_uthmani ?? ""
      : v.text_uthmani ?? v.text_indopak ?? "";
  const scriptClass = prefs.script === "indopak" ? "font-indopak" : "font-uthmani";

  return (
    <article
      id={`v-${v.verse_key.replace(":", "-")}`}
      className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-amber-400/20 transition-all scroll-mt-24"
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
          <button
            onClick={onToggleBookmark}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-300 transition-colors"
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark verse"}
          >
            {isBookmarked ? <BookmarkCheck className="size-5 text-amber-400" /> : <Bookmark className="size-5" />}
          </button>
        </div>
      </div>

      <p
        className={`text-white text-right ${scriptClass}`}
        dir="rtl"
        lang="ar"
        style={{ fontSize: `${prefs.fontSize}px`, lineHeight: prefs.lineSpacing }}
      >
        {arabic}
        {v.rub_el_hizb_number != null && v.verse_number === 1 && (
          <span className="text-amber-300 mx-1" aria-hidden>۞</span>
        )}
      </p>

      {prefs.showTranslation && v.translations?.[0]?.text && (
        <p
          className="text-slate-300 mt-4 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v.translations[0].text) }}
        />
      )}
    </article>
  );
}
