import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RoleSchema = z.enum(["student", "teacher", "parent", "admin"]);

/**
 * Claim the first admin role. Only succeeds if no admin exists yet.
 * Safe bootstrap for a fresh install.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
      return { ok: false as const, reason: "admin_exists" };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * Admin-only: grant a role to a user by email.
 */
export const grantRoleByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email(), role: RoleSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify caller is admin
    const { data: adminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminCheck) throw new Error("Forbidden");

    // Find target user by email via Admin API
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);
    const target = list.users.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );
    if (!target) throw new Error("User not found");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: target.id, role: data.role });
    if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
    return { ok: true, user_id: target.id };
  });

/**
 * Admin-only: revoke a role from a user.
 */
export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), role: RoleSchema }).parse(d),
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
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Admin-only: list all users with their roles.
 */
export const listUsersWithRoles = createServerFn({ method: "GET" })
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

    const { data: users, error: uErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (uErr) throw new Error(uErr.message);
    const { data: rolesRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of rolesRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    return users.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      roles: rolesByUser.get(u.id) ?? [],
    }));
  });

/**
 * Parent: list their linked children with basic hifz progress.
 */
export const listMyChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: links, error } = await supabaseAdmin
      .from("parent_child_links")
      .select("child_id")
      .eq("parent_id", context.userId);
    if (error) throw new Error(error.message);
    const childIds = (links ?? []).map((l) => l.child_id);
    if (childIds.length === 0) return [];

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const { data: hifz } = await supabaseAdmin
      .from("hifz_progress")
      .select("user_id, surah, percent, status, streak_days")
      .in("user_id", childIds);

    return childIds.map((cid) => {
      const u = users?.users.find((x) => x.id === cid);
      const rows = (hifz ?? []).filter((h) => h.user_id === cid);
      const avg = rows.length
        ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length)
        : 0;
      return {
        id: cid,
        email: u?.email ?? "",
        surahs: rows.length,
        avgPercent: avg,
        topStreak: rows.reduce((m, r) => Math.max(m, r.streak_days), 0),
      };
    });
  });

/**
 * Admin: link a parent to a child by their emails.
 */
export const linkParentChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ parentEmail: z.string().email(), childEmail: z.string().email() })
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

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const parent = list?.users.find(
      (u) => u.email?.toLowerCase() === data.parentEmail.toLowerCase(),
    );
    const child = list?.users.find(
      (u) => u.email?.toLowerCase() === data.childEmail.toLowerCase(),
    );
    if (!parent) throw new Error("Parent not found");
    if (!child) throw new Error("Child not found");

    const { error } = await supabaseAdmin
      .from("parent_child_links")
      .insert({ parent_id: parent.id, child_id: child.id });
    if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });
