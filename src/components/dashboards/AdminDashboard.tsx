import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listUsersWithRoles,
  grantRoleByEmail,
  revokeRole,
  linkParentChild,
} from "@/lib/admin.functions";
import { Shield, UserPlus, Link2, X } from "lucide-react";

type Row = { id: string; email: string; created_at: string; roles: string[] };
type Role = "student" | "teacher" | "parent" | "admin";
const ROLES: Role[] = ["student", "teacher", "parent", "admin"];

export function AdminDashboard() {
  const listFn = useServerFn(listUsersWithRoles);
  const grantFn = useServerFn(grantRoleByEmail);
  const revokeFn = useServerFn(revokeRole);
  const linkFn = useServerFn(linkParentChild);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("teacher");
  const [parentEmail, setParentEmail] = useState("");
  const [childEmail, setChildEmail] = useState("");

  const refresh = async () => {
    try {
      setLoading(true);
      setRows(await listFn());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      await grantFn({ data: { email, role } });
      setMsg(`Granted ${role} to ${email}`);
      setEmail("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const revoke = async (user_id: string, r: Role) => {
    setMsg(null); setErr(null);
    try {
      await revokeFn({ data: { user_id, role: r } });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const link = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      await linkFn({ data: { parentEmail, childEmail } });
      setMsg(`Linked ${parentEmail} → ${childEmail}`);
      setParentEmail(""); setChildEmail("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-rose-500/10 to-amber-400/5 border border-rose-400/20 p-6">
        <div className="flex items-center gap-3">
          <Shield className="size-6 text-rose-300" />
          <h2 className="text-lg font-bold text-white">Admin console</h2>
        </div>
        <p className="text-slate-300 text-sm mt-2">Grant roles, revoke access, and link parents to children.</p>
      </div>

      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}
      {err && <p className="text-rose-300 text-sm">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={grant} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2"><UserPlus className="size-4 text-amber-300" /> Grant role</h3>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="user@email.com"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="w-full rounded-xl bg-amber-400 text-black font-bold py-2 text-sm hover:bg-amber-300">Grant</button>
        </form>

        <form onSubmit={link} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2"><Link2 className="size-4 text-teal-300" /> Link parent → child</h3>
          <input type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="Parent email"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <input type="email" required value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="Child (student) email"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <button className="w-full rounded-xl bg-teal-400 text-black font-bold py-2 text-sm hover:bg-teal-300">Link</button>
        </form>
      </div>

      <section className="rounded-3xl bg-white/5 border border-white/10 p-6">
        <h3 className="text-white font-bold mb-4">All users ({rows.length})</h3>
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Roles</th>
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
                            <button
                              type="button"
                              aria-label={`Revoke ${r} from ${u.email}`}
                              onClick={() => revoke(u.id, r as Role)}
                              className="hover:text-rose-300"
                            >
                              <X className="size-3" />
                            </button>
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
    </div>
  );
}
