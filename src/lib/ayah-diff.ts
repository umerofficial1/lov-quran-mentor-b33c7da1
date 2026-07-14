// Client-side Arabic word diff for live recitation feedback.

export function normalizeArabic(input: string): string {
  return input
    // Strip tashkeel, Quranic pause/annotation marks, tatweel and dagger alef.
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    // Unify alef variants.
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    // Alef maqsura -> ya.
    .replace(/\u0649/g, "\u064A")
    // Ta marbuta -> ha (best-effort merging).
    .replace(/\u0629/g, "\u0647")
    // Drop non-Arabic characters and punctuation.
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function arabicWordsMatch(expected: string, spoken: string): boolean {
  if (expected === spoken) return true;
  if (!expected || !spoken) return false;

  // STT writes ordinary Arabic while Quran text uses Uthmani orthography.
  const canonical = (word: string) => word
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/و(?=ه?$)/g, "و");
  const a = canonical(expected);
  const b = canonical(spoken);
  if (a === b) return true;

  // One recognition-character difference is common for longer Arabic words;
  // allowing it avoids calling an STT spelling variation a recitation mistake.
  if (Math.max(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length] <= 1;
}

export function tokenize(input: string): string[] {
  const norm = normalizeArabic(input);
  return norm ? norm.split(" ").filter(Boolean) : [];
}

export function mergeArabicTranscript(previous: string, incoming: string): string {
  const left = previous.trim().split(/\s+/).filter(Boolean);
  const right = incoming.trim().split(/\s+/).filter(Boolean);
  if (!left.length) return right.join(" ");
  if (!right.length) return left.join(" ");

  // Rolling audio clips overlap slightly. Remove the repeated boundary words
  // while using tolerant Quranic/STT spelling comparison.
  const maxOverlap = Math.min(10, left.length, right.length);
  let overlap = 0;
  for (let size = maxOverlap; size > 0; size--) {
    let matches = true;
    for (let i = 0; i < size; i++) {
      if (!arabicWordsMatch(normalizeArabic(left[left.length - size + i]), normalizeArabic(right[i]))) {
        matches = false;
        break;
      }
    }
    if (matches) {
      overlap = size;
      break;
    }
  }
  return [...left, ...right.slice(overlap)].join(" ");
}

export type LiveStatus = "pending" | "match" | "wrong" | "missing";

export interface LiveWord {
  word: string; // display word (from expected, with tashkeel)
  status: LiveStatus;
}

export interface SpokenWord {
  word: string;
  status: "match" | "wrong";
}

export interface AyahDiff {
  words: LiveWord[]; // one entry per expected word, in reading order
  extras: string[]; // spoken words that didn't align to any expected word
  spokenWords: SpokenWord[];
  matched: number;
  total: number;
}

// Match spoken transcript against expected ayah using LCS alignment.
// - Words in `expected` up to the last aligned index become `match` / `wrong`.
// - Anything after the last aligned index is `pending` (not attempted yet).
// - When `finished` is true, unaligned tail words become `missing`.
export function diffAyah(
  expectedRaw: string,
  spokenRaw: string,
  opts: { finished?: boolean } = {},
): AyahDiff {
  const expDisplay = expectedRaw.trim().split(/\s+/).filter(Boolean);
  const exp = expDisplay.map((w) => normalizeArabic(w));
  const spoken = tokenize(spokenRaw);

  const n = exp.length;
  const m = spoken.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = arabicWordsMatch(exp[i - 1], spoken[j - 1])
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matchedExpected = new Set<number>();
  const matchedSpoken = new Set<number>();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (arabicWordsMatch(exp[i - 1], spoken[j - 1])) {
      matchedExpected.add(i - 1);
      matchedSpoken.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  let lastMatched = -1;
  matchedExpected.forEach((idx) => {
    if (idx > lastMatched) lastMatched = idx;
  });
  // A spoken word is an attempted word even when it does not match anything.
  // Without this, the first incorrect word stayed grey until a later word was
  // recognized, which made live feedback look stuck.
  const lastAttempted = Math.max(lastMatched, Math.min(n - 1, m - 1));

  const words: LiveWord[] = expDisplay.map((w, idx) => {
    if (matchedExpected.has(idx)) return { word: w, status: "match" };
    if (opts.finished) {
      return { word: w, status: idx <= lastAttempted ? "wrong" : "missing" };
    }
    return { word: w, status: idx <= lastAttempted ? "wrong" : "pending" };
  });

  const extras: string[] = [];
  spoken.forEach((s, idx) => {
    if (!matchedSpoken.has(idx)) extras.push(s);
  });

  const spokenWords = spoken.map((word, idx) => ({
    word,
    status: matchedSpoken.has(idx) ? ("match" as const) : ("wrong" as const),
  }));

  return { words, extras, spokenWords, matched: matchedExpected.size, total: n };
}
