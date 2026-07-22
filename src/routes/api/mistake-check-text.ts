import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireAuthRequest } from "@/lib/require-auth-request.server";


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
        const unauth = await requireAuthRequest(request);
        if (unauth) return unauth;
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
        let output: z.infer<typeof DiffSchema> | null = null;
        try {
          const res = await generateText({
            model: gateway("google/gemini-2.5-flash"),
            output: Output.object({ schema: DiffSchema }),
            system:
              "You are a strict but kind tajweed teacher. Compare the student's recited transcript to the correct ayah. " +
              "Return JSON with EXACTLY these top-level keys: overall, score, summary, words, tips. " +
              "overall = 'correct' | 'minor' | 'major'. score = 0-100. summary = one-line Urdu. " +
              "words = array aligned to the correct ayah in reading order; each item MUST have keys: expected, heard, status, issue. " +
              "status = 'ok' | 'wrong' | 'missing' | 'extra'. Append 'extra' entries for extra spoken words. " +
              "tips = 2-3 Urdu practical tips. Do NOT use keys like 'diff' or 'overall_verdict'.",
            prompt: `Ayah ${verseKey}\nCorrect Arabic: ${arabic}\nStudent said (transcribed): ${transcript}`,
          });
          output = res.output;
        } catch (err) {
          if (NoObjectGeneratedError.isInstance(err)) {
            // Try to salvage: parse raw text and remap common alt keys.
            try {
              const raw = JSON.parse(err.text ?? "{}");
              const remapped = {
                overall: raw.overall ?? raw.overall_verdict ?? "minor",
                score: typeof raw.score === "number" ? raw.score : 0,
                summary: raw.summary ?? "",
                words: Array.isArray(raw.words)
                  ? raw.words
                  : Array.isArray(raw.diff)
                    ? raw.diff
                    : [],
                tips: Array.isArray(raw.tips) ? raw.tips : [],
              };
              output = DiffSchema.parse(remapped);
            } catch {
              output = null;
            }
          } else {
            throw err;
          }
        }

        if (!output) {
          return Response.json(
            { verseKey, correct: arabic, transcript, fallback: true, error: "analysis_failed" },
            { status: 200 },
          );
        }

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
