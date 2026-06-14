import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SURAHS } from "@/lib/surahs";
import { BookOpen, Bookmark, Flame, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Love Qran" }] }),
  component: Dashboard,
});

type LastRead = { surah: number; ayah: number; updated_at: string } | null;
type Bookmark = { surah: number; ayah: number; created_at: string };
type Hifz = { surah: number; percent: number; status: string; streak_days: number };

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [lastRead, setLastRead] = useState<LastRead>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [hifz, setHifz] = useState<Hifz[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    (async () => {
      setBusy(true);
      const [lr, bm, hf] = await Promise.all([
        supabase.from("last_read").select("surah,ayah,updated_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("bookmarks").select("surah,ayah,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
        supabase.from("hifz_progress").select("surah,percent,status,streak_days").eq("user_id", user.id).order("updated_at", { ascending: false }),
      ]);
      setLastRead(lr.data ?? null);
      setBookmarks(bm.data ?? []);
      setHifz((hf.data ?? []) as Hifz[]);
      setBusy(false);
    })();
  }, [user, loading, navigate]);

  const totalSurahsStarted = hifz.length;
  const surahsMastered = hifz.filter((h) => h.percent >= 100).length;
  const topStreak = hifz.reduce((m, h) => Math.max(m, h.streak_days), 0);
  const avgPercent = hifz.length ? Math.round(hifz.reduce((s, h) => s + h.percent, 0) / hifz.length) : 0;

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <p className="text-center text-slate-400 mt-20">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <SiteNav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <header>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Assalamu alaikum</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">{user.email?.split("@")[0]}</h1>
          <p className="text-slate-400 text-sm mt-1">Your personal Quran journey at a glance.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={<Flame className="size-5 text-amber-400" />} label="Top streak" value={`${topStreak} days`} />
          <Stat icon={<BookOpen className="size-5 text-emerald-400" />} label="Surahs in progress" value={String(totalSurahsStarted)} />
          <Stat icon={<Trophy className="size-5 text-amber-300" />} label="Mastered" value={String(surahsMastered)} />
          <Stat icon={<Sparkles className="size-5 text-amber-300" />} label="Avg hifz" value={`${avgPercent}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Continue reading</h2>
            {busy ? (
              <p className="text-slate-400 text-sm">Loading…</p>
            ) : lastRead ? (
              <Link
                to="/quran/$surahId"
                params={{ surahId: String(lastRead.surah) }}
                className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-4 hover:bg-emerald-500/15"
              >
                <div>
                  <p className="text-amber-300 text-xs font-bold uppercase">Last read</p>
                  <p className="text-white font-bold mt-1">
                    {SURAHS.find((s) => s.id === lastRead.surah)?.name_en ?? `Surah ${lastRead.surah}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Ayah {lastRead.ayah}</p>
                </div>
                <span className="text-amber-300 font-bold">Resume →</span>
              </Link>
            ) : (
              <Link to="/quran" className="block rounded-2xl bg-white/5 border border-white/10 p-4 text-slate-300 hover:bg-white/10">
                You haven't started reading yet. <span className="text-amber-300 font-semibold">Open Quran →</span>
              </Link>
            )}
          </section>

          <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Bookmarks</h2>
              <Bookmark className="size-4 text-amber-400" />
            </div>
            {busy ? (
              <p className="text-slate-400 text-sm">Loading…</p>
            ) : bookmarks.length === 0 ? (
              <p className="text-slate-400 text-sm">No bookmarks yet. Open any ayah and tap the bookmark icon.</p>
            ) : (
              <ul className="space-y-2">
                {bookmarks.map((b) => (
                  <li key={`${b.surah}-${b.ayah}`}>
                    <Link
                      to="/quran/$surahId"
                      params={{ surahId: String(b.surah) }}
                      className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5"
                    >
                      <span className="text-sm text-slate-200">
                        {SURAHS.find((s) => s.id === b.surah)?.name_en ?? `Surah ${b.surah}`}
                        <span className="text-slate-500"> · Ayah {b.ayah}</span>
                      </span>
                      <span className="text-amber-300 text-xs font-bold">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Hifz progress</h2>
            <Link to="/hifz" className="text-xs text-amber-300 font-bold hover:text-amber-200">Manage →</Link>
          </div>
          {busy ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : hifz.length === 0 ? (
            <p className="text-slate-400 text-sm">No hifz progress tracked yet. Go to Hifz tracker and add a surah.</p>
          ) : (
            <ul className="space-y-3">
              {hifz.slice(0, 6).map((h) => (
                <li key={h.surah}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">
                      {SURAHS.find((s) => s.id === h.surah)?.name_en ?? `Surah ${h.surah}`}
                    </span>
                    <span className="text-amber-300 font-bold">{h.percent}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${h.percent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <MobileNav />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs">{icon} {label}</div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}
