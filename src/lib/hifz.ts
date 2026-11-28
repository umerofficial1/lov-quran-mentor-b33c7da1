import type { QuranVerse } from "@/components/VerseCard";
import { fetchSurahVerses } from "@/lib/quran-api";

export type HifzChapterCount = { surah: number; ayahCount: number };
export type HifzJuzRange = { juz: number; startIndex: number; endIndexExclusive: number };
export type HifzAyahRef = { key: string; surah: number; ayah: number; juz: number };
export type HifzTaskSection = "sabaq" | "sabqi" | "manzil";

export type HifzDailyTask = {
  day: number;
  createdAt: string;
  sabaq: string[];
  sabqi: string[];
  manzil: string[];
  sabaqDone: string[];
  sabqiDone: string[];
  manzilDone: string[];
};

export type HifzHistoryEntry = {
  day: number;
  completedAt: string;
  sabaq: string[];
  sabqi: string[];
  manzil: string[];
};

type ChaptersResponse = { chapters?: Array<{ id?: number; verses_count?: number }> };
type JuzResponse = {
  juzs?: Array<{
    juz_number?: number;
    first_verse_id?: number;
    last_verse_id?: number;
  }>;
};

function validateChapterCounts(counts: HifzChapterCount[]): HifzChapterCount[] {
  if (counts.length !== 114) throw new Error("Quran chapter information is incomplete.");
  const sorted = [...counts].sort((a, b) => a.surah - b.surah);
  sorted.forEach((chapter, index) => {
    if (chapter.surah !== index + 1 || !Number.isInteger(chapter.ayahCount) || chapter.ayahCount < 1) {
      throw new Error("Quran chapter information is invalid.");
    }
  });
  return sorted;
}

function validateJuzRanges(ranges: HifzJuzRange[], totalAyahs: number): HifzJuzRange[] {
  if (ranges.length !== 30) throw new Error("Quran Para information is incomplete.");
  const sorted = [...ranges].sort((a, b) => a.startIndex - b.startIndex);
  let cursor = 0;
  for (const range of sorted) {
    if (
      !Number.isInteger(range.juz) || range.juz < 1 || range.juz > 30 ||
      range.startIndex !== cursor || range.endIndexExclusive <= cursor ||
      range.endIndexExclusive > totalAyahs
    ) {
      throw new Error("Quran Para ranges do not form one complete sequence.");
    }
    cursor = range.endIndexExclusive;
  }
  if (cursor !== totalAyahs || new Set(sorted.map((range) => range.juz)).size !== 30) {
    throw new Error("Quran Para ranges do not cover the complete Quran exactly once.");
  }
  return sorted;
}

function verseKeyAtIndex(index: number, chapters: HifzChapterCount[]): string {
  let offset = 0;
  for (const chapter of chapters) {
    const end = offset + chapter.ayahCount;
    if (index < end) return `${chapter.surah}:${index - offset + 1}`;
    offset = end;
  }
  throw new RangeError("Ayah index is outside the Quran.");
}

export function buildHifzSequence(
  chapterCounts: HifzChapterCount[],
  juzRanges: HifzJuzRange[],
  startingJuz = 30,
): HifzAyahRef[] {
  if (!Number.isInteger(startingJuz) || startingJuz < 1 || startingJuz > 30) {
    throw new RangeError("Choose a starting Para from 1 to 30.");
  }
  const chapters = validateChapterCounts(chapterCounts);
  const totalAyahs = chapters.reduce((sum, chapter) => sum + chapter.ayahCount, 0);
  const ranges = validateJuzRanges(juzRanges, totalAyahs);
  const standardOrder = [30, ...Array.from({ length: 29 }, (_, index) => index + 1)];
  const startAt = standardOrder.indexOf(startingJuz);
  const order = [...standardOrder.slice(startAt), ...standardOrder.slice(0, startAt)];
  const byJuz = new Map(ranges.map((range) => [range.juz, range]));
  const sequence: HifzAyahRef[] = [];

  for (const juz of order) {
    const range = byJuz.get(juz);
    if (!range) throw new Error(`Para ${juz} is missing from the Quran index.`);
    for (let index = range.startIndex; index < range.endIndexExclusive; index += 1) {
      const key = verseKeyAtIndex(index, chapters);
      const [surahValue, ayahValue] = key.split(":");
      sequence.push({ key, surah: Number(surahValue), ayah: Number(ayahValue), juz });
    }
  }

  if (sequence.length !== totalAyahs || new Set(sequence.map((ayah) => ayah.key)).size !== totalAyahs) {
    throw new Error("The Hifz sequence does not cover every Quran Ayah exactly once.");
  }
  return sequence;
}

