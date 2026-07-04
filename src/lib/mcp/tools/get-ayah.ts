import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_ayah",
  title: "Get a Quran ayah",
  description:
    "Fetch a single ayah from the Quran.com API with Arabic text and an English translation (Saheeh International).",
  inputSchema: {
    surah: z.number().int().min(1).max(114).describe("Surah number (1-114)."),
    ayah: z.number().int().min(1).describe("Ayah number within the surah."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ surah, ayah }) => {
    const key = `${surah}:${ayah}`;
    const url = `https://api.quran.com/api/v4/verses/by_key/${key}?language=en&words=false&translations=131&fields=text_uthmani`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Quran.com API error: ${res.status}` }],
        isError: true,
      };
    }
    const data = (await res.json()) as {
      verse?: { text_uthmani?: string; translations?: { text?: string }[] };
    };
    const arabic = data.verse?.text_uthmani ?? "";
    const translation = data.verse?.translations?.[0]?.text ?? "";
    return {
      content: [
        {
          type: "text",
          text: `${key}\n\nArabic: ${arabic}\n\nEnglish (Saheeh International): ${translation.replace(/<[^>]+>/g, "")}`,
        },
      ],
      structuredContent: { key, arabic, translation },
    };
  },
});
