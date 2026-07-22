import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireAuthRequest } from "@/lib/require-auth-request.server";

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

export const Route = createFileRoute("/api/mistake-check-voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireAuthRequest(request);
        if (unauth) return unauth;
        const form = await request.formData();
        const audio = form.get("audio");
        const verseKey = String(form.get("verseKey") ?? "");
        if (!(audio instanceof Blob) || !/^\d+:\d+$/.test(verseKey)) {
          return new Response("bad request", { status: 400 });
        }
        if (!audio.size || audio.size > 25 * 1024 * 1024) {
          return new Response("Recording khali hai ya 25 MB se bari hai", { status: 400 });
        }
        const audioType = audio.type.split(";")[0];
        const allowedTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/aac", "audio/ogg"];
        if (audioType && !allowedTypes.includes(audioType)) {
          return new Response("Is audio format ko support nahi kiya ja raha", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // 1. Fetch the correct Arabic
        const arRes = await fetch(
          `https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${verseKey}`,
        );
        const arJ = arRes.ok ? await arRes.json() : { verses: [] };
        const arabic: string = arJ.verses?.[0]?.text_uthmani ?? "";

        // 2. Transcribe the user's recording via Lovable AI STT
        const sttForm = new FormData();
        sttForm.append("model", "openai/gpt-4o-transcribe");
        const type = audioType;
        const ext =
          type === "audio/webm" ? "webm" :
          type === "audio/mp4"  ? "mp4"  :
          type === "audio/mpeg" ? "mp3"  :
          type === "audio/wav" || type === "audio/x-wav" ? "wav" :
          type === "audio/aac" ? "aac" :
          type === "audio/ogg" ? "ogg" : "webm";
        sttForm.append("file", audio, `recording.${ext}`);
        sttForm.append("language", "ar");
        const sttRes = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: sttForm,
        });
        if (!sttRes.ok) {
          const errText = await sttRes.text().catch(() => "");
          return new Response(`Transcription failed: ${errText}`, { status: sttRes.status });
        }
        const sttJson = await sttRes.json();
        const transcript: string = sttJson.text ?? "";
        if (!transcript.trim()) {
          return new Response("Aap ki awaaz clearly detect nahi hui. Mic ke qareeb parhen aur dobara try karen.", { status: 400 });
        }

        // 3. Compare with Gemini — lenient parsing so schema mismatches don't 500.
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
              "tips = 2-3 Urdu practical tips.",
            prompt: `Ayah ${verseKey}\nCorrect Arabic: ${arabic}\nStudent said (transcribed): ${transcript}`,
          });
          output = res.output;
        } catch (err) {
          if (NoObjectGeneratedError.isInstance(err)) {
            try {
              const raw = JSON.parse(err.text ?? "{}");
              output = DiffSchema.parse({
                overall: raw.overall ?? raw.overall_verdict ?? "minor",
                score: typeof raw.score === "number" ? raw.score : 0,
                summary: String(raw.summary ?? ""),
                words: Array.isArray(raw.words) ? raw.words : Array.isArray(raw.diff) ? raw.diff : [],
                tips: Array.isArray(raw.tips) ? raw.tips : [],
              });
            } catch {
              output = null;
            }
          } else {
            throw err;
          }
        }

        if (!output) {
          return Response.json({
            verseKey,
            correct: arabic,
            transcript,
            overall: "minor",
            score: 50,
            summary: "AI analysis mukammal nahi hui — transcript neeche dekhen.",
            words: [],
            tips: [],
          });
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

