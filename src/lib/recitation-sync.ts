// Real-time Quran word-synchronization engine.
// Not a diff — an alignment/tracker that keeps a pointer inside the expected
// word sequence and re-anchors when the reciter jumps, pauses, or repeats.

import { normalizeArabic, tokenize } from "@/lib/ayah-diff";

export type WordState = "pending" | "current" | "match" | "wrong" | "missing" | "extra";

export interface TrackedWord {
  state: WordState;
  confidence: number; // 0-100
}

export interface SyncInput {
  expected: string[];      // normalized expected tokens (whole surah/juz flattened)
  spokenAll: string[];     // ALL spoken tokens so far (accumulated transcript)
}

export interface SyncResult {
  words: TrackedWord[];    // one entry per expected word
  cursor: number;          // next expected index
  extras: string[];        // spoken tokens the engine could not place
  attempted: number;       // match + wrong count
  correct: number;
  wrong: number;
}

// Character-similarity for two normalized Arabic tokens.
// Returns 0..1 where 1 is exact.
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const la = a.length;
  const lb = b.length;
  // Quick length reject
  if (Math.abs(la - lb) > Math.max(la, lb) * 0.6) return 0;
  // Simple Levenshtein
  const dp: number[] = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) dp[j] = j;
  for (let i = 1; i <= la; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  const dist = dp[lb];
  return 1 - dist / Math.max(la, lb);
}

const MATCH_THRESHOLD = 0.72;  // above → count as pronunciation match
const STRONG_MATCH = 0.9;      // above → high confidence

// Align the entire spoken buffer against expected. Supports:
//  - fuzzy word match (mispronunciation still counts, lower confidence)
//  - small local skips (up to LOCAL_SKIP expected words)
//  - long jumps (re-anchor anywhere via a widened search when local lookahead fails)
//  - extras (spoken tokens not in expected — recorded but skipped)
const LOCAL_SKIP = 4;
const JUMP_WINDOW = 200; // words to scan for a re-anchor point
const JUMP_MIN_RUN = 2;  // require ≥2 sequential matches to accept a jump

export function syncRecitation({ expected, spokenAll }: SyncInput): SyncResult {
  const n = expected.length;
  const m = spokenAll.length;

  const words: TrackedWord[] = new Array(n)
    .fill(null)
    .map(() => ({ state: "pending" as WordState, confidence: 0 }));
  const extras: string[] = [];

  let ei = 0;
  let si = 0;

  while (si < m && ei < n) {
    const sp = spokenAll[si];
    // 1. Try direct/fuzzy match at cursor
    const simHere = similarity(expected[ei], sp);
    if (simHere >= MATCH_THRESHOLD) {
      words[ei] = { state: "match", confidence: Math.round(simHere * 100) };
      ei++;
      si++;
      continue;
    }

    // 2. Small local lookahead in expected (user skipped words)
    let bestLocal = -1;
    let bestLocalSim = 0;
    for (let k = 1; k <= LOCAL_SKIP && ei + k < n; k++) {
      const s = similarity(expected[ei + k], sp);
      if (s >= MATCH_THRESHOLD && s > bestLocalSim) {
        bestLocal = k;
        bestLocalSim = s;
      }
    }
    if (bestLocal > 0) {
      for (let k = 0; k < bestLocal; k++) {
        // Skipped expected words are marked wrong/missing
        words[ei + k] = { state: "missing", confidence: 0 };
      }
      words[ei + bestLocal] = {
        state: "match",
        confidence: Math.round(bestLocalSim * 100),
      };
      ei += bestLocal + 1;
      si++;
      continue;
    }

    // 3. Small local lookahead in spoken (user added extra words)
    let extraFound = -1;
    let extraSim = 0;
    for (let k = 1; k <= 2 && si + k < m; k++) {
      const s = similarity(expected[ei], spokenAll[si + k]);
      if (s >= MATCH_THRESHOLD && s > extraSim) {
        extraFound = k;
        extraSim = s;
      }
    }
    if (extraFound > 0) {
      for (let k = 0; k < extraFound; k++) extras.push(spokenAll[si + k]);
      si += extraFound;
      continue;
    }

    // 4. Jump detection: search a wider window; require a short confirming run.
    let jumpTo = -1;
    let jumpSim = 0;
    const scanEnd = Math.min(n, ei + JUMP_WINDOW);
    const scanStart = Math.max(0, ei - 20); // allow jumping slightly back too
    for (let q = scanStart; q < scanEnd; q++) {
      if (q >= ei - LOCAL_SKIP && q <= ei + LOCAL_SKIP) continue;
      const s = similarity(expected[q], sp);
      if (s >= STRONG_MATCH) {
        // Confirm with the next spoken token if possible
        let confirmed = true;
        if (si + 1 < m && q + 1 < n && JUMP_MIN_RUN > 1) {
          confirmed = similarity(expected[q + 1], spokenAll[si + 1]) >= MATCH_THRESHOLD;
        }
        if (confirmed && s > jumpSim) {
          jumpTo = q;
          jumpSim = s;
        }
      }
    }
    if (jumpTo >= 0) {
      // Everything between ei..jumpTo becomes "missing" (skipped ayat)
      for (let k = ei; k < jumpTo; k++) {
        words[k] = { state: "missing", confidence: 0 };
      }
      words[jumpTo] = { state: "match", confidence: Math.round(jumpSim * 100) };
      ei = jumpTo + 1;
      si++;
      continue;
    }

    // 5. No alignment — record as wrong (mispronounced at cursor), advance both
    if (simHere > 0.35) {
      words[ei] = {
        state: "wrong",
        confidence: Math.round(simHere * 100),
      };
    } else {
      // Truly foreign token — treat as extra, don't burn expected cursor yet
      extras.push(sp);
      si++;
      continue;
    }
    ei++;
    si++;
  }

  // Any remaining spoken tokens are extras
  while (si < m) {
    extras.push(spokenAll[si]);
    si++;
  }

  // Mark the current cursor
  if (ei < n && words[ei].state === "pending") {
    words[ei].state = "current";
  }

  const correct = words.filter((w) => w.state === "match").length;
  const wrong = words.filter((w) => w.state === "wrong").length;

  return {
    words,
    cursor: ei,
    extras,
    attempted: correct + wrong,
    correct,
    wrong,
  };
}

// Convenience wrapper: takes raw Arabic display strings + raw transcript.
export function syncFromRaw(expectedDisplay: string[], transcript: string): SyncResult {
  const expected = expectedDisplay.map((w) => normalizeArabic(w));
  const spoken = tokenize(transcript);
  return syncRecitation({ expected, spokenAll: spoken });
}
