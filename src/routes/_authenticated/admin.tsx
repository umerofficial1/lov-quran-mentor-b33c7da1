import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import { useUserRoles } from "@/hooks/use-user-roles";
import { supabase } from "@/integrations/supabase/client";
import {
  listUsersWithRoles,
  grantRoleByEmail,
  revokeRole,
  linkParentChild,
} from "@/lib/admin.functions";
import {
  adminAnalytics,
  listFeedback,
  resolveFeedback,
  createAnnouncement,
  deleteAnnouncement,
} from "@/lib/community.functions";
import {
  adminReadingStats,
  adminActivityLogs,
  adminDbHealth,
  setAnnouncementPublished,
} from "@/lib/admin-panel.functions";
import {
  Shield, LayoutDashboard, Users, BookOpen, FileText, Megaphone,
  MessageSquareText, BarChart3, Activity, Database, Lock, RefreshCw,
  CheckCircle2, XCircle, Trash2, UserPlus, Link2, Eye, EyeOff, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Verse Wise Mentor" },
      { name: "description", content: "Secure administration console: users, content, analytics, logs, and database health." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPanel,
});

type Section =
  | "dashboard" | "users" | "reading" | "content" | "announcements"
  | "feedback" | "reports" | "analytics" | "logs" | "health";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",     label: "Dashboard",         icon: <LayoutDashboard className="size-4" /> },
  { id: "users",         label: "Users",             icon: <Users className="size-4" /> },
  { id: "reading",       label: "Reading Stats",     icon: <BookOpen className="size-4" /> },
  { id: "content",       label: "Content",           icon: <FileText className="size-4" /> },
  { id: "announcements", label: "Announcements",     icon: <Megaphone className="size-4" /> },
  { id: "feedback",      label: "Feedback",          icon: <MessageSquareText className="size-4" /> },
  { id: "reports",       label: "Reports",           icon: <FileText className="size-4" /> },
  { id: "analytics",     label: "Analytics",         icon: <BarChart3 className="size-4" /> },
  { id: "logs",          label: "Activity Logs",     icon: <Activity className="size-4" /> },
  { id: "health",        label: "Database Health",   icon: <Database className="size-4" /> },
];

