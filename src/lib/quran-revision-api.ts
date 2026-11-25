import type { QuranVerse } from "@/components/VerseCard";
import { fetchSurahVerses } from "@/lib/quran-api";
import {
  parseVerseKey,
  validateChapterCounts,
  type ChapterAyahCount,
  type RevisionPortion,
} from "@/lib/quran-revision";

type QuranChapterResponse = {
  chapters?: Array<{ id?: number; verses_count?: number }>;
};

export async function fetchRevisionChapterCounts(): Promise<ChapterAyahCount[]> {
  const response = await fetch("https://api.quran.com/api/v4/chapters?language=en", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Could not load Quran chapter information.");

  const payload = (await response.json()) as QuranChapterResponse;
  const chapters = payload.chapters ?? [];
  const counts = chapters.map((chapter) => ({
    surah: Number(chapter.id),
    ayahCount: Number(chapter.verses_count),
  }));
  return validateChapterCounts(counts);
}

export async function fetchRevisionPortion(
  portion: RevisionPortion,
  translation: number,
): Promise<QuranVerse[]> {
  const start = parseVerseKey(portion.startKey);
  const end = parseVerseKey(portion.endKey);
  if (!start || !end) throw new Error("The assigned Quran range is invalid.");

  const verses: QuranVerse[] = [];
  for (let surah = start.surah; surah <= end.surah; surah += 1) {
    const chapterVerses = await fetchSurahVerses(surah, translation);
    verses.push(
      ...chapterVerses.filter((verse) => {
        if (surah === start.surah && verse.verse_number < start.ayah) return false;
        if (surah === end.surah && verse.verse_number > end.ayah) return false;
        return true;
      }),
    );
  }

  if (verses.length !== portion.ayahCount) {
    throw new Error("The Quran source returned an incomplete range. Please retry.");
  }
  return verses;
}

export async function fetchRevisionWeakAyahs(
  keys: string[],
  translation: number,
): Promise<QuranVerse[]> {
  const validKeys = keys.filter((key) => parseVerseKey(key) !== null);
  const wanted = new Set(validKeys);
  const surahs = [...new Set(validKeys.map((key) => parseVerseKey(key)?.surah).filter((id): id is number => id != null))];
  const byKey = new Map<string, QuranVerse>();

  for (let offset = 0; offset < surahs.length; offset += 6) {
    const batch = surahs.slice(offset, offset + 6);
    const chapters = await Promise.all(batch.map((surah) => fetchSurahVerses(surah, translation)));
    for (const verses of chapters) {
      for (const verse of verses) {
        if (wanted.has(verse.verse_key)) byKey.set(verse.verse_key, verse);
      }
    }
  }

  return validKeys.flatMap((key) => {
    const verse = byKey.get(key);
    return verse ? [verse] : [];
  });
}