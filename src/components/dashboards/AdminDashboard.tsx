import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listUsersWithRoles, grantRoleByEmail, revokeRole, linkParentChild,
} from "@/lib/admin.functions";
import {
  adminAnalytics, listFeedback, resolveFeedback,
  createAnnouncement, deleteAnnouncement,
} from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, UserPlus, Link2, X, Users, BookOpen, Sparkles, MessageSquareText,
  Megaphone, CheckCircle2, Trash2, RefreshCw,
} from "lucide-react";

type Row = { id: string; email: string; created_at: string; roles: string[] };
type Role = "student" | "teacher" | "parent" | "admin";
const ROLES: Role[] = ["student", "teacher", "parent", "admin"];

type Analytics = {
  users: number; bookmarks: number; hifzEntries: number;
  feedback: number; openFeedback: number; announcements: number; activeToday: number;
};

type FeedbackRow = {
  id: string; user_id: string | null; email: string; category: string;
  message: string; rating: number | null; resolved: boolean; created_at: string;
};

type Announcement = {
  id: string; title: string; body: string; audience: string; created_at: string; published: boolean;
};

export function AdminDashboard() {
  const listFn = useServerFn(listUsersWithRoles);
  const grantFn = useServerFn(grantRoleByEmail);
  const revokeFn = useServerFn(revokeRole);
  const linkFn = useServerFn(linkParentChild);
  const analyticsFn = useServerFn(adminAnalytics);
  const feedbackFn = useServerFn(listFeedback);
  const resolveFn = useServerFn(resolveFeedback);
  const createAnnFn = useServerFn(createAnnouncement);
  const deleteAnnFn = useServerFn(deleteAnnouncement);

  const [rows, setRows] = useState<Row[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("teacher");
  const [parentEmail, setParentEmail] = useState("");
  const [childEmail, setChildEmail] = useState("");

  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState<"all" | "students" | "teachers" | "parents">("all");

  const refresh = async () => {
    try {
      setLoading(true);
      const [users, a, f] = await Promise.all([listFn(), analyticsFn(), feedbackFn()]);
      setRows(users); setAnalytics(a); setFeedback(f);
      const { data } = await supabase
        .from("announcements")
        .select("id, title, body, audience, created_at, published")
        .order("created_at", { ascending: false });
      setAnnouncements((data ?? []) as Announcement[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const wrap = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null); setErr(null);
    try { await fn(); setMsg(ok); await refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-rose-500/10 to-amber-400/5 border border-rose-400/20 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="size-6 text-rose-300" />
          <h2 className="text-lg font-bold text-white">Admin console</h2>
        </div>
        <button onClick={refresh} className="text-xs inline-flex items-center gap-1 text-slate-300 hover:text-white">
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>

      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}
      {err && <p className="text-rose-300 text-sm">{err}</p>}

      {/* Analytics */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<Users className="size-4 text-amber-300" />} label="Users" v={analytics?.users} />
          <Stat icon={<Sparkles className="size-4 text-teal-300" />} label="Active today" v={analytics?.activeToday} />
          <Stat icon={<BookOpen className="size-4 text-emerald-300" />} label="Bookmarks" v={analytics?.bookmarks} />
          <Stat icon={<BookOpen className="size-4 text-emerald-300" />} label="Hifz entries" v={analytics?.hifzEntries} />
          <Stat icon={<MessageSquareText className="size-4 text-rose-300" />} label="Feedback total" v={analytics?.feedback} />
          <Stat icon={<MessageSquareText className="size-4 text-rose-300" />} label="Open feedback" v={analytics?.openFeedback} />
          <Stat icon={<Megaphone className="size-4 text-amber-300" />} label="Announcements" v={analytics?.announcements} />
        </div>
      </section>

      {/* Roles + parent link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={(e) => { e.preventDefault(); wrap(() => grantFn({ data: { email, role } }), `Granted ${role} to ${email}`); setEmail(""); }} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2"><UserPlus className="size-4 text-amber-300" /> Grant role</h3>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" className={inputCls} />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="w-full rounded-xl bg-amber-400 text-black font-bold py-2 text-sm hover:bg-amber-300">Grant</button>
        </form>

        <form onSubmit={(e) => { e.preventDefault(); wrap(() => linkFn({ data: { parentEmail, childEmail } }), `Linked ${parentEmail} → ${childEmail}`); setParentEmail(""); setChildEmail(""); }} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2"><Link2 className="size-4 text-teal-300" /> Link parent → child</h3>
          <input type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="Parent email" className={inputCls} />
          <input type="email" required value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="Child (student) email" className={inputCls} />
          <button className="w-full rounded-xl bg-teal-400 text-black font-bold py-2 text-sm hover:bg-teal-300">Link</button>
        </form>
      </div>

      {/* Users table */}
      <section className="rounded-3xl bg-white/5 border border-white/10 p-6">
        <h3 className="text-white font-bold mb-4">All users ({rows.length})</h3>
        {loading ? <p className="text-slate-400 text-sm">Loading…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase">
                  <th className="pb-2">Email</th><th className="pb-2">Roles</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="py-2 text-slate-200">{u.email}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && <span className="text-slate-500 text-xs">—</span>}
                        {u.roles.map((r) => (
                          <span key={r} className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white text-xs px-2 py-0.5">
                            {r}
                            <button type="button" aria-label={`Revoke ${r} from ${u.email}`}
                              onClick={() => wrap(() => revokeFn({ data: { user_id: u.id, role: r as Role } }), "Revoked")}
                              className="hover:text-rose-300"><X className="size-3" /></button>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Announcements */}
      <section className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2"><Megaphone className="size-4 text-amber-300" /> Announcements</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          wrap(() => createAnnFn({ data: { title: annTitle, body: annBody, audience: annAudience, published: true } }), "Announcement published");
          setAnnTitle(""); setAnnBody("");
        }} className="grid gap-2">
          <input required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" className={inputCls} />
          <textarea required value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={3} placeholder="Body (supports simple markdown)" className={inputCls} />
          <div className="flex gap-2">
            <select value={annAudience} onChange={(e) => setAnnAudience(e.target.value as typeof annAudience)} className={inputCls}>
              {(["all","students","teachers","parents"] as const).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button className="rounded-xl bg-amber-400 text-black font-bold px-4 text-sm hover:bg-amber-300">Publish</button>
          </div>
        </form>
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl bg-black/20 border border-white/10 p-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-bold text-sm">{a.title} <span className="text-[10px] text-slate-500 uppercase ml-2">{a.audience}</span></p>
                <p className="text-slate-300 text-xs mt-1 whitespace-pre-wrap">{a.body}</p>
              </div>
              <button onClick={() => wrap(() => deleteAnnFn({ data: { id: a.id } }), "Deleted")} className="text-slate-400 hover:text-rose-300"><Trash2 className="size-4" /></button>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-slate-500 text-xs">No announcements yet.</p>}
        </div>
      </section>

      {/* Feedback */}
      <section className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-3">
        <h3 className="text-white font-bold flex items-center gap-2"><MessageSquareText className="size-4 text-rose-300" /> User feedback ({feedback.length})</h3>
        <div className="space-y-2">
          {feedback.map((f) => (
            <div key={f.id} className={`rounded-xl border p-3 ${f.resolved ? "bg-emerald-500/5 border-emerald-400/20" : "bg-black/20 border-white/10"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">{f.category} · {f.email || "anonymous"}</p>
                  <p className="text-slate-200 text-sm mt-1 break-words">{f.message}</p>
                  {f.rating && <p className="text-xs text-slate-400 mt-1">Rating: {"★".repeat(f.rating)}</p>}
                </div>
                <button
                  onClick={() => wrap(() => resolveFn({ data: { id: f.id, resolved: !f.resolved } }), f.resolved ? "Reopened" : "Resolved")}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${f.resolved ? "bg-white/10 text-slate-300" : "bg-emerald-400 text-black hover:bg-emerald-300"}`}
                >
                  <CheckCircle2 className="size-3" /> {f.resolved ? "Reopen" : "Resolve"}
                </button>
              </div>
            </div>
          ))}
          {feedback.length === 0 && <p className="text-slate-500 text-xs">No feedback yet.</p>}
        </div>
      </section>
    </div>
  );
}

const inputCls = "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500";

function Stat({ icon, label, v }: { icon: React.ReactNode; label: string; v: number | undefined }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">{icon}{label}</div>
      <p className="mt-1 text-2xl font-bold text-white">{v ?? "—"}</p>
    </div>
  );
}
