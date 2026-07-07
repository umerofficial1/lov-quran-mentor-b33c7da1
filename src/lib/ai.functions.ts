import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText, Output } from "ai";

const MODEL = "google/gemini-2.5-flash";

function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

// ---------- Translation comparison ----------
export const translationCompare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ verseKey: z.string().regex(/^\d+:\d+$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    // pull three well-known translations from api.quran.com in one call
    const ids = [131, 20, 84, 158, 97]; // Saheeh Intl EN, alt EN, Pickthall EN, Maududi UR, Jalandhari UR
    const url = `https://api.quran.com/api/v4/quran/translations/${ids.join(
      ",",
    )}?verse_key=${data.verseKey}`;
    // The multi-id endpoint returns per translation; fetch one by one for reliability
    const results = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(
          `https://api.quran.com/api/v4/quran/translations/${id}?verse_key=${data.verseKey}`,
        );
        if (!res.ok) return null;
        const j = await res.json();
        return { id, text: j.translations?.[0]?.text ?? "" };
      }),
    );

    // Fetch Arabic
    const arRes = await fetch(
      `https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${data.verseKey}`,
    );
    const arJ = arRes.ok ? await arRes.json() : { verses: [] };
    const arabic = arJ.verses?.[0]?.text_uthmani ?? "";

    const labels: Record<number, string> = {
      131: "Saheeh International (EN)",
      20: "Sahih International alt (EN)",
      84: "Pickthall (EN)",
      158: "Maududi (UR)",
      97: "Jalandhari (UR)",
    };

    const translations = results
      .filter((r): r is { id: number; text: string } => !!r)
      .map((r) => ({ label: labels[r.id], text: r.text }));

    // Ask AI to compare them briefly
    const gateway = getGateway();
    const cmp = await generateText({
      model: gateway(MODEL),
      system:
        "You are a careful Quran translation reviewer. Compare the given translations of one ayah. Note nuances in meaning, tone, and word choice in 3–5 short bullets. Be respectful and neutral across scholars.",
      prompt:
        `Ayah ${data.verseKey}\nArabic: ${arabic}\n\n` +
        translations.map((t) => `- ${t.label}: ${t.text}`).join("\n"),
    });

    return {
      verseKey: data.verseKey,
      arabic,
      translations,
      comparison: cmp.text,
    };
  });

// ---------- Quiz generation ----------
const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      choices: z.array(z.string()),
      answerIndex: z.number(),
      explanation: z.string(),
    }),
  ),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        topic: z.string().min(2).max(120),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        count: z.number().int().min(3).max(10).default(5),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const { output } = await generateText({
      model: gateway(MODEL),
      output: Output.object({ schema: QuizSchema }),
      system:
        "You are an Islamic studies teacher. Create multiple-choice quiz questions grounded in mainstream Sunni scholarship. Cite Surah:Ayah when relevant. Each question has exactly 4 choices. answerIndex is 0-based.",
      prompt: `Topic: ${data.topic}. Difficulty: ${data.difficulty}. Count: ${data.count}. Return JSON only.`,
    });
    // Normalize
    return {
      topic: data.topic,
      questions: output.questions.slice(0, data.count).map((q) => ({
        ...q,
        choices: q.choices.slice(0, 4),
        answerIndex: Math.max(0, Math.min(3, q.answerIndex)),
      })),
    };
  });

// ---------- Memorization coach ----------
export const memorizationCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        surah: z.number().int().min(1).max(114),
        strengths: z.string().max(400).optional(),
        struggles: z.string().max(400).optional(),
        minutesPerDay: z.number().int().min(5).max(240).default(30),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const r = await generateText({
      model: gateway(MODEL),
      system:
        "You are a warm, expert hifz coach. Produce a personalized daily plan for memorizing the requested surah. Cover: (1) recommended new lines per day, (2) morning + evening revision blocks, (3) tips for common problem spots, (4) a weekly checkpoint. Use headings and bullets. Keep it under 400 words.",
      prompt: `Surah number: ${data.surah}. Minutes/day: ${data.minutesPerDay}. Student strengths: ${data.strengths ?? "unspecified"}. Struggles: ${data.struggles ?? "unspecified"}.`,
    });
    return { markdown: r.text };
  });

// ---------- Revision planner ----------
export const revisionPlanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        memorizedSurahs: z.array(z.number().int().min(1).max(114)).min(1),
        weeklyMinutes: z.number().int().min(30).max(2000).default(210),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const r = await generateText({
      model: gateway(MODEL),
      system:
        "You are a hifz revision coach. Build a 7-day revision schedule that cycles through all listed surahs, prioritizing weakest first. Output as a Markdown table with columns: Day, Surahs (numbers), Minutes, Focus.",
      prompt: `Memorized surahs: ${data.memorizedSurahs.join(", ")}. Weekly minutes: ${data.weeklyMinutes}.`,
    });
    return { markdown: r.text };
  });

// ---------- Mistake checker (student recitation transcript vs actual ayah) ----------
export const mistakeChecker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        verseKey: z.string().regex(/^\d+:\d+$/),
        transcript: z.string().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const arRes = await fetch(
      `https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${data.verseKey}`,
    );
    const arJ = arRes.ok ? await arRes.json() : { verses: [] };
    const arabic = arJ.verses?.[0]?.text_uthmani ?? "";

    const gateway = getGateway();
    const r = await generateText({
      model: gateway(MODEL),
      system:
        "You are a kind tajweed teacher. Compare the student's recited text to the correct ayah. Identify (a) missed or swapped words, (b) tajweed rules likely violated (madd, ghunna, qalqala, ikhfa), and (c) two concrete practice tips. Be gentle. Use short bullets.",
      prompt: `Ayah ${data.verseKey}\nCorrect: ${arabic}\nStudent recited: ${data.transcript}`,
    });
    return { verseKey: data.verseKey, correct: arabic, feedback: r.text };
  });

// ---------- Listening test evaluation ----------
export const listeningTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        verseKey: z.string().regex(/^\d+:\d+$/),
        answer: z.string().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const arRes = await fetch(
      `https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${data.verseKey}`,
    );
    const arJ = arRes.ok ? await arRes.json() : { verses: [] };
    const arabic = arJ.verses?.[0]?.text_uthmani ?? "";

    const gateway = getGateway();
    const r = await generateText({
      model: gateway(MODEL),
      system:
        "You are testing whether the student correctly identified an ayah after listening. Compare their written answer to the correct ayah. Score 0-100. Return a JSON object with fields: score (0-100), verdict (correct|close|incorrect), notes (short string).",
      output: Output.object({
        schema: z.object({
          score: z.number(),
          verdict: z.enum(["correct", "close", "incorrect"]),
          notes: z.string(),
        }),
      }),
      prompt: `Correct ayah ${data.verseKey}: ${arabic}\nStudent wrote: ${data.answer}`,
    });
    return { verseKey: data.verseKey, correct: arabic, ...r.output };
  });
