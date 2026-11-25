export type ChapterAyahCount = {
  surah: number;
  ayahCount: number;
};

export type RevisionPortion = {
  day: number;
  startIndex: number;
  endIndexExclusive: number;
  startKey: string;
  endKey: string;
  ayahCount: number;
};

export type CompletedPortion = RevisionPortion & {
  completedAt: string;
};

export function validateChapterCounts(counts: ChapterAyahCount[]): ChapterAyahCount[] {
  if (counts.length !== 114) {
    throw new Error("Quran chapter data must contain all 114 Surahs.");
  }

  const normalized = [...counts].sort((a, b) => a.surah - b.surah);
  normalized.forEach((chapter, index) => {
    if (chapter.surah !== index + 1 || !Number.isInteger(chapter.ayahCount) || chapter.ayahCount < 1) {
      throw new Error("Quran chapter data is incomplete or out of order.");
    }
  });
  return normalized;
}

export function totalAyahCount(counts: ChapterAyahCount[]): number {
  return validateChapterCounts(counts).reduce((sum, chapter) => sum + chapter.ayahCount, 0);
}

export function parseVerseKey(key: string): { surah: number; ayah: number } | null {
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(key);
  if (!match) return null;
  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || ayah < 1) return null;
  return { surah, ayah };
}

export function verseKeyAt(index: number, counts: ChapterAyahCount[]): string {
  const chapters = validateChapterCounts(counts);
  const total = chapters.reduce((sum, chapter) => sum + chapter.ayahCount, 0);
  if (!Number.isInteger(index) || index < 0 || index >= total) {
    throw new RangeError("Ayah index is outside the Quran.");
  }

  let offset = 0;
  for (const chapter of chapters) {
    const end = offset + chapter.ayahCount;
    if (index < end) return `${chapter.surah}:${index - offset + 1}`;
    offset = end;
  }

  throw new RangeError("Ayah index is outside the Quran.");
}

export function createBalancedPortions(
  counts: ChapterAyahCount[],
  durationDays: number,
  startIndex = 0,
  firstDay = 1,
): RevisionPortion[] {
  const chapters = validateChapterCounts(counts);
  const total = chapters.reduce((sum, chapter) => sum + chapter.ayahCount, 0);
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    throw new RangeError("A revision plan must have at least one day.");
  }
  if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex > total) {
    throw new RangeError("Revision progress is outside the Quran.");
  }

  const remainingAyahs = total - startIndex;
  if (remainingAyahs === 0) return [];
  const portionCount = Math.min(durationDays, remainingAyahs);

  return Array.from({ length: portionCount }, (_, index) => {
    const portionStart = startIndex + Math.floor((index * remainingAyahs) / portionCount);
    const endIndexExclusive = startIndex + Math.floor(((index + 1) * remainingAyahs) / portionCount);
    return {
      day: firstDay + index,
      startIndex: portionStart,
      endIndexExclusive,
      startKey: verseKeyAt(portionStart, chapters),
      endKey: verseKeyAt(endIndexExclusive - 1, chapters),
      ayahCount: endIndexExclusive - portionStart,
    };
  });
}

export function completedCursor(
  history: CompletedPortion[],
  counts: ChapterAyahCount[],
): number {
  const total = totalAyahCount(counts);
  let cursor = 0;

  for (const portion of history) {
    if (
      portion.startIndex !== cursor ||
      portion.endIndexExclusive <= cursor ||
      portion.endIndexExclusive > total ||
      portion.ayahCount !== portion.endIndexExclusive - portion.startIndex
    ) {
      throw new Error("Saved revision history is not a continuous Quran sequence.");
    }
    cursor = portion.endIndexExclusive;
  }

  return cursor;
}

export function parseCompletedPortions(value: unknown): CompletedPortion[] {
  if (!Array.isArray(value)) throw new Error("Saved revision history is invalid.");

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Saved revision history is invalid.");
    }
    const row = item as Record<string, unknown>;
    const portion = row as Partial<Record<keyof CompletedPortion, unknown>>;
    if (
      portion.day !== index + 1 ||
      !Number.isInteger(portion.startIndex) ||
      !Number.isInteger(portion.endIndexExclusive) ||
      !Number.isInteger(portion.ayahCount) ||
      typeof portion.startKey !== "string" ||
      typeof portion.endKey !== "string" ||
      typeof portion.completedAt !== "string"
    ) {
      throw new Error("Saved revision history is invalid.");
    }
    return {
      day: Number(portion.day),
      startIndex: Number(portion.startIndex),
      endIndexExclusive: Number(portion.endIndexExclusive),
      startKey: portion.startKey,
      endKey: portion.endKey,
      ayahCount: Number(portion.ayahCount),
      completedAt: portion.completedAt,
    };
  });
}

export function currentRevisionPortion(
  counts: ChapterAyahCount[],
  durationDays: number,
  history: CompletedPortion[],
): RevisionPortion | null {
  const cursor = completedCursor(history, counts);
  const total = totalAyahCount(counts);
  if (cursor >= total) return null;

  const daysLeft = Math.max(1, durationDays - history.length);
  return createBalancedPortions(counts, daysLeft, cursor, history.length + 1)[0] ?? null;
}

export function pendingRevisionPortions(
  counts: ChapterAyahCount[],
  durationDays: number,
  history: CompletedPortion[],
): RevisionPortion[] {
  const cursor = completedCursor(history, counts);
  const total = totalAyahCount(counts);
  if (cursor >= total) return [];

  const daysLeft = Math.max(1, durationDays - history.length);
  return createBalancedPortions(counts, daysLeft, cursor, history.length + 1);
}