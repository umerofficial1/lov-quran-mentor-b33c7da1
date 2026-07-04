import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SURAHS } from "@/lib/surahs";

export default defineTool({
  name: "search_surahs",
  title: "Search Quran surahs",
  description:
    "Search the 114 surahs of the Quran by number or by name (Arabic, Urdu, or transliteration substring).",
  inputSchema: {
    query: z
      .string()
      .trim()
      .optional()
      .describe("Substring or surah number to filter by. Omit to return all 114."),
    limit: z.number().int().min(1).max(114).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }) => {
    const q = (query ?? "").toLowerCase().trim();
    const filtered = q
      ? SURAHS.filter(
          (s) =>
            String(s.n) === q ||
            s.nameAr.includes(q) ||
            s.nameUr.includes(q),
        )
      : SURAHS;
    const rows = filtered.slice(0, limit ?? 20);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { surahs: rows, total: filtered.length },
    };
  },
});