function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [section, setSection] = useState<Section>("dashboard");

  const loading = authLoading || rolesLoading;
  const isAdmin = roles.includes("admin");

  return (
    <div className="min-h-dvh pb-28 md:pb-12">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <header className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/15 border border-rose-400/30">
            <Shield className="size-5 text-rose-300" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-rose-300 font-semibold">Restricted</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <span className="ml-auto text-xs text-slate-400 hidden sm:inline">
            {user?.email}
          </span>
        </header>

        {loading ? (
          <p className="text-slate-400 text-sm">Verifying access…</p>
        ) : !user ? (
          <Forbidden reason="You must be signed in." />
        ) : !isAdmin ? (
          <Forbidden reason="This area is restricted to admins." />
        ) : (
          <div className="grid md:grid-cols-[220px_1fr] gap-6">
            <nav className="md:sticky md:top-24 h-max rounded-2xl bg-[#0B2420]/60 border border-white/10 p-2 overflow-x-auto">
              <ul className="flex md:flex-col gap-1 min-w-max md:min-w-0">
                {NAV.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => setSection(n.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2 transition ${
                        section === n.id
                          ? "bg-[#E0B15A]/15 text-[#E9F5F0] border border-[#E0B15A]/30"
                          : "text-slate-300 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {n.icon} {n.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <section>
              {section === "dashboard" && <DashboardTab />}
              {section === "users" && <UsersTab />}
              {section === "reading" && <ReadingTab />}
              {section === "content" && <ContentTab />}
              {section === "announcements" && <AnnouncementsTab />}
              {section === "feedback" && <FeedbackTab />}
              {section === "reports" && <ReportsTab />}
              {section === "analytics" && <AnalyticsTab />}
              {section === "logs" && <LogsTab />}
              {section === "health" && <HealthTab />}
            </section>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

// ---------- shared UI ----------

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-[#0B2420]/60 border border-white/10 p-5 ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </Card>
  );
}

function Forbidden({ reason }: { reason: string }) {
  return (
    <div className="rounded-2xl bg-rose-500/10 border border-rose-400/30 p-6 flex items-start gap-3">
      <Lock className="size-5 text-rose-300 mt-0.5" />
      <div>
        <h2 className="text-white font-bold">Access denied</h2>
        <p className="text-slate-300 text-sm mt-1">{reason}</p>
        <Link to="/dashboard" className="inline-block mt-3 text-sm text-amber-300 hover:text-amber-200">
          ← Back to your dashboard
        </Link>
      </div>
    </div>
  );
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fn()
      .then((d) => { if (!cancelled) { setData(d); setErr(null); } })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  return { data, err, loading, refresh: () => setTick((n) => n + 1) };
}

// ---------- Dashboard ----------

function DashboardTab() {
  const analyticsFn = useServerFn(adminAnalytics);
  const readingFn = useServerFn(adminReadingStats);
  const { data: a, refresh: r1 } = useAsync(() => analyticsFn());
  const { data: r, refresh: r2 } = useAsync(() => readingFn());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Overview</h2>
        <button
          onClick={() => { r1(); r2(); }}
          className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
        >
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={a?.users ?? "—"} />
        <Stat label="Active today" value={a?.activeToday ?? "—"} />
        <Stat label="Bookmarks" value={a?.bookmarks ?? "—"} />
        <Stat label="Hifz entries" value={a?.hifzEntries ?? "—"} />
        <Stat label="Sessions (30d)" value={r?.totals.sessions ?? "—"} />
        <Stat label="Minutes (30d)" value={r?.totals.minutes ?? "—"} />
        <Stat label="Avg accuracy" value={r ? `${r.totals.avgAccuracy}%` : "—"} />
        <Stat label="Open feedback" value={a?.openFeedback ?? "—"} hint="Unresolved" />
      </div>
      <Card>
        <p className="text-sm text-slate-300 mb-3 font-semibold">Reading activity (last 14 days)</p>
        <MiniBarChart data={r?.daily.map((d) => ({ label: d.date.slice(5), value: d.minutes })) ?? []} />
      </Card>
    </div>
  );
}

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-gradient-to-t from-[#E0B15A] to-[#F4E4A6] min-h-[2px]"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${d.value}m`}
          />
          <span className="text-[9px] text-slate-400">{d.label}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-xs text-slate-500">No data yet.</p>}
    </div>
  );
}

// ---------- Users ----------

type UserRow = { id: string; email: string; created_at: string; roles: string[] };
const ROLES = ["student", "teacher", "parent", "admin"] as const;

function UsersTab() {
  const listFn = useServerFn(listUsersWithRoles);
  const grantFn = useServerFn(grantRoleByEmail);
  const revokeFn = useServerFn(revokeRole);
  const linkFn = useServerFn(linkParentChild);
  const { data, err, loading, refresh } = useAsync(() => listFn());
  const rows = (data as UserRow[] | null) ?? [];

  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("teacher");
  const [parentEmail, setParentEmail] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wrap = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null); setError(null);
    try { await fn(); setMsg(ok); refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const filtered = rows.filter((r) => r.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-semibold text-white mb-3 inline-flex items-center gap-2">
            <UserPlus className="size-4" /> Grant role by email
          </p>
          <div className="flex flex-wrap gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white" />
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              onClick={() => wrap(() => grantFn({ data: { email, role } }), "Role granted")}
              className="px-4 py-2 rounded-lg bg-[#E0B15A] text-[#04100D] text-sm font-bold hover:bg-[#B38F40]"
            >Grant</button>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-white mb-3 inline-flex items-center gap-2">
            <Link2 className="size-4" /> Link parent → child
          </p>
          <div className="flex flex-wrap gap-2">
            <input value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@example.com"
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white" />
            <input value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="child@example.com"
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white" />
            <button
              onClick={() => wrap(() => linkFn({ data: { parentEmail, childEmail } }), "Link created")}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-bold hover:bg-white/20"
            >Link</button>
          </div>
        </Card>
      </div>

      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}
      {error && <p className="text-rose-300 text-sm">{error}</p>}

      <Card>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white">All users ({rows.length})</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email…"
            className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white" />
        </div>
        {loading ? <p className="text-slate-400 text-sm">Loading…</p> : err ? <p className="text-rose-300 text-sm">{err}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 text-xs uppercase tracking-wider">
                <tr><th className="py-2">Email</th><th>Roles</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="py-2 text-white">{u.email}</td>
                    <td className="text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs">
                            {r}
                            <button
                              onClick={() => wrap(() => revokeFn({ data: { user_id: u.id, role: r as (typeof ROLES)[number] } }), "Role revoked")}
                              className="text-rose-300 hover:text-rose-200"
                              aria-label={`Revoke ${r}`}
                            ><XCircle className="size-3" /></button>
                          </span>
                        ))}
                        {u.roles.length === 0 && <span className="text-xs text-slate-500">none</span>}
                      </div>
                    </td>
                    <td className="text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500 text-xs">No users match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- Reading Stats ----------

function ReadingTab() {
  const fn = useServerFn(adminReadingStats);
  const { data, loading, err, refresh } = useAsync(() => fn());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Reading statistics (30 days)</h2>
        <button onClick={refresh} className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1">
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>
      {loading ? <p className="text-slate-400 text-sm">Loading…</p> : err ? <p className="text-rose-300 text-sm">{err}</p> : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Sessions" value={data.totals.sessions} />
            <Stat label="Minutes" value={data.totals.minutes} />
            <Stat label="Words matched" value={data.totals.words.toLocaleString()} />
            <Stat label="Avg accuracy" value={`${data.totals.avgAccuracy}%`} />
          </div>
          <Card>
            <p className="text-sm text-slate-300 mb-3 font-semibold">Daily minutes</p>
            <MiniBarChart data={data.daily.map((d) => ({ label: d.date.slice(5), value: d.minutes }))} />
          </Card>
          <Card>
            <p className="text-sm text-slate-300 mb-3 font-semibold">Top readers</p>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 text-xs uppercase tracking-wider">
                <tr><th className="py-2">User</th><th>Sessions</th><th>Minutes</th></tr>
              </thead>
              <tbody>
                {data.topReaders.map((t) => (
                  <tr key={t.user_id} className="border-t border-white/5">
                    <td className="py-2 text-white">{t.email || t.user_id}</td>
                    <td className="text-slate-300">{t.sessions}</td>
                    <td className="text-slate-300">{Math.round(t.seconds / 60)}</td>
                  </tr>
                ))}
                {data.topReaders.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-500 text-xs">No sessions yet.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}
    </div>
  );
}

// ---------- Content management ----------

function ContentTab() {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Content management</h2>
      <Card>
        <p className="text-sm text-slate-300">
          Content is grouped by feature. Manage published messages in{" "}
          <button className="underline text-amber-300">Announcements</button>{" "}
          and view Quran routing at{" "}
          <Link to="/quran" className="underline text-amber-300">/quran</Link>.
        </p>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Announcements</p>
          <p className="text-white text-sm mt-2">Publish and retract site-wide messages targeted by role.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Achievements</p>
          <p className="text-white text-sm mt-2">Managed via the <code className="text-amber-300">achievements</code> table.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Certificates</p>
          <p className="text-white text-sm mt-2">Teachers issue certificates; admins can audit via database.</p>
        </Card>
      </div>
    </div>
  );
}

// ---------- Announcements ----------

type Announcement = { id: string; title: string; body: string; audience: string; created_at: string; published: boolean };

function AnnouncementsTab() {
  const createFn = useServerFn(createAnnouncement);
  const delFn = useServerFn(deleteAnnouncement);
  const pubFn = useServerFn(setAnnouncementPublished);
  const [rows, setRows] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "students" | "teachers" | "parents">("all");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("announcements")
      .select("id, title, body, audience, created_at, published")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Announcement[]);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setMsg(null); setError(null);
    try {
      await createFn({ data: { title, body, audience, published: true } });
      setTitle(""); setBody(""); setMsg("Published");
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Announcements</h2>
      <Card>
        <div className="grid gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={3}
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white" />
          <div className="flex gap-2">
            <select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white">
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
              <option value="parents">Parents</option>
            </select>
            <button onClick={submit} className="px-4 py-2 rounded-lg bg-[#E0B15A] text-[#04100D] text-sm font-bold hover:bg-[#B38F40]">
              Publish
            </button>
          </div>
          {msg && <p className="text-emerald-300 text-xs">{msg}</p>}
          {error && <p className="text-rose-300 text-xs">{error}</p>}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-white mb-3">Existing ({rows.length})</p>
        <ul className="divide-y divide-white/5">
          {rows.map((a) => (
            <li key={a.id} className="py-3 flex items-start gap-3">
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{a.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {a.audience} · {new Date(a.created_at).toLocaleString()} · {a.published ? "published" : "draft"}
                </p>
                <p className="text-slate-300 text-sm mt-1">{a.body}</p>
              </div>
              <button
                onClick={async () => { await pubFn({ data: { id: a.id, published: !a.published } }); load(); }}
                className="text-slate-300 hover:text-white p-2"
                aria-label={a.published ? "Unpublish" : "Publish"}
              >
                {a.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                onClick={async () => { await delFn({ data: { id: a.id } }); load(); }}
                className="text-rose-300 hover:text-rose-200 p-2"
                aria-label="Delete"
              ><Trash2 className="size-4" /></button>
            </li>
          ))}
          {rows.length === 0 && <li className="py-4 text-slate-500 text-xs text-center">No announcements yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

// ---------- Feedback ----------

type FB = { id: string; user_id: string | null; email: string; category: string; message: string; rating: number | null; resolved: boolean; created_at: string };

function FeedbackTab() {
  const fbFn = useServerFn(listFeedback);
  const resolveFn = useServerFn(resolveFeedback);
  const { data, loading, err, refresh } = useAsync(() => fbFn());
  const rows = (data as FB[] | null) ?? [];
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");

  const shown = rows.filter((r) =>
    filter === "all" ? true : filter === "open" ? !r.resolved : r.resolved,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-white">Feedback</h2>
        <div className="flex gap-1">
          {(["open", "resolved", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs border ${filter === f ? "bg-[#E0B15A] text-[#04100D] border-[#E0B15A]" : "bg-white/5 text-slate-300 border-white/10"}`}>
              {f}
            </button>
          ))}
          <button onClick={refresh} className="ml-2 text-xs text-slate-300 hover:text-white inline-flex items-center gap-1">
            <RefreshCw className="size-3" />
          </button>
        </div>
      </div>
      <Card>
        {loading ? <p className="text-slate-400 text-sm">Loading…</p> : err ? <p className="text-rose-300 text-sm">{err}</p> : (
          <ul className="divide-y divide-white/5">
            {shown.map((f) => (
              <li key={f.id} className="py-3 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-white text-sm">
                    <span className="font-semibold">{f.email || "anonymous"}</span>
                    <span className="text-slate-400"> · {f.category}</span>
                    {f.rating != null && <span className="text-amber-300"> · {"★".repeat(f.rating)}</span>}
                  </p>
                  <p className="text-slate-300 text-sm mt-1">{f.message}</p>
                  <p className="text-slate-500 text-xs mt-1">{new Date(f.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={async () => { await resolveFn({ data: { id: f.id, resolved: !f.resolved } }); refresh(); }}
                  className={`text-xs px-3 py-1 rounded-full border ${f.resolved ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30" : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"}`}
                >
                  <CheckCircle2 className="size-3 inline mr-1" />
                  {f.resolved ? "Resolved" : "Mark resolved"}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="py-4 text-slate-500 text-xs text-center">Nothing here.</li>}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------- Reports ----------

function ReportsTab() {
  const readingFn = useServerFn(adminReadingStats);
  const analyticsFn = useServerFn(adminAnalytics);
  const { data: r } = useAsync(() => readingFn());
  const { data: a } = useAsync(() => analyticsFn());

  const download = () => {
    const rows = [
      ["metric", "value"],
      ["users", a?.users ?? 0],
      ["active_today", a?.activeToday ?? 0],
      ["bookmarks", a?.bookmarks ?? 0],
      ["hifz_entries", a?.hifzEntries ?? 0],
      ["open_feedback", a?.openFeedback ?? 0],
      ["sessions_30d", r?.totals.sessions ?? 0],
      ["minutes_30d", r?.totals.minutes ?? 0],
      ["avg_accuracy_30d", r?.totals.avgAccuracy ?? 0],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement("a");
    a2.href = url; a2.download = `admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a2.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Reports</h2>
      <Card>
        <p className="text-sm text-slate-300">Export a snapshot of key platform metrics as CSV.</p>
        <button onClick={download} className="mt-3 px-4 py-2 rounded-lg bg-[#E0B15A] text-[#04100D] text-sm font-bold hover:bg-[#B38F40]">
          Download CSV
        </button>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={a?.users ?? "—"} />
        <Stat label="Sessions (30d)" value={r?.totals.sessions ?? "—"} />
        <Stat label="Minutes (30d)" value={r?.totals.minutes ?? "—"} />
        <Stat label="Avg accuracy" value={r ? `${r.totals.avgAccuracy}%` : "—"} />
      </div>
    </div>
  );
}

// ---------- Analytics ----------

function AnalyticsTab() {
  const fn = useServerFn(adminAnalytics);
  const readingFn = useServerFn(adminReadingStats);
  const { data: a } = useAsync(() => fn());
  const { data: r } = useAsync(() => readingFn());

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={a?.users ?? "—"} />
        <Stat label="Active today" value={a?.activeToday ?? "—"} />
        <Stat label="Announcements" value={a?.announcements ?? "—"} />
        <Stat label="Feedback total" value={a?.feedback ?? "—"} />
      </div>
      <Card>
        <p className="text-sm text-slate-300 mb-3 font-semibold">Sessions per day</p>
        <MiniBarChart data={r?.daily.map((d) => ({ label: d.date.slice(5), value: d.sessions })) ?? []} />
      </Card>
      <Card>
        <p className="text-sm text-slate-300 mb-3 font-semibold">Words matched per day</p>
        <MiniBarChart data={r?.daily.map((d) => ({ label: d.date.slice(5), value: d.words })) ?? []} />
      </Card>
    </div>
  );
}

// ---------- Logs ----------

const KIND_STYLE: Record<string, string> = {
  session: "bg-teal-500/10 text-teal-200 border-teal-400/30",
  feedback: "bg-amber-500/10 text-amber-200 border-amber-400/30",
  announcement: "bg-sky-500/10 text-sky-200 border-sky-400/30",
  role: "bg-rose-500/10 text-rose-200 border-rose-400/30",
  signup: "bg-emerald-500/10 text-emerald-200 border-emerald-400/30",
};

function LogsTab() {
  const fn = useServerFn(adminActivityLogs);
  const { data, loading, err, refresh } = useAsync(() => fn({ data: { limit: 200 } }));
  const rows = (data as Awaited<ReturnType<typeof fn>> | null) ?? [];
  const [kind, setKind] = useState<string>("all");

  const shown = useMemo(() => kind === "all" ? rows : rows.filter((r) => r.kind === kind), [rows, kind]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-white">Activity logs</h2>
        <div className="flex gap-1 flex-wrap">
          {["all", "session", "feedback", "announcement", "role", "signup"].map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className={`px-3 py-1 rounded-full text-xs border ${kind === k ? "bg-[#E0B15A] text-[#04100D] border-[#E0B15A]" : "bg-white/5 text-slate-300 border-white/10"}`}>
              {k}
            </button>
          ))}
          <button onClick={refresh} className="ml-2 text-xs text-slate-300 hover:text-white inline-flex items-center gap-1">
            <RefreshCw className="size-3" />
          </button>
        </div>
      </div>
      <Card>
        {loading ? <p className="text-slate-400 text-sm">Loading…</p> : err ? <p className="text-rose-300 text-sm">{err}</p> : (
          <ul className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {shown.map((e) => (
              <li key={e.id} className="py-2.5 flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${KIND_STYLE[e.kind] ?? ""}`}>
                  {e.kind}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{e.title}</p>
                  <p className="text-xs text-slate-400 truncate">{e.email} · {e.subtitle}</p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(e.ts).toLocaleString()}</span>
              </li>
            ))}
            {shown.length === 0 && <li className="py-4 text-slate-500 text-xs text-center">No entries.</li>}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------- DB Health ----------

function HealthTab() {
  const fn = useServerFn(adminDbHealth);
  const { data, loading, err, refresh } = useAsync(() => fn());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Database health</h2>
        <button onClick={refresh} className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1">
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>
      {loading ? <p className="text-slate-400 text-sm">Loading…</p> : err ? <p className="text-rose-300 text-sm">{err}</p> : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Tables" value={data.tables.length} />
            <Stat label="Total rows" value={data.totalRows.toLocaleString()} />
            <Stat label="Errors" value={data.errors} hint={data.errors ? "Investigate below" : "All healthy"} />
            <Stat label="Snapshot" value={new Date(data.generatedAt).toLocaleTimeString()} />
          </div>
          <Card>
            <p className="text-sm font-semibold text-white mb-3">Growth (last 24h)</p>
            <div className="grid grid-cols-3 gap-3">
              {data.growth.map((g) => (
                <div key={g.table} className="rounded-xl bg-black/20 border border-white/5 p-3">
                  <p className="text-xs text-slate-400">{g.table}</p>
                  <p className="text-xl font-bold text-white">+{g.last24h}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-white mb-3">Table sizes</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400 text-xs uppercase tracking-wider">
                  <tr><th className="py-2">Table</th><th>Rows</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.tables.map((t) => (
                    <tr key={t.table} className="border-t border-white/5">
                      <td className="py-2 text-white">{t.table}</td>
                      <td className="text-slate-300">{t.rows.toLocaleString()}</td>
                      <td>
                        {t.error ? (
                          <span className="inline-flex items-center gap-1 text-rose-300 text-xs">
                            <AlertTriangle className="size-3" /> {t.error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-300 text-xs">
                            <CheckCircle2 className="size-3" /> healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
