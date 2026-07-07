import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SURAHS } from "@/lib/surahs";
import { Plus, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/hifz")({
  head: () => ({
    meta: [
      { title: "Hifz Tracker — Verse Wise Mentor" },
      { name: "description", content: "Track your Quran memorization surah by surah with streaks, mastery levels and revision reminders." },
      { property: "og:title", content: "Hifz Tracker — Verse Wise Mentor" },
      { property: "og:description", content: "Structured memorization tracking for every surah of the Quran." },
    ],
  }),
  component: HifzPage,
});

type Row = { surah: number; percent: number; status: string; streak_days: number; last_revised_at: string | null };

function HifzPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    load();
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const { data } = await supabase
      .from("hifz_progress")
      .select("surah,percent,status,streak_days,last_revised_at")
      .eq("user_id", user.id)
      .order("surah", { ascending: true });
    setRows((data ?? []) as Row[]);
    setBusy(false);
  };

  const upsert = async (surah: number, patch: Partial<Row>) => {
    if (!user) return;
    const existing = rows.find((r) => r.surah === surah);
    const next = {
      user_id: user.id,
      surah,
      percent: patch.percent ?? existing?.percent ?? 0,
      status: patch.status ?? existing?.status ?? "in_progress",
      streak_days: patch.streak_days ?? existing?.streak_days ?? 0,
      last_revised_at: new Date().toISOString(),
    };
    await supabase.from("hifz_progress").upsert(next, { onConflict: "user_id,surah" });
    await load();
  };

  const remove = async (surah: number) => {
    if (!user) return;
    await supabase.from("hifz_progress").delete().eq("user_id", user.id).eq("surah", surah);
    await load();
  };

  const tracked = new Set(rows.map((r) => r.surah));
  const filtered = SURAHS.filter((s) => !tracked.has(s.n) && (query === "" || s.nameAr.includes(query) || s.nameUr.includes(query) || String(s.n).startsWith(query)));

  if (loading || !user) {
    return <div className="min-h-screen"><SiteNav /><p className="text-center text-slate-400 mt-20">Loading…</p></div>;
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <SiteNav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Hifz Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Track memorization progress per surah. Updates save automatically.</p>
        </header>

        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Your surahs</h2>
          {busy ? <p className="text-slate-400 text-sm">Loading…</p> : rows.length === 0 ? (
            <p className="text-slate-400 text-sm">No surahs tracked yet. Add one below.</p>
          ) : (
            <ul className="space-y-4">
              {rows.map((r) => {
                const s = SURAHS.find((x) => x.n === r.surah);
                return (
                  <li key={r.surah} className="rounded-2xl bg-black/20 border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate">{r.surah}. {s?.nameAr ?? `Surah ${r.surah}`}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{r.status} • streak {r.streak_days}d</p>
                      </div>
                      <button onClick={() => remove(r.surah)} className="p-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-300" aria-label="Remove"><Trash2 className="size-4" /></button>
                    </div>
                    <input
                      type="range" min={0} max={100} value={r.percent}
                      onChange={(e) => upsert(r.surah, { percent: Number(e.target.value), status: Number(e.target.value) >= 100 ? "mastered" : "in_progress" })}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0%</span>
                      <span className="text-amber-300 font-bold">{r.percent}%</span>
                      <span>100%</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => upsert(r.surah, { streak_days: r.streak_days + 1 })} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25">+1 day streak</button>
                      <button onClick={() => upsert(r.surah, { streak_days: 0 })} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10">Reset streak</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Add a surah</h2>
          <div className="relative mb-4">
            <Search className="size-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or number…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-96 overflow-auto">
            {filtered.slice(0, 40).map((s) => (
              <button
                key={s.n}
                onClick={() => upsert(s.n, { percent: 0, status: "in_progress", streak_days: 0 })}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/30 text-sm text-slate-200 transition-colors"
              >
                <Plus className="size-3 text-amber-400 shrink-0" />
                <span className="truncate"><span className="text-slate-500">{s.n}.</span> {s.nameAr}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
