// Word-by-word data for a single verse via api.quran.com v4
export type QuranWord = {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string; // "word" | "end"
  text_uthmani?: string;
  text_indopak?: string;
  transliteration?: { text: string | null; language_name: string };
  translation?: { text: string | null; language_name: string };
  urdu_translation?: string | null;
  root?: string | null;
  line_number?: number;
};

const WORD_FIELDS =
  "text_uthmani,text_indopak,line_number";
// grammar / root via `fields=... ` on words endpoint requires words_fields param name.
// api.quran.com uses `word_fields` for these + returns translation/transliteration
// blocks automatically when `words=true` and `word_translation_language` is set.

async function fetchLang(
  verseKey: string,
  lang: "en" | "ur",
): Promise<QuranWord[]> {
  const url =
    `https://api.quran.com/api/v4/verses/by_key/${verseKey}` +
    `?words=true&per_page=1&word_translation_language=${lang}` +
    `&word_fields=${WORD_FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load words");
  const data = await res.json();
  return (data.verse?.words ?? []) as QuranWord[];
}

/** Fetches words with English + Urdu translations merged. */
export async function fetchWordByWord(verseKey: string): Promise<QuranWord[]> {
  const [en, ur] = await Promise.all([
    fetchLang(verseKey, "en"),
    fetchLang(verseKey, "ur").catch(() => [] as QuranWord[]),
  ]);
  return en.map((w, i) => ({
    ...w,
    urdu_translation: ur[i]?.translation?.text ?? null,
  }));
}

export const WORD_AUDIO_BASE = "https://audio.qurancdn.com/";
