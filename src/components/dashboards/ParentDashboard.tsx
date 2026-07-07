import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyChildren } from "@/lib/admin.functions";
import { Baby, Flame, Sparkles } from "lucide-react";

type Child = {
  id: string;
  email: string;
  surahs: number;
  avgPercent: number;
  topStreak: number;
};

export function ParentDashboard() {
  const fetchChildren = useServerFn(listMyChildren);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rows = await fetchChildren();
        setChildren(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchChildren]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-amber-400/10 to-teal-500/5 border border-amber-400/20 p-6">
        <div className="flex items-center gap-3">
          <Baby className="size-6 text-amber-300" />
          <h2 className="text-lg font-bold text-white">Parent overview</h2>
        </div>
        <p className="text-slate-300 text-sm mt-2">
          Track your children's Quran journey. Link additional children through your admin.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading children…</p>
      ) : error ? (
        <p className="text-rose-300 text-sm">{error}</p>
      ) : children.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-slate-300 text-sm">
          No children linked to your account yet. Ask your community admin to link a child by email.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <p className="text-white font-bold">{c.email}</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Metric icon={<Flame className="size-4 text-amber-400" />} label="Streak" value={`${c.topStreak}d`} />
                <Metric icon={<Sparkles className="size-4 text-amber-300" />} label="Avg" value={`${c.avgPercent}%`} />
                <Metric icon={<Baby className="size-4 text-teal-300" />} label="Surahs" value={String(c.surahs)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase tracking-wide">{icon} {label}</div>
      <p className="text-white font-bold mt-1">{value}</p>
    </div>
  );
}
