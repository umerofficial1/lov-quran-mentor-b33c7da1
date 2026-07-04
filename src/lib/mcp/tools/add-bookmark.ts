import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "add_bookmark",
  title: "Add a Quran bookmark",
  description: "Save an ayah bookmark for the signed-in user with an optional note.",
  inputSchema: {
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1),
    note: z.string().trim().max(500).optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ surah, ayah, note }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("bookmarks")
      .insert({ user_id: ctx.getUserId(), surah, ayah, note: note ?? null })
      .select("id, surah, ayah, note, created_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Saved bookmark ${data.surah}:${data.ayah}` }],
      structuredContent: { bookmark: data },
    };
  },
});
