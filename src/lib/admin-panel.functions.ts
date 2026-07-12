import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Verify the caller is an admin. Throws otherwise. */
async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Admin: aggregate reading statistics from recitation_sessions. */
export const adminReadingStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: sessions } = await supabaseAdmin
      .from("recitation_sessions")
      .select("user_id, duration_ms, words_matched, words_missing, accuracy, created_at")
      .gte("created_at", since)
      .limit(5000);

    const rows = sessions ?? [];
    const totals = rows.reduce(
      (a, r) => {
        a.sessions += 1;
        a.seconds += Math.round((r.duration_ms ?? 0) / 1000);
        a.words += r.words_matched ?? 0;
        a.missed += r.words_missing ?? 0;
        a.accSum += r.accuracy ?? 0;
        a.accCount += r.accuracy != null ? 1 : 0;
        return a;
      },
      { sessions: 0, seconds: 0, words: 0, missed: 0, accSum: 0, accCount: 0 },
    );

    // Daily buckets (last 14 days)
    const byDay = new Map<string, { seconds: number; sessions: number; words: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      byDay.set(d, { seconds: 0, sessions: 0, words: 0 });
    }
    for (const r of rows) {
      const d = (r.created_at ?? "").slice(0, 10);
      const b = byDay.get(d);
      if (b) {
        b.seconds += Math.round((r.duration_ms ?? 0) / 1000);
        b.sessions += 1;
        b.words += r.words_matched ?? 0;
      }
    }

    // Top readers
    const byUser = new Map<string, { seconds: number; sessions: number }>();
    for (const r of rows) {
      if (!r.user_id) continue;
      const b = byUser.get(r.user_id) ?? { seconds: 0, sessions: 0 };
      b.seconds += Math.round((r.duration_ms ?? 0) / 1000);
      b.sessions += 1;
      byUser.set(r.user_id, b);
    }
    const topIds = [...byUser.entries()].sort((a, b) => b[1].seconds - a[1].seconds).slice(0, 8);
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById = new Map(users?.users.map((u) => [u.id, u.email ?? ""]) ?? []);
    const topReaders = topIds.map(([id, v]) => ({
      user_id: id,
      email: emailById.get(id) ?? "",
      seconds: v.seconds,
      sessions: v.sessions,
    }));

    return {
      totals: {
        sessions: totals.sessions,
        minutes: Math.round(totals.seconds / 60),
        words: totals.words,
        missed: totals.missed,
        avgAccuracy: totals.accCount ? Math.round(totals.accSum / totals.accCount) : 0,
      },
      daily: [...byDay.entries()].map(([date, v]) => ({ date, ...v, minutes: Math.round(v.seconds / 60) })),
      topReaders,
    };
  });

/** Admin: activity logs — merges recent domain events into a single feed. */
export const adminActivityLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(300).default(120) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [sessions, feedback, announcements, roles, users] = await Promise.all([
      supabaseAdmin
        .from("recitation_sessions")
        .select("id, user_id, created_at, accuracy, duration_ms")
        .order("created_at", { ascending: false })
        .limit(data.limit),
      supabaseAdmin
        .from("feedback")
        .select("id, user_id, category, message, created_at, resolved")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("announcements")
        .select("id, title, audience, created_at, published")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    const emailById = new Map(users.data?.users.map((u) => [u.id, u.email ?? ""]) ?? []);

    type Entry = {
      id: string;
      ts: string;
      kind: "session" | "feedback" | "announcement" | "role" | "signup";
      title: string;
      subtitle: string;
      email: string;
    };
    const entries: Entry[] = [];

    for (const s of sessions.data ?? []) {
      entries.push({
        id: `s:${s.id}`,
        ts: s.created_at ?? "",
        kind: "session",
        title: "Recitation session",
        subtitle: `${Math.round((s.duration_ms ?? 0) / 60000)}m · ${s.accuracy ?? 0}% accuracy`,
        email: emailById.get(s.user_id ?? "") ?? "—",
      });
    }
    for (const f of feedback.data ?? []) {
      entries.push({
        id: `f:${f.id}`,
        ts: f.created_at ?? "",
        kind: "feedback",
        title: `Feedback (${f.category})`,
        subtitle: (f.message ?? "").slice(0, 120),
        email: emailById.get(f.user_id ?? "") ?? "—",
      });
    }
    for (const a of announcements.data ?? []) {
      entries.push({
        id: `a:${a.id}`,
        ts: a.created_at ?? "",
        kind: "announcement",
        title: `Announcement · ${a.audience}`,
        subtitle: a.title ?? "",
        email: "system",
      });
    }
    for (const r of roles.data ?? []) {
      entries.push({
        id: `r:${r.id}`,
        ts: r.created_at ?? "",
        kind: "role",
        title: `Role granted: ${r.role}`,
        subtitle: "",
        email: emailById.get(r.user_id ?? "") ?? "—",
      });
    }
    for (const u of users.data?.users ?? []) {
      entries.push({
        id: `u:${u.id}`,
        ts: u.created_at ?? "",
        kind: "signup",
        title: "User signed up",
        subtitle: "",
        email: u.email ?? "—",
      });
    }

    entries.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return entries.slice(0, data.limit);
  });

/** Admin: database health snapshot (row counts, growth). */
export const adminDbHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tables = [
      "profiles",
      "user_roles",
      "bookmarks",
      "favorites",
      "hifz_progress",
      "recitation_sessions",
      "last_read",
      "feedback",
      "announcements",
      "certificates",
      "user_achievements",
      "achievements",
      "user_goals",
      "parent_child_links",
    ] as const;

    const results = await Promise.all(
      tables.map(async (t) => {
        const { count, error } = await supabaseAdmin
          .from(t)
          .select("*", { count: "exact", head: true });
        return { table: t, rows: count ?? 0, error: error?.message ?? null };
      }),
    );

    const dayAgo = new Date(Date.now() - 86400_000).toISOString();
    const growthTables = ["profiles", "recitation_sessions", "feedback"] as const;
    const growth = await Promise.all(
      growthTables.map(async (t) => {
        const { count } = await supabaseAdmin
          .from(t)
          .select("*", { count: "exact", head: true })
          .gte("created_at", dayAgo);
        return { table: t, last24h: count ?? 0 };
      }),
    );

    return {
      tables: results,
      growth,
      generatedAt: new Date().toISOString(),
      totalRows: results.reduce((s, r) => s + r.rows, 0),
      errors: results.filter((r) => r.error).length,
    };
  });

/** Admin: publish/unpublish an announcement. */
export const setAnnouncementPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("announcements")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
