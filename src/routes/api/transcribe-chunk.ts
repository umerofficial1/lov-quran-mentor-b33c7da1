import { createFileRoute } from "@tanstack/react-router";

// Streaming-style chunk transcription for the live recitation coach.
// Client posts short self-contained audio segments (one per MediaRecorder
// session, NOT timeslice fragments), we forward to Lovable AI STT and
// return the recognized text so the UI can grow the transcript incrementally.
export const Route = createFileRoute("/api/transcribe-chunk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const audio = form.get("audio");
        const quranContext = String(form.get("quranContext") ?? "").trim().slice(0, 4000);
        if (!(audio instanceof Blob)) {
          return new Response("bad request", { status: 400 });
        }
        if (audio.size < 1024) {
          // Too tiny to be meaningful — return empty text instead of erroring
          // so the client loop keeps going.
          return Response.json({ text: "" });
        }
        if (audio.size > 24 * 1024 * 1024) {
          return new Response("chunk too large", { status: 413 });
        }

        const type = audio.type.split(";")[0];
        const allowed = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/x-wav", "audio/mpeg"];
        if (type && !allowed.includes(type)) {
          return new Response("unsupported audio type", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ext =
          type === "audio/mp4" ? "mp4" :
          type === "audio/ogg" ? "ogg" :
          type === "audio/wav" || type === "audio/x-wav" ? "wav" :
          type === "audio/mpeg" ? "mp3" :
          "webm";

        const fd = new FormData();
        fd.append("model", "openai/gpt-4o-transcribe");
        fd.append("file", audio, `chunk.${ext}`);
        fd.append("language", "ar");
        if (quranContext) {
          fd.append(
            "prompt",
            `تلاوة من القرآن الكريم. اكتب الكلمات العربية المنطوقة فقط كما في هذا السياق القرآني، ولا تضف علامات ترقيم عند الصمت: ${quranContext}`,
          );
        }

        const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "direct-audio",
          },
          body: fd,
        });

        if (!r.ok) {
          const detail = await r.text().catch(() => "");
          return Response.json(
            { error: detail || "Transcription is temporarily unavailable" },
            { status: r.status },
          );
        }
        const j = await r.json();
        return Response.json({ text: String(j.text ?? "") });
      },
    },
  },
});
