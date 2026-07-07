import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const BASE_SYSTEM = `You are "Verse Wise Mentor" — a kind, knowledgeable Islamic teacher.
- Answer Quran, Tafsir, Tajweed, Hifz, Seerah, and fiqh questions clearly and respectfully.
- Cite Surah:Ayah when quoting the Quran. Quote Arabic in proper script.
- When asked in Urdu, reply in Urdu. When asked in English, reply in English. Mix gracefully if needed.
- For controversial or fiqh-differences, present mainstream Sunni majority views and acknowledge differences briefly.
- Encourage the user warmly. Keep replies focused and well-formatted with short paragraphs.`;

const MODE_SYSTEMS: Record<string, string> = {
  ask: BASE_SYSTEM,
  learning:
    BASE_SYSTEM +
    "\n\nLEARNING MODE: Teach step-by-step like a patient teacher. Use short lessons, check understanding with a small question at the end, and suggest what to study next.",
  tafsir:
    BASE_SYSTEM +
    "\n\nTAFSIR MODE: Present classical tafsir summaries (Ibn Kathir, Maariful Quran, Tafheem, Jalalayn). Cite the source scholar for each point.",
  translation:
    BASE_SYSTEM +
    "\n\nTRANSLATION COMPARE MODE: When a verse is given, compare 2-3 major English/Urdu translations and highlight meaning nuances.",
  mistake:
    BASE_SYSTEM +
    "\n\nMISTAKE CHECKER MODE: Compare what the student recited with the correct ayah. Point out missed words and tajweed rules gently, with practice tips.",
  quiz:
    BASE_SYSTEM +
    "\n\nQUIZ MODE: Ask the student ONE multiple-choice question at a time about the given topic, wait for their answer, then explain gently before moving on.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Require authenticated caller to prevent AI credit abuse
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Server misconfigured", { status: 500 });
        }
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        if (claimsError || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json()) as {
          messages?: UIMessage[];
          mode?: string;
          context?: string;
        };
        const { messages, mode, context: ctx } = body;
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const baseSystem = MODE_SYSTEMS[mode ?? "ask"] ?? BASE_SYSTEM;
        const system = ctx
          ? `${baseSystem}\n\nCONTEXT (may be a verse or topic the user is studying):\n${ctx}`
          : baseSystem;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