export async function fetchHifzSequence(startingJuz = 30): Promise<HifzAyahRef[]> {
  const [chapterResponse, juzResponse] = await Promise.all([
    fetch("https://api.quran.com/api/v4/chapters?language=en", { headers: { Accept: "application/json" } }),
    fetch("https://api.quran.com/api/v4/juzs?language=en", { headers: { Accept: "application/json" } }),
  ]);
  if (!chapterResponse.ok || !juzResponse.ok) throw new Error("Could not load the Quran index. Please try again.");
  const chaptersPayload = (await chapterResponse.json()) as ChaptersResponse;
  const juzPayload = (await juzResponse.json()) as JuzResponse;
  const chapterCounts = validateChapterCounts((chaptersPayload.chapters ?? []).map((chapter) => ({
    surah: Number(chapter.id),
    ayahCount: Number(chapter.verses_count),
  })));
  const totalAyahs = chapterCounts.reduce((sum, chapter) => sum + chapter.ayahCount, 0);
  const byJuzNumber = new Map<number, HifzJuzRange>();

  for (const row of juzPayload.juzs ?? []) {
    const juz = Number(row.juz_number);
    const first = Number(row.first_verse_id);
    const last = Number(row.last_verse_id);
    if (!Number.isInteger(juz) || !Number.isInteger(first) || !Number.isInteger(last)) continue;
    const found = { juz, startIndex: first - 1, endIndexExclusive: last };
    const existing = byJuzNumber.get(juz);
    if (existing && (existing.startIndex !== found.startIndex || existing.endIndexExclusive !== found.endIndexExclusive)) {
      throw new Error("Quran Para indexing returned conflicting boundaries.");
    }
    byJuzNumber.set(juz, found);
  }

  return buildHifzSequence(chapterCounts, validateJuzRanges([...byJuzNumber.values()], totalAyahs), startingJuz);
}

export function initialHifzCompletedKeys(
  sequence: HifzAyahRef[],
  completedJuz: number[],
  completedSurahs: number[],
): string[] {
  const juzSet = new Set(completedJuz);
  const surahSet = new Set(completedSurahs);
  return sequence
    .filter((ayah) => juzSet.has(ayah.juz) || surahSet.has(ayah.surah))
    .map((ayah) => ayah.key);
}

function uniqueInOrder(keys: string[]): string[] {
  return [...new Set(keys)];
}

export function createHifzTask(
  sequence: HifzAyahRef[],
  completedKeys: string[],
  history: HifzHistoryEntry[],
  dailyTarget: number,
  weakKeys: string[] = [],
  createdAt = new Date().toISOString(),
): HifzDailyTask {
  if (!Number.isInteger(dailyTarget) || dailyTarget < 1 || dailyTarget > 50) {
    throw new RangeError("Daily Sabaq target must be from 1 to 50 Ayat.");
  }
  const completed = new Set(completedKeys);
  const sabaq = sequence.filter((ayah) => !completed.has(ayah.key)).slice(0, dailyTarget).map((ayah) => ayah.key);
  const sabaqSet = new Set(sabaq);
  const weakDue = weakKeys.filter((key) => completed.has(key) && !sabaqSet.has(key));
  const recentKeys = history.slice(-3).reverse().flatMap((entry) => [...entry.sabaq].reverse());
  const recentSet = new Set(recentKeys);
  const sabqi = uniqueInOrder([...weakDue, ...recentKeys])
    .filter((key) => completed.has(key) && !sabaqSet.has(key))
    .slice(0, Math.max(dailyTarget * 2, weakDue.length));
  const sabqiSet = new Set(sabqi);
  const olderKeys = sequence
    .filter((ayah) => completed.has(ayah.key) && !sabaqSet.has(ayah.key) && !sabqiSet.has(ayah.key) && !recentSet.has(ayah.key))
    .map((ayah) => ayah.key);
  const manzilLimit = Math.max(1, dailyTarget * 2);
  const manzilStart = olderKeys.length ? (history.length * manzilLimit) % olderKeys.length : 0;
  const manzil = Array.from({ length: Math.min(manzilLimit, olderKeys.length) }, (_, index) =>
    olderKeys[(manzilStart + index) % olderKeys.length],
  ).filter((key): key is string => key !== undefined);

  return {
    day: history.length + 1,
    createdAt,
    sabaq,
    sabqi,
    manzil,
    sabaqDone: [],
    sabqiDone: [],
    manzilDone: [],
  };
}

