import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import { useUserRoles, type AppRole } from "@/hooks/use-user-roles";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { ParentDashboard } from "@/components/dashboards/ParentDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { RoleSettings } from "@/components/RoleSettings";
import { ProBadge } from "@/components/ProBadge";
import { GraduationCap, User, Baby, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard — Verse Wise Mentor" },
      { name: "description", content: "Continue reading, track hifz, teach classes, and follow your family's Quran journey." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const ROLE_META: Record<AppRole, { label: string; icon: React.ReactNode }> = {
  student: { label: "Student", icon: <User className="size-4" /> },
  teacher: { label: "Teacher", icon: <GraduationCap className="size-4" /> },
  parent: { label: "Parent", icon: <Baby className="size-4" /> },
  admin: { label: "Admin", icon: <Shield className="size-4" /> },
};

function DashboardPage() {
  const { user } = useAuth();
  const { roles, loading } = useUserRoles();
  const claim = useServerFn(claimFirstAdmin);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [active, setActive] = useState<AppRole | null>(null);

  const activeRole: AppRole = active ?? (roles[0] ?? "student");

  const handleClaim = async () => {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const r = await claim();
      setClaimMsg(r.ok ? "You are now the admin. Reload to see the admin console." : "An admin already exists.");
    } catch (e) {
      setClaimMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setClaiming(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <SiteNav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <header>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Assalamu alaikum</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{user.email?.split("@")[0]}</h1>
            <ProBadge />
          </div>
          <p className="text-slate-400 text-sm mt-1">Your personal Quran journey at a glance.</p>
        </header>

        <RoleSettings />

        {loading ? (
          <p className="text-slate-400 text-sm">Loading roles…</p>
        ) : (
          <>
            {roles.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActive(r)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border transition ${
                      activeRole === r
                        ? "bg-amber-400 text-black border-amber-300"
                        : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {ROLE_META[r].icon} {ROLE_META[r].label}
                  </button>
                ))}
              </div>
            )}

            {activeRole === "student" && <StudentDashboard user={user} />}
            {activeRole === "teacher" && <TeacherDashboard />}
            {activeRole === "parent" && <ParentDashboard />}
            {activeRole === "admin" && <AdminDashboard />}

            {!roles.includes("admin") && (
              <div className="rounded-2xl bg-white/5 border border-dashed border-white/10 p-4 text-xs text-slate-400">
                No admin exists yet?{" "}
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="text-amber-300 font-bold hover:text-amber-200 disabled:opacity-50"
                >
                  {claiming ? "Claiming…" : "Claim first-admin role"}
                </button>
                {claimMsg && <span className="ml-2 text-slate-300">{claimMsg}</span>}
              </div>
            )}
          </>
        )}
      </main>
      <MobileNav />
    </div>
  );
}
