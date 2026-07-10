# Premium AI Live Recitation — integrated into the Quran Reader

Goal: add a first-class live recitation experience on the Surah reader page (`/quran/$surahId`) without removing any existing features. Reuse the working live-WAV recorder + transcription pipeline already shipped on `/learn`; upgrade the UI to premium glass, add per-word states (green/blue-glow current/red), auto-scroll, live accuracy, and a full end-of-session report.

## Scope

- No changes to routing, auth, audio player, bookmarks, translations, settings, or the `/learn` Mistake tool.
- Additive-only: a new floating "Live Recitation" panel on the Surah reader.

## UX

1. On `/quran/$surahId`, add a large mic FAB (bottom-right, above `MobileNav`).
2. Tap → opens a full-height glass drawer showing the surah's Arabic (Uthmani) split word-by-word.
3. Big central mic button with pulse animation. States: idle / listening / analyzing.
4. Live states per word:
   - `pending` — muted pearl
   - `current` — glowing blue ring + subtle scale
   - `match` — green with soft glow, confidence dot
   - `wrong` / `missing` — red underline + tooltip on hover
5. Header chips: **Accuracy %**, **Words X/Y**, **Ayah N**. Updates live as transcript grows.
6. Auto-scroll: the current word is kept centered using `scrollIntoView({ block: 'center', behavior: 'smooth' })`, throttled.
7. Stop → analyzing spinner → **Report card** with: correct/incorrect/missed counts, overall accuracy, Urdu tajweed feedback, pronunciation notes, per-word list, and a **Retry mistakes only** button that restarts the session filtered to only the wrong/missed ayah segments.

## Technical

New file: `src/components/LiveRecitationDrawer.tsx`
- Props: `surahId`, `verses` (already loaded by the reader), `open`, `onOpenChange`.
- Uses existing `startLiveWavRecorder` (`src/lib/live-wav-recorder.ts`), `diffAyah` (`src/lib/ayah-diff.ts`), `/api/transcribe-chunk`, `/api/mistake-check-text`.
- Flattens all verses' words into one sequence with `{ verseKey, wordIndex, text }` so live diffing spans the whole surah, not one ayah at a time.
- Maintains `currentIndex` (last matched word + 1) → drives blue glow + autoscroll.
- Accuracy = `matched / attempted` computed from `diffAyah` results merged across ayat.
- Confidence per word: derived from transcription — the transcribe endpoint already returns `text`; extend it to also return the segment `logprobs`/`avg_logprob` when available, mapped to 0–100. (Fallback: 100 for matched, 40 for wrong.)

New: `src/components/RecitationReport.tsx`
- Renders the final report with tabs: **Summary**, **Word-by-word**, **Tajweed tips**.
- "Retry mistakes only" builds a filtered word list of just the wrong/missed spans and re-opens the drawer in retry mode.

Reader integration: `src/routes/quran.$surahId.tsx`
- Import + mount `<LiveRecitationDrawer />` behind a floating mic button. No other changes.

Backend (small tweak, no breaking changes):
- `src/routes/api/transcribe-chunk.ts` — pass `response_format=json` (default) and forward `avg_logprob` when the model returns it. If absent, omit — client falls back gracefully.
- `src/routes/api/mistake-check-text.ts` — accept an optional `words: {expected, heard, status}[]` payload from client-side diff to seed the AI (already handles missing gracefully). No schema change to response.

## Styling

- Uses existing Madinah Blue tokens (bg #070C1F, surface #0F1E3D, teal #1FB6B0, gold #C9A24C, pearl #EEF2FB).
- Glass: `bg-white/5 backdrop-blur-xl border border-white/10`.
- Animations: `animate-fade-in`, `animate-scale-in`, custom `pulse-mic` keyframe added to `src/styles.css`.
- Mobile-first: drawer is full-screen on <md, right-side sheet on md+.
- Respects existing dark theme (only theme in project).

## Non-goals for this pass

- No changes to `/learn`'s Mistake tool.
- No new DB tables (report is session-only). Persisting reports can be a follow-up.

## Files

- create `src/components/LiveRecitationDrawer.tsx`
- create `src/components/RecitationReport.tsx`
- edit `src/routes/quran.$surahId.tsx` (mount drawer + FAB)
- edit `src/styles.css` (pulse-mic + word-glow keyframes)
- edit `src/routes/api/transcribe-chunk.ts` (optional confidence passthrough)
