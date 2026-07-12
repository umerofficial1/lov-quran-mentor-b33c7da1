import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SURAHS } from "@/lib/surahs";
import { Award, Clock, Target, Zap, TrendingUp, BookOpen, Mic2, Sparkles, Flame, Calendar, Lightbulb, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Recitation Reports — Ayatica" },
      { name: "description", content: "Your personal recitation history, accuracy trends, achievements and AI feedback." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

type SessionRow = {
  id: string;
  surah_id: number;
  start_ayah: number;
  end_ayah: number;
  words_total: number;
  words_matched: number;
  words_wrong: number;
  words_missing: number;
  accuracy: number;
  pronunciation_score: number;
  wpm: number;
  duration_ms: number;
  completed: boolean;
  ai_advice: string | null;
  created_at: string;
};

type AchievementRow = {
  id: string;
  unlocked_at: string;
  progress: number;
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
  } | null;
};

function fmtDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function surahName(id: number) {
  return SURAHS.find((s) => s.n === id)?.nameAr ?? `Surah ${id}`;
}

function ReportsPage() {
  const { user } = useAuth();

  const sessionsQ = useQuery({
    queryKey: ["recitation-sessions", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SessionRow[]> => {
      const { data, error } = await supabase
        .from("recitation_sessions")
        .select(
          "id, surah_id, start_ayah, end_ayah, words_total, words_matched, words_wrong, words_missing, accuracy, pronunciation_score, wpm, duration_ms, completed, ai_advice, created_at",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });

  const achievementsQ = useQuery({
    queryKey: ["user-achievements", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AchievementRow[]> => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("id, unlocked_at, progress, achievement:achievements(id,title,description,icon,category)")
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AchievementRow[];
    },
  });

  const goalsQ = useQuery({
    queryKey: ["user-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("daily_minutes_target, weekly_sessions_target")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? { daily_minutes_target: 10, weekly_sessions_target: 5 };
    },
  });

  const sessions = sessionsQ.data ?? [];
  const achievements = achievementsQ.data ?? [];
  const goals = goalsQ.data ?? { daily_minutes_target: 10, weekly_sessions_target: 5 };

  const totals = useMemo(() => {
    if (!sessions.length) {
      return { count: 0, wordsRead: 0, timeMs: 0, avgAccuracy: 0, avgPron: 0, best: 0 };
    }
    const wordsRead = sessions.reduce((a, s) => a + (s.words_matched || 0), 0);
    const timeMs = sessions.reduce((a, s) => a + (s.duration_ms || 0), 0);
    const avgAccuracy = sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length;
    const avgPron = sessions.reduce((a, s) => a + (s.pronunciation_score || 0), 0) / sessions.length;
    const best = Math.max(...sessions.map((s) => s.accuracy || 0));
    return { count: sessions.length, wordsRead, timeMs, avgAccuracy, avgPron, best };
  }, [sessions]);

  const progress = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = now.getDay(); // 0=Sun
    const startOfWeek = startOfToday - day * 86400000;
    let todayMs = 0;
    let weekSessions = 0;
    const dayCounts = new Set<string>();
    for (const s of sessions) {
      const t = new Date(s.created_at).getTime();
      if (t >= startOfToday) todayMs += s.duration_ms || 0;
      if (t >= startOfWeek) weekSessions += 1;
      if (t >= startOfWeek) dayCounts.add(new Date(s.created_at).toDateString());
    }
    // Streak (consecutive days back from today with >=1 session)
    const allDays = new Set(sessions.map((s) => new Date(s.created_at).toDateString()));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(startOfToday - i * 86400000).toDateString();
      if (allDays.has(d)) streak += 1;
      else if (i > 0) break;
    }
    return {
      todayMinutes: Math.round(todayMs / 60000),
      weekSessions,
      streak,
      activeDaysThisWeek: dayCounts.size,
    };
  }, [sessions]);

  const recommendations = useMemo(() => {
    const recs: { title: string; body: string; tone: "teal" | "gold" | "red" }[] = [];
    if (!sessions.length) {
      recs.push({ title: "Begin your first session", body: "Open Al-Fatiha and tap Live Recite to establish your baseline.", tone: "teal" });
      return recs;
    }
    if (totals.avgAccuracy < 60) {
      recs.push({ title: "Slow down and focus on accuracy", body: "Recite at 40–60 WPM and re-listen to each ayah before repeating.", tone: "red" });
    } else if (totals.avgAccuracy < 85) {
      recs.push({ title: "Tighten pronunciation", body: "Repeat the last surah while paying attention to makharij of ح، ع، ق، ط.", tone: "gold" });
    } else {
      recs.push({ title: "Extend your range", body: "Try a new juz — your accuracy is strong enough to progress.", tone: "teal" });
    }
    const wrongTotal = sessions.slice(0, 10).reduce((a, s) => a + (s.words_wrong || 0), 0);
    if (wrongTotal > 15) recs.push({ title: "Review common mistake words", body: "Drill the words highlighted red in your last 10 sessions before advancing.", tone: "gold" });
    if (progress.streak === 0) recs.push({ title: "Rebuild your streak", body: "Even 5 minutes today keeps consistency alive.", tone: "gold" });
    if (progress.streak >= 7) recs.push({ title: `${progress.streak}-day streak!`, body: "Consider raising your daily goal by 5 minutes.", tone: "teal" });
    return recs.slice(0, 4);
  }, [sessions, totals, progress]);


  return (
    <div className="min-h-dvh pb-32 md:pb-16">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#C9A24C] font-bold">Your Journey</p>
          <h1 className="text-3xl md:text-4xl font-display text-white mt-1">Recitation Reports</h1>
          <p className="text-sm text-white/60 mt-2 max-w-2xl">
            Track every live recitation session, watch your accuracy and pronunciation improve, and unlock
            achievements as you continue your Qur'an journey.
          </p>
        </header>

        {/* Summary tiles */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatTile icon={<Mic2 className="size-4" />} label="Sessions" value={totals.count.toString()} tone="teal" />
          <StatTile icon={<BookOpen className="size-4" />} label="Words read" value={totals.wordsRead.toLocaleString()} tone="pearl" />
          <StatTile icon={<Clock className="size-4" />} label="Time recited" value={fmtDuration(totals.timeMs)} tone="pearl" />
          <StatTile icon={<Target className="size-4" />} label="Avg accuracy" value={`${Math.round(totals.avgAccuracy)}%`} tone={totals.avgAccuracy >= 80 ? "teal" : totals.avgAccuracy >= 50 ? "gold" : "red"} />
          <StatTile icon={<Sparkles className="size-4" />} label="Avg pronunciation" value={`${Math.round(totals.avgPron)}%`} tone="gold" />
          <StatTile icon={<TrendingUp className="size-4" />} label="Best session" value={`${Math.round(totals.best)}%`} tone="teal" />
        </section>

        {/* Goals */}
        <GoalsSection
          userId={user?.id}
          daily={goals.daily_minutes_target}
          weekly={goals.weekly_sessions_target}
          todayMinutes={progress.todayMinutes}
          weekSessions={progress.weekSessions}
          streak={progress.streak}
          activeDaysThisWeek={progress.activeDaysThisWeek}
        />

        {/* Recommendations */}
        <section className="mb-10">
          <h2 className="text-lg font-display text-white flex items-center gap-2 mb-3">
            <Lightbulb className="size-5 text-[#C9A24C]" /> Learning recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((r, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 ${
                  r.tone === "teal"
                    ? "border-[#1FB6B0]/30 bg-[#1FB6B0]/[0.06]"
                    : r.tone === "red"
                      ? "border-red-400/30 bg-red-400/[0.06]"
                      : "border-[#C9A24C]/30 bg-[#C9A24C]/[0.06]"
                }`}
              >
                <p className="text-sm font-bold text-white">{r.title}</p>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>


        {/* Achievements */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display text-white flex items-center gap-2">
              <Award className="size-5 text-[#C9A24C]" /> Achievements
            </h2>
            <span className="text-xs text-white/50">{achievements.length} unlocked</span>
          </div>

          {achievementsQ.isLoading ? (
            <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ) : achievements.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-sm text-white/60">
                Complete a Live Recitation to start unlocking achievements.
              </p>
              <Link
                to="/quran"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-[#1FB6B0] text-white text-sm font-bold hover:scale-[1.02] transition"
              >
                <Mic2 className="size-4" /> Start reciting
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-[#C9A24C]/30 bg-gradient-to-br from-[#C9A24C]/[0.08] to-transparent p-4 flex items-start gap-3"
                >
                  <div className="text-2xl" aria-hidden>{row.achievement?.icon ?? "🏅"}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{row.achievement?.title ?? "Achievement"}</p>
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{row.achievement?.description}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#C9A24C]/80 mt-2">
                      Unlocked {fmtDate(row.unlocked_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Session history */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display text-white flex items-center gap-2">
              <Zap className="size-5 text-[#1FB6B0]" /> Session history
            </h2>
            <span className="text-xs text-white/50">Last {Math.min(50, sessions.length)}</span>
          </div>

          {sessionsQ.isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-white/70">No recitation sessions yet.</p>
              <p className="text-xs text-white/50 mt-1">
                Open any Surah and tap the Live Recite button to record your first session.
              </p>
              <Link
                to="/quran"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-[#1FB6B0] text-white text-sm font-bold hover:scale-[1.02] transition"
              >
                <Mic2 className="size-4" /> Go to Quran
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <SessionCard key={s.id} s={s} />
              ))}
            </div>
          )}
        </section>
      </main>

      <MobileNav />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "teal" | "gold" | "red" | "pearl";
}) {
  const toneClass =
    tone === "teal"
      ? "text-[#1FB6B0]"
      : tone === "gold"
        ? "text-[#C9A24C]"
        : tone === "red"
          ? "text-red-400"
          : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50">
        <span className={toneClass}>{icon}</span>
        {label}
      </div>
      <p className={`mt-1.5 font-bold text-lg ${toneClass}`}>{value}</p>
    </div>
  );
}

function SessionCard({ s }: { s: SessionRow }) {
  const acc = Math.round(s.accuracy || 0);
  const pron = Math.round(s.pronunciation_score || 0);
  const accTone = acc >= 80 ? "text-[#1FB6B0]" : acc >= 50 ? "text-[#C9A24C]" : "text-red-400";
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#C9A24C]/30 transition p-4 md:p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-display text-xl" dir="rtl">
              {surahName(s.surah_id)}
            </h3>
            <span className="text-xs text-white/50">
              Ayah {s.start_ayah}
              {s.end_ayah !== s.start_ayah ? `–${s.end_ayah}` : ""}
            </span>
            {s.completed && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#1FB6B0]/15 text-[#1FB6B0] border border-[#1FB6B0]/30">
                Completed
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/40 mt-1">{fmtDate(s.created_at)}</p>
        </div>
        <div className={`text-2xl font-bold ${accTone}`}>{acc}%</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-4 text-center">
        <MiniStat label="Words" value={`${s.words_matched}/${s.words_total}`} />
        <MiniStat label="Wrong" value={s.words_wrong.toString()} tone={s.words_wrong > 0 ? "red" : "pearl"} />
        <MiniStat label="Missed" value={s.words_missing.toString()} tone={s.words_missing > 0 ? "red" : "pearl"} />
        <MiniStat label="Pron." value={`${pron}%`} tone="gold" />
        <MiniStat label="Speed" value={`${Math.round(s.wpm || 0)} wpm`} />
        <MiniStat label="Time" value={fmtDuration(s.duration_ms)} />
      </div>

      {s.ai_advice && (
        <div className="mt-4 rounded-xl bg-[#0F1E3D]/60 border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#C9A24C] font-bold mb-1 flex items-center gap-1">
            <Sparkles className="size-3" /> AI Feedback
          </p>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{s.ai_advice}</p>
        </div>
      )}
    </article>
  );
}

function MiniStat({
  label,
  value,
  tone = "pearl",
}: {
  label: string;
  value: string;
  tone?: "teal" | "gold" | "red" | "pearl";
}) {
  const toneClass =
    tone === "teal"
      ? "text-[#1FB6B0]"
      : tone === "gold"
        ? "text-[#C9A24C]"
        : tone === "red"
          ? "text-red-400"
          : "text-white/90";
  return (
    <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-widest text-white/40">{label}</p>
      <p className={`text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function GoalsSection({
  userId,
  daily,
  weekly,
  todayMinutes,
  weekSessions,
  streak,
  activeDaysThisWeek,
}: {
  userId: string | undefined;
  daily: number;
  weekly: number;
  todayMinutes: number;
  weekSessions: number;
  streak: number;
  activeDaysThisWeek: number;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [dailyDraft, setDailyDraft] = useState(daily);
  const [weeklyDraft, setWeeklyDraft] = useState(weekly);

  useEffect(() => {
    setDailyDraft(daily);
    setWeeklyDraft(weekly);
  }, [daily, weekly]);

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("user_goals")
        .upsert(
          { user_id: userId, daily_minutes_target: dailyDraft, weekly_sessions_target: weeklyDraft },
          { onConflict: "user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-goals", userId] });
      setEditing(false);
    },
  });

  const dailyPct = Math.min(100, Math.round((todayMinutes / Math.max(1, daily)) * 100));
  const weeklyPct = Math.min(100, Math.round((weekSessions / Math.max(1, weekly)) * 100));

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display text-white flex items-center gap-2">
          <Target className="size-5 text-[#1FB6B0]" /> Goals
        </h2>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-xs text-[#C9A24C] hover:text-[#C9A24C]/80"
        >
          {editing ? "Cancel" : "Edit goals"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <GoalCard
          icon={<Calendar className="size-4" />}
          label="Daily practice"
          value={`${todayMinutes} / ${daily} min`}
          pct={dailyPct}
          done={dailyPct >= 100}
        />
        <GoalCard
          icon={<Mic2 className="size-4" />}
          label="Weekly sessions"
          value={`${weekSessions} / ${weekly}`}
          pct={weeklyPct}
          done={weeklyPct >= 100}
        />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50">
            <Flame className="size-4 text-[#C9A24C]" /> Streak
          </div>
          <p className="mt-1 text-2xl font-bold text-[#C9A24C]">{streak} day{streak === 1 ? "" : "s"}</p>
          <p className="text-[11px] text-white/50 mt-1">
            {activeDaysThisWeek}/7 active days this week
          </p>
        </div>
      </div>

      {editing && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div>
            <label className="text-xs text-white/70 flex justify-between">
              <span>Daily practice target</span>
              <span className="text-[#1FB6B0] font-bold">{dailyDraft} min</span>
            </label>
            <input
              type="range" min={1} max={120} step={1}
              value={dailyDraft}
              onChange={(e) => setDailyDraft(Number(e.target.value))}
              className="w-full mt-2 accent-[#1FB6B0]"
            />
          </div>
          <div>
            <label className="text-xs text-white/70 flex justify-between">
              <span>Weekly sessions target</span>
              <span className="text-[#1FB6B0] font-bold">{weeklyDraft}</span>
            </label>
            <input
              type="range" min={1} max={30} step={1}
              value={weeklyDraft}
              onChange={(e) => setWeeklyDraft(Number(e.target.value))}
              className="w-full mt-2 accent-[#1FB6B0]"
            />
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1FB6B0] text-white text-sm font-bold hover:scale-[1.02] transition disabled:opacity-50"
          >
            <Check className="size-4" /> {save.isPending ? "Saving…" : "Save goals"}
          </button>
        </div>
      )}
    </section>
  );
}

function GoalCard({
  icon, label, value, pct, done,
}: { icon: React.ReactNode; label: string; value: string; pct: number; done: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50">
        <span className={done ? "text-[#1FB6B0]" : "text-white/70"}>{icon}</span>
        {label}
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <p className={`text-lg font-bold ${done ? "text-[#1FB6B0]" : "text-white"}`}>{value}</p>
        <p className="text-xs text-white/50">{pct}%</p>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-[#1FB6B0]" : "bg-[#C9A24C]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
