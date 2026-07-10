
# Live Recitation Coach

Abhi mistake checker record karta hai, phir stop pe pura result deta hai. User chahta hai:
- Recording ke dauran hi text likha aata jaye
- Sath sath ghalatiyan (missing / wrong / extra words) highlight hoti rahen
- Expected ayah upar, live transcript neeche, dono me color-coded diff

## User Flow

1. Ayah screen pe dikhti hai (Arabic + translation).
2. "Start reciting" dabao → mic on.
3. Har ~3 sec ka audio chunk backend ko jata hai, transcribe hota hai, transcript grow karta hai (append).
4. Har update pe expected vs spoken ka word-diff chalta hai:
   - ✅ green = sahi bola
   - 🟡 amber = pronunciation ya minor farq (tashkeel level)
   - 🔴 red = ghalat ya missing
5. Live "progress" bar dikhata hai kitni ayah cover ho gayi.
6. "Stop" pe final AI review (jo pehle se hai) chalta hai — overall score + summary.

## Implementation

### 1. Chunked streaming recorder (client)
- `MediaRecorder` with `timeslice = 3000ms` → har 3 sec `ondataavailable` fires with a Blob.
- Har chunk ko cumulative buffer me add karke `/api/transcribe-chunk` bhejo (poora audio abhi tak ka, so context stays intact for Arabic STT).
- Optimization: sirf last 15 sec ka rolling window bhejein taake payload chhota rahe; ayah short hoti hai.

### 2. Transcribe endpoint
New: `src/routes/api/transcribe-chunk.ts` — public API route.
- Accepts multipart `audio` blob.
- Forwards to Lovable AI Gateway `/v1/audio/transcriptions` with `openai/gpt-4o-transcribe`, `language=ar`.
- Returns `{ text }`.

### 3. Live diff (client, pure JS)
Utility `src/lib/ayah-diff.ts`:
- Normalize Arabic: strip tashkeel, tatweel, punctuation, unify alef/hamza forms.
- Tokenize expected + spoken into word arrays.
- Run LCS-based alignment → per expected word status: `match | minor | wrong | pending`.
- Extra spoken words flagged separately.

### 4. UI
New component `LiveReciter` in `learn.tsx` (replaces current MistakeTool auto-start voice mode; upload/one-shot record removed as per last turn):
- Expected ayah rendered word-by-word, each `<span>` colored by status.
- Live transcript box (RTL, Arabic font) shows raw spoken text.
- Status pills: "Sunaya jaa raha hai…", word count matched X/Y.
- Stop button → runs existing `/api/mistake-check-voice` for final graded feedback.

### 5. Backend limits
- Chunk size cap 2 MB, MIME whitelist (webm/mp4/ogg), same as existing endpoint.
- Debounce: agar previous transcribe abhi tak pending hai, skip next tick.

## Technical Notes

- STT model: `openai/gpt-4o-transcribe` (Arabic accuracy zyada).
- No websocket needed — 3-sec polling transcribe kaafi feel karega "live".
- Arabic normalization regex: `/[\u064B-\u0652\u0670\u0640]/g` (harakat + tatweel).
- Alef unification: `[\u0622\u0623\u0625] → \u0627`, ya-hamza `\u0649 → \u064A`.
- Diff: standard Myers/LCS on token arrays — small enough (ayah usually <30 words).

## Files

- new: `src/routes/api/transcribe-chunk.ts`
- new: `src/lib/ayah-diff.ts`
- edit: `src/routes/learn.tsx` — replace MistakeTool recording UI with LiveReciter; keep final scoring call to `/api/mistake-check-voice`.

## Out of scope

- Tajweed rules (madd, ghunna) — sirf word-level matching, not qira'at grading.
- Multi-ayah continuous mode — one ayah at a time.
