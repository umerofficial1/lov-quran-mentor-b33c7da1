import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireAuthRequest } from "@/lib/require-auth-request.server";

// Session-level tajweed / pronunciation feedback for the live recitation drawer.
// Client already computes per-word diff; we just ask the AI for Urdu
// tajweed + pronunciation tips based on the mistakes it saw.

const FeedbackSchema = z.object({
  overall: z.enum(["excellent", "good", "needs_work"]),
  summary_urdu: z.string(),
  tajweed_tips: z.array(z.string()),
  pronunciation_tips: z.array(z.string()),
  tajweed_mistakes: z.array(z.string()).optional().default([]),
  makharij_mistakes: z.array(z.string()).optional().default([]),
});

const InputSchema = z.object({
  surahId: z.number().int().min(1).max(114),
  accuracy: z.number(),
  correct: z.number(),
  wrong: z.number(),
  missed: z.number(),
  transcript: z.string().max(6000),
  mistakes: z
    .array(
      z.object({
        expected: z.string(),
        heard: z.string().optional(),
        verseKey: z.string(),
      }),
    )
    .max(60),
});

function stripCodeFence(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  return t;
}

function extractJson(s: string): string {
  const clean = stripCodeFence(s);
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first >= 0 && last > first) return clean.slice(first, last + 1);
  return clean;
}

function heuristicFallback(accuracy: number, mistakes: number) {
  const overall = accuracy >= 90 ? "excellent" : accuracy >= 70 ? "good" : "needs_work";
  const summary_urdu =
    accuracy >= 90
      ? "ماشاءاللہ! آپ کی تلاوت بہت اچھی رہی۔ روزانہ مشق جاری رکھیں۔"
      : accuracy >= 70
      ? "اچھی کوشش! تھوڑی اور مشق سے آپ ماہر ہو جائیں گے۔"
      : "کوئی بات نہیں، ہر مشق آپ کو بہتر بناتی ہے۔ آہستہ اور توجہ سے پڑھیں۔";
  return {
    overall,
    summary_urdu,
    tajweed_tips: [
      "مدّ والے حروف پر مکمل حرکت دیں (کم از کم دو ہرکات)۔",
      "غنّہ (ن اور م پر شدّہ) والے مقامات پر آواز کو ناک سے نکالیں۔",
    ],
    pronunciation_tips: [
      mistakes > 0
        ? "جو الفاظ چھوٹے، ان کو الگ سے تین بار دہرائیں۔"
        : "ہر آیت کے بعد ایک لمحے کا وقفہ لیں۔",
      "قاری کی ریکارڈنگ کے ساتھ ساتھ آہستہ آواز میں پڑھیں۔",
    ],
    tajweed_mistakes: [] as string[],
    makharij_mistakes: [] as string[],
  };
}

export const Route = createFileRoute("/api/tajweed-feedback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireAuthRequest(request);
        if (unauth) return unauth;
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        const parsed = InputSchema.safeParse(raw);
        if (!parsed.success) return new Response("bad request", { status: 400 });
        const data = parsed.data;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json(heuristicFallback(data.accuracy, data.mistakes.length), { status: 200 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const mistakeList = data.mistakes
          .map((m) => `- ayah ${m.verseKey}: expected "${m.expected}"${m.heard ? `, heard "${m.heard}"` : ""}`)
          .join("\n");

        try {
          const { text } = await generateText({
            model: gateway("google/gemini-2.5-flash"),
            system:
              "You are a kind Qur'an tajweed coach. Reply ONLY with a single JSON object (no prose, no markdown fences). " +
              "Schema: { \"overall\": \"excellent\" | \"good\" | \"needs_work\", \"summary_urdu\": string, \"tajweed_tips\": string[2..4], \"pronunciation_tips\": string[2..4], \"tajweed_mistakes\": string[0..5], \"makharij_mistakes\": string[0..5] }. " +
              "All text values MUST be in simple Urdu (Nastaliq). tajweed_mistakes = specific tajweed rule errors (ghunna, madd, qalqala, ikhfa, idgham) observed. makharij_mistakes = specific letter articulation errors (e.g. ص/س confusion, ق/ک). Keep each entry short and specific.",
            prompt:
              `Surah: ${data.surahId}\n` +
              `Accuracy: ${data.accuracy}% (correct ${data.correct}, wrong ${data.wrong}, missed ${data.missed}).\n` +
              `Mistakes:\n${mistakeList || "(none)"}\n\n` +
              `Transcript (Arabic, may be partial): ${data.transcript.slice(0, 2000)}\n\n` +
              `Return JSON only.`,
          });

          const jsonStr = extractJson(text);
          let obj: unknown;
          try {
            obj = JSON.parse(jsonStr);
          } catch {
            return Response.json(heuristicFallback(data.accuracy, data.mistakes.length), { status: 200 });
          }
          const check = FeedbackSchema.safeParse(obj);
          if (check.success) {
            return Response.json(check.data);
          }
          // Partial coerce
          const anyObj = obj as Record<string, unknown>;
          const coerced = {
            overall:
              typeof anyObj.overall === "string" && ["excellent", "good", "needs_work"].includes(anyObj.overall)
                ? (anyObj.overall as "excellent" | "good" | "needs_work")
                : data.accuracy >= 90
                ? "excellent"
                : data.accuracy >= 70
                ? "good"
                : "needs_work",
            summary_urdu:
              typeof anyObj.summary_urdu === "string" && anyObj.summary_urdu.trim()
                ? anyObj.summary_urdu
                : heuristicFallback(data.accuracy, data.mistakes.length).summary_urdu,
            tajweed_tips: Array.isArray(anyObj.tajweed_tips)
              ? (anyObj.tajweed_tips.filter((x) => typeof x === "string") as string[])
              : heuristicFallback(data.accuracy, data.mistakes.length).tajweed_tips,
            pronunciation_tips: Array.isArray(anyObj.pronunciation_tips)
              ? (anyObj.pronunciation_tips.filter((x) => typeof x === "string") as string[])
              : heuristicFallback(data.accuracy, data.mistakes.length).pronunciation_tips,
            tajweed_mistakes: Array.isArray(anyObj.tajweed_mistakes)
              ? (anyObj.tajweed_mistakes.filter((x) => typeof x === "string") as string[])
              : [],
            makharij_mistakes: Array.isArray(anyObj.makharij_mistakes)
              ? (anyObj.makharij_mistakes.filter((x) => typeof x === "string") as string[])
              : [],
          };
          return Response.json(coerced);
        } catch (err) {
          console.error("tajweed-feedback AI error", err);
          return Response.json(heuristicFallback(data.accuracy, data.mistakes.length), { status: 200 });
        }
      },
    },
  },
});
