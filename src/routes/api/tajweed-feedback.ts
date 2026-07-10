import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

// Session-level tajweed / pronunciation feedback for the live recitation drawer.
// Client already computes per-word diff; we just ask the AI for Urdu
// tajweed + pronunciation tips based on the mistakes it saw.

const FeedbackSchema = z.object({
  overall: z.enum(["excellent", "good", "needs_work"]),
  summary_urdu: z.string(),
  tajweed_tips: z.array(z.string()),
  pronunciation_tips: z.array(z.string()),
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
          .map((m) => `- ayah ${m.verseKey}: expected "${m.expected}"${m.heard ? `, heard "${m.heard}"` : ""}`)
          .join("\n");

        try {
          const { output } = await generateText({
            model: gateway("google/gemini-2.5-flash"),
            output: Output.object({ schema: FeedbackSchema }),
            system:
              "You are a kind Qur'an tajweed coach writing in simple Urdu. " +
              "Given a session's stats and specific mistaken words, produce short, actionable Urdu feedback. " +
              "Return JSON with EXACTLY: overall, summary_urdu, tajweed_tips (2-4 items), pronunciation_tips (2-4 items).",
            prompt:
              `Surah: ${data.surahId}\n` +
              `Accuracy: ${data.accuracy}% (correct ${data.correct}, wrong ${data.wrong}, missed ${data.missed}).\n` +
              `Mistakes:\n${mistakeList || "(none)"}\n\n` +
              `Full transcript: ${data.transcript}`,
          });
          return Response.json(output);
        } catch (err) {
          if (NoObjectGeneratedError.isInstance(err)) {
            return Response.json(
              {
                overall: data.accuracy >= 90 ? "excellent" : data.accuracy >= 70 ? "good" : "needs_work",
                summary_urdu: "AI فیڈبیک دستیاب نہیں، لیکن آپ کی کارکردگی محفوظ ہے۔",
                tajweed_tips: [],
                pronunciation_tips: [],
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
