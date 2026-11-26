import { strictEqual, ok } from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createBalancedPortions,
  currentRevisionPortion,
  pendingRevisionPortions,
  totalAyahCount,
  type ChapterAyahCount,
  type CompletedPortion,
} from "./quran-revision";

const ayahCounts = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const counts: ChapterAyahCount[] = ayahCounts.map((ayahCount, index) => ({
  surah: index + 1,
  ayahCount,
}));

describe("Quran revision scheduling", () => {
  test("covers all 114 Surahs and exactly 6,236 Ayat", () => {
    strictEqual(counts.length, 114);
    strictEqual(totalAyahCount(counts), 6236);

    const portions = createBalancedPortions(counts, 30);
    strictEqual(portions.length, 30);
    strictEqual(portions[0]?.startKey, "1:1");
    strictEqual(portions.at(-1)?.endKey, "114:6");

    let cursor = 0;
    for (const portion of portions) {
      strictEqual(portion.startIndex, cursor);
      strictEqual(portion.endIndexExclusive - portion.startIndex, portion.ayahCount);
      cursor = portion.endIndexExclusive;
    }
    strictEqual(cursor, 6236);
  });

  for (const days of [30, 45, 60, 90]) {
    test(`balances the ${days}-day plan by Ayah count`, () => {
      const portions = createBalancedPortions(counts, days);
      const sizes = portions.map((portion) => portion.ayahCount);
      ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
      strictEqual(portions.length, days);
    });
  }

  test("keeps the current portion pending until it is marked complete", () => {
    const first = currentRevisionPortion(counts, 30, []);
    const stillPending = currentRevisionPortion(counts, 30, []);
    ok(first);
    strictEqual(stillPending?.startIndex, first.startIndex);
    strictEqual(stillPending?.endIndexExclusive, first.endIndexExclusive);

    const completed: CompletedPortion = {
      ...(first as NonNullable<typeof first>),
      completedAt: "2026-11-25T12:00:00.000Z",
    };
    const next = currentRevisionPortion(counts, 30, [completed]);
    strictEqual(next?.day, 2);
    strictEqual(next?.startIndex, completed.endIndexExclusive);
    strictEqual(
      pendingRevisionPortions(counts, 30, [completed])[0]?.startIndex,
      completed.endIndexExclusive,
    );
  });

  test("adjusting the duration never moves already completed Ayat", () => {
    const first = createBalancedPortions(counts, 30)[0];
    ok(first);
    if (!first) return;

    const completed: CompletedPortion = { ...first, completedAt: "2026-11-25T12:00:00.000Z" };
    const adjusted = pendingRevisionPortions(counts, 45, [completed]);
    strictEqual(adjusted[0]?.startIndex, first.endIndexExclusive);
    strictEqual(adjusted.at(-1)?.endKey, "114:6");
    strictEqual(
      adjusted.reduce((sum, portion) => sum + portion.ayahCount, 0),
      6236 - first.ayahCount,
    );
  });
});