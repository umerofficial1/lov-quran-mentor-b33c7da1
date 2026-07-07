import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Feedback ----------
export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        category: z.enum(["general", "bug", "feature", "content"]).default("general"),
        message: z.string().min(3).max(2000),
        rating: z.number().int().min(1).max(5).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("feedback").insert({
      user_id: context.userId,
      category: data.category,
      message: data.message,
      rating: data.rating ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminCheck) throw new Error("Forbidden");

    const { data: rows, error } = await supabaseAdmin
      .from("feedback")
      .select("id, user_id, category, message, rating, resolved, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id).filter(Boolean))) as string[];
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById = new Map(users?.users.map((u) => [u.id, u.email ?? ""]));

    return (rows ?? []).map((r) => ({
      ...r,
      email: r.user_id ? emailById.get(r.user_id) ?? "" : "",
    }));
  });

export const resolveFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), resolved: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminCheck) throw new Error("Forbidden");
    const { error } = await supabaseAdmin
      .from("feedback")
      .update({ resolved: data.resolved })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Announcements ----------
export const listAnnouncements = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } },
    );
    const { data } = await supabase
      .from("announcements")
      .select("id, title, body, audience, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(2).max(120),
        body: z.string().min(2).max(4000),
        audience: z.enum(["all", "students", "teachers", "parents"]).default("all"),
        published: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminCheck) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("announcements").insert({
      author_id: context.userId,
      title: data.title,
      body: data.body,
      audience: data.audience,
      published: data.published,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminCheck) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin analytics ----------
export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminCheck) throw new Error("Forbidden");

    const [{ count: users }, { count: bookmarks }, { count: hifz }, { count: feedback }, { count: openFeedback }, { count: announcements }, { data: lastRead }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("bookmarks").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("hifz_progress").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("feedback").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("feedback").select("*", { count: "exact", head: true }).eq("resolved", false),
        supabaseAdmin.from("announcements").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("last_read").select("updated_at").order("updated_at", { ascending: false }).limit(50),
      ]);

    const now = Date.now();
    const activeToday = (lastRead ?? []).filter((r) => {
      const t = new Date(r.updated_at).getTime();
      return now - t < 1000 * 60 * 60 * 24;
    }).length;

    return {
      users: users ?? 0,
      bookmarks: bookmarks ?? 0,
      hifzEntries: hifz ?? 0,
      feedback: feedback ?? 0,
      openFeedback: openFeedback ?? 0,
      announcements: announcements ?? 0,
      activeToday,
    };
  });