export function toggleHifzTaskAyah(task: HifzDailyTask, section: HifzTaskSection, key: string): HifzDailyTask {
  const targetKey = `${section}Done` as const;
  if (!task[section].includes(key)) return task;
  const done = new Set(task[targetKey]);
  if (done.has(key)) done.delete(key);
  else done.add(key);
  return { ...task, [targetKey]: [...done] };
}

export function isHifzTaskComplete(task: HifzDailyTask): boolean {
  return (["sabaq", "sabqi", "manzil"] as const).every((section) =>
    task[section].every((key) => task[`${section}Done`].includes(key)),
  );
}

export function completeHifzTask(
  task: HifzDailyTask,
  history: HifzHistoryEntry[],
  completedKeys: string[],
  sequence: HifzAyahRef[],
  dailyTarget: number,
  weakKeys: string[],
  completedAt = new Date().toISOString(),
): { history: HifzHistoryEntry[]; completedKeys: string[]; nextTask: HifzDailyTask } {
  if (!isHifzTaskComplete(task)) throw new Error("Finish every Sabaq, Sabqi, and Manzil Ayah before continuing.");
  const entry: HifzHistoryEntry = {
    day: task.day,
    completedAt,
    sabaq: [...task.sabaq],
    sabqi: [...task.sabqi],
    manzil: [...task.manzil],
  };
  const nextHistory = [...history, entry];
  const nextCompleted = uniqueInOrder([...completedKeys, ...task.sabaq]);
  return {
    history: nextHistory,
    completedKeys: nextCompleted,
    nextTask: createHifzTask(sequence, nextCompleted, nextHistory, dailyTarget, weakKeys, completedAt),
  };
}

export function calculateHifzStreak(history: HifzHistoryEntry[], today = new Date()): number {
  const dates = new Set(history.map((entry) => entry.completedAt.slice(0, 10)));
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function fetchHifzVerses(keys: string[], translation: number): Promise<QuranVerse[]> {
  const validKeys = [...new Set(keys)].filter((key) => /^\d{1,3}:\d{1,3}$/.test(key));
  const wanted = new Set(validKeys);
  const surahs = [...new Set(validKeys.map((key) => Number(key.split(":")[0])))];
  const found = new Map<string, QuranVerse>();
  for (let offset = 0; offset < surahs.length; offset += 6) {
    const chapters = await Promise.all(surahs.slice(offset, offset + 6).map((surah) => fetchSurahVerses(surah, translation)));
    for (const verses of chapters) {
      for (const verse of verses) {
        if (wanted.has(verse.verse_key)) found.set(verse.verse_key, verse);
      }
    }
  }
  const verses = validKeys.flatMap((key) => {
    const verse = found.get(key);
    return verse ? [verse] : [];
  });
  if (verses.length !== validKeys.length) throw new Error("Some Hifz Ayat could not be loaded. Please retry.");
  return verses;
}

export function parseHifzTask(value: unknown): HifzDailyTask | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const sections = ["sabaq", "sabqi", "manzil", "sabaqDone", "sabqiDone", "manzilDone"] as const;
  if (!Number.isInteger(row.day) || typeof row.createdAt !== "string") return null;
  if (!sections.every((section) => Array.isArray(row[section]) && row[section].every((key) => typeof key === "string"))) return null;
  return {
    day: Number(row.day),
    createdAt: row.createdAt,
    sabaq: row.sabaq as string[],
    sabqi: row.sabqi as string[],
    manzil: row.manzil as string[],
    sabaqDone: row.sabaqDone as string[],
    sabqiDone: row.sabqiDone as string[],
    manzilDone: row.manzilDone as string[],
  };
}

export function parseHifzHistory(value: unknown): HifzHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    if (
      !Number.isInteger(row.day) || typeof row.completedAt !== "string" ||
      ![row.sabaq, row.sabqi, row.manzil].every((keys) => Array.isArray(keys) && keys.every((key) => typeof key === "string"))
    ) return [];
    return [{
      day: Number(row.day),
      completedAt: row.completedAt,
      sabaq: row.sabaq as string[],
      sabqi: row.sabqi as string[],
      manzil: row.manzil as string[],
    }];
  });
}