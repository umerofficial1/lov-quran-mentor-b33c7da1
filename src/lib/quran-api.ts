import type { QuranVerse } from "@/components/VerseCard";

const FIELDS =
  "text_uthmani,text_uthmani_tajweed,text_indopak,juz_number,hizb_number,rub_el_hizb_number,page_number,sajdah_number,sajdah_type";

async function fetchAll(url: string, translation: number): Promise<QuranVerse[]> {
  const all: QuranVerse[] = [];
  let page = 1;
  while (true) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(
      `${url}${sep}language=en&words=false&translations=${translation}&fields=${FIELDS}&per_page=50&page=${page}`,
    );
    if (!res.ok) throw new Error("Failed to load verses");
    const data = await res.json();
    const verses = (data.verses ?? []) as QuranVerse[];
    all.push(...verses);
    const total = data.pagination?.total_pages ?? 1;
    if (page >= total || verses.length === 0) break;
    page += 1;
  }
  return all;
}

export const fetchSurahVerses = (surahId: number, translation: number) =>
  fetchAll(`https://api.quran.com/api/v4/verses/by_chapter/${surahId}`, translation);

export const fetchJuzVerses = (juzId: number, translation: number) =>
  fetchAll(`https://api.quran.com/api/v4/verses/by_juz/${juzId}`, translation);

export const fetchPageVerses = (pageId: number, translation: number) =>
  fetchAll(`https://api.quran.com/api/v4/verses/by_page/${pageId}`, translation);

export const fetchHizbVerses = (hizbId: number, translation: number) =>
  fetchAll(`https://api.quran.com/api/v4/verses/by_hizb/${hizbId}`, translation);
