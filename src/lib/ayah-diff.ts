// Client-side Arabic word diff for live recitation feedback.

export function normalizeArabic(input: string): string {
  return input
    // Strip tashkeel (harakat), tatweel and dagger alef.
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    // Unify alef variants.
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")
    // Alef maqsura -> ya.
    .replace(/\u0649/g, "\u064A")
    // Ta marbuta -> ha (best-effort merging).
    .replace(/\u0629/g, "\u0647")
    // Drop non-Arabic characters and punctuation.
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const norm = normalizeArabic(input);
  return norm ? norm.split(" ").filter(Boolean) : [];
}

export type LiveStatus = "pending" | "match" | "wrong" | "missing";

export interface LiveWord {
  word: string; // display word (from expected, with tashkeel)
  status: LiveStatus;
}

export interface AyahDiff {
  words: LiveWord[]; // one entry per expected word, in reading order
  extras: string[]; // spoken words that didn't align to any expected word
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
      dp[i][j] = exp[i - 1] === spoken[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matchedExpected = new Set<number>();
  const matchedSpoken = new Set<number>();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (exp[i - 1] === spoken[j - 1]) {
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

  const words: LiveWord[] = expDisplay.map((w, idx) => {
    if (matchedExpected.has(idx)) return { word: w, status: "match" };
    if (opts.finished) {
      return { word: w, status: idx <= lastMatched ? "wrong" : "missing" };
    }
    return { word: w, status: idx <= lastMatched ? "wrong" : "pending" };
  });

  const extras: string[] = [];
  spoken.forEach((s, idx) => {
    if (!matchedSpoken.has(idx)) extras.push(s);
  });

  return { words, extras, matched: matchedExpected.size, total: n };
}
