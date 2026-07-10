import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const FeedbackSchema = z.object({
  overall: z.enum(["excellent", "good", "needs_work"]),
  summary_urdu: z.string(),
  tajweed_tips: z.array(z.string()),
  pronunciation_tips: z.array(z.string()),
  tajweed_score: z.number(),
  pronunciation_score: z.number(),
});

const InputSchema = z.object({
  surahId: z.number().int().min(1).max(114),
  accuracy: z.number(),
  pronunciationScore: z.number().optional(),
  correct: z.number(),
  wrong: z.number(),
  missed: z.number(),
  extras: z.array(z.string()).max(60).optional(),
  transcript: z.string().max(6000),
  mistakes: z
    .array(
      z.object({
        expected: z.string(),
        heard: z.string().optional(),
        verseKey: z.string(),
        confidence: z.number().optional(),
        state: z.string().optional(),
      }),
    )
    .max(60),
});

export const Route = createFileRoute("/api/tajweed-feedback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const mistakeList = data.mistakes
          .map((m) => `- ${m.verseKey} [${m.state ?? "wrong"}]: expected "${m.expected}"${m.confidence != null ? ` (conf ${m.confidence}%)` : ""}`)
          .join("\n");
        const extrasLine = data.extras && data.extras.length ? `Extra words heard: ${data.extras.join(" · ")}\n` : "";

        try {
          const { output } = await generateText({
            model: gateway("google/gemini-2.5-flash"),
            output: Output.object({ schema: FeedbackSchema }),
            system:
              "You are a strict but kind Qur'an tajweed coach writing in simple Urdu. " +
              "Given a Quran recitation session's word-alignment stats, produce short actionable Urdu feedback. " +
              "Return JSON with EXACTLY these keys: overall, summary_urdu, tajweed_tips (2-4 items), pronunciation_tips (2-4 items), " +
              "tajweed_score (0-100), pronunciation_score (0-100). " +
              "Base pronunciation_score on the reported average confidence and mispronunciation count. " +
              "Base tajweed_score on the kinds of mistakes (letter articulation, madd, ghunna, qalqalah) inferrable from the mistake list. " +
              "Do NOT use alternate key names.",
            prompt:
              `Surah: ${data.surahId}\n` +
              `Word accuracy: ${data.accuracy}% (correct ${data.correct}, wrong ${data.wrong}, missed ${data.missed}).\n` +
              (data.pronunciationScore != null ? `Average pronunciation confidence: ${data.pronunciationScore}%\n` : "") +
              extrasLine +
              `Mistakes:\n${mistakeList || "(none)"}\n\n` +
              `Full transcript: ${data.transcript}`,
          });
          return Response.json(output);
        } catch (err) {
          if (NoObjectGeneratedError.isInstance(err)) {
            const overall: Feedback["overall"] =
              data.accuracy >= 90 ? "excellent" : data.accuracy >= 70 ? "good" : "needs_work";
            return Response.json(
              {
                overall,
                summary_urdu: "AI فیڈبیک دستیاب نہیں، مگر آپ کی کارکردگی محفوظ ہے۔",
                tajweed_tips: [],
                pronunciation_tips: [],
                tajweed_score: Math.max(0, data.accuracy - 15),
                pronunciation_score: data.pronunciationScore ?? data.accuracy,
              },
              { status: 200 },
            );
          }
          throw err;
        }
      },
    },
  },
});

type Feedback = z.infer<typeof FeedbackSchema>;
