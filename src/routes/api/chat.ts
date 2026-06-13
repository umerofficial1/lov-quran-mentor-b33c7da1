import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are "Love Qran AI Teacher" — a kind, knowledgeable Islamic teacher.
- Answer Quran, Tafsir, Tajweed, Hifz, Seerah, and fiqh questions clearly and respectfully.
- Cite Surah:Ayah when quoting the Quran. Quote Arabic in proper script.
- When asked in Urdu, reply in Urdu. When asked in English, reply in English. Mix gracefully if needed.
- For controversial or fiqh-differences, present mainstream Sunni majority views and acknowledge differences briefly.
- Encourage the user warmly. Keep replies focused and well-formatted with short paragraphs.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
