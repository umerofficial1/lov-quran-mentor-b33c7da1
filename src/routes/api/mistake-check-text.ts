import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

// Text-based mistake analysis. The client accumulates a live transcript
// during segmented recording (see /api/transcribe-chunk) and, on stop,
// calls this endpoint to get a graded Gemini analysis without re-uploading
// the whole audio.

const DiffSchema = z.object({
  overall: z.enum(["correct", "minor", "major"]),
  score: z.number(),
  summary: z.string(),
  words: z.array(
    z.object({
      expected: z.string(),
      heard: z.string(),
      status: z.enum(["ok", "wrong", "missing", "extra"]),
      issue: z.string(),
    }),
  ),
  tips: z.array(z.string()),
});

export const Route = createFileRoute("/api/mistake-check-text")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { transcript?: unknown; verseKey?: unknown };
        try {
          payload = await request.json();
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        const transcript = String(payload.transcript ?? "").trim();
        const verseKey = String(payload.verseKey ?? "");
        if (!transcript || !/^\d+:\d+$/.test(verseKey)) {
          return new Response("bad request", { status: 400 });
        }
        if (transcript.length > 4000) {
          return new Response("transcript too long", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const arRes = await fetch(
          `https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${verseKey}`,
        );
        const arJ = arRes.ok ? await arRes.json() : { verses: [] };
        const arabic: string = arJ.verses?.[0]?.text_uthmani ?? "";

        const gateway = createLovableAiGatewayProvider(key);
        const { output } = await generateText({
          model: gateway("google/gemini-2.5-flash"),
          output: Output.object({ schema: DiffSchema }),
          system:
            "You are a strict but kind tajweed teacher. Compare the student's recited transcript to the correct ayah. " +
            "Return a word-by-word diff aligned to the CORRECT ayah in reading order. " +
            "For every word of the correct ayah, output an entry with: expected (the correct word in Arabic), " +
            "heard (what the student actually said for that word, or empty), " +
            "status ('ok' = correctly recited, 'wrong' = mispronounced or wrong word, 'missing' = skipped), " +
            "issue (short Urdu/English note e.g. 'madd chhoot gayi', 'ghunna nahi lagaya', 'lafz badal diya'). " +
            "If the student added extra words not in the ayah, append entries with status 'extra'. " +
            "Then give: overall verdict (correct/minor/major), score 0-100, one-line summary in Urdu, " +
            "and 2-3 practical tips in Urdu. Be gentle and specific.",
          prompt: `Ayah ${verseKey}\nCorrect Arabic: ${arabic}\nStudent said (transcribed): ${transcript}`,
        });

        return Response.json({
          verseKey,
          correct: arabic,
          transcript,
          ...output,
        });
      },
    },
  },
});
