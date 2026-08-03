import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles, type AppRole } from "@/hooks/use-user-roles";
import { GraduationCap, User, Baby, Check, Loader2 } from "lucide-react";

const SWITCHABLE: { role: AppRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { role: "student", label: "Student", icon: <User className="size-4" />, desc: "Read, memorise, take quizzes and follow the curriculum." },
  { role: "teacher", label: "Teacher", icon: <GraduationCap className="size-4" />, desc: "Create classes, assign work, review recitations." },
  { role: "parent", label: "Parent", icon: <Baby className="size-4" />, desc: "Follow your children's progress and hifz milestones." },
];

export function RoleSettings() {
  const { roles, loading, user } = useUserRoles();
  const [busy, setBusy] = useState<AppRole | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // force refetch via key bump

  if (!user) return null;

  const has = (r: AppRole) => roles.includes(r);

  const toggle = async (r: AppRole) => {
    if (busy) return;
    setBusy(r);
    setErr(null);
    try {
      if (has(r)) {
        // Prevent removing the last remaining non-admin role
        const nonAdmin = roles.filter((x) => x !== "admin");
        if (nonAdmin.length <= 1 && nonAdmin[0] === r) {
          setErr("Keep at least one role active.");
          return;
        }
        const { error } = await supabase.from("user_roles").delete().eq("user_id", user.id).eq("role", r);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: r });
        if (error) throw error;
      }
      // Small trick: reload so useUserRoles refetches cleanly
      setTick((t) => t + 1);
      window.setTimeout(() => window.location.reload(), 300);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      key={tick}
      className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Your roles</h2>
          <p className="text-xs text-slate-400 mt-1">
            Turn on any combination — you can access every dashboard you enable.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-3">
          {SWITCHABLE.map((s) => {
            const on = has(s.role);
            const isBusy = busy === s.role;
            return (
              <li key={s.role}>
                <button
                  onClick={() => toggle(s.role)}
                  disabled={isBusy}
                  className={`w-full text-left rounded-2xl border p-4 transition-all min-h-[6.5rem] ${
                    on
                      ? "border-[#E0B15A]/60 bg-[#E0B15A]/10 shadow-[0_0_20px_rgba(224,177,90,0.15)]"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  } disabled:opacity-60`}
                  aria-pressed={on}
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 text-sm font-semibold ${on ? "text-[#F4E4A6]" : "text-white/85"}`}>
                      {s.icon} {s.label}
                    </span>
                    {isBusy ? (
                      <Loader2 className="size-4 text-white/60 animate-spin" />
                    ) : on ? (
                      <Check className="size-4 text-[#E0B15A]" />
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-white/40">Off</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/55 leading-relaxed">{s.desc}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
    </section>
  );
}
