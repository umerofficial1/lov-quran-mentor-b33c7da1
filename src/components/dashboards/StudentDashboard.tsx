import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SURAHS } from "@/lib/surahs";
import {
  BookOpen, Bookmark, Flame, Sparkles, Trophy, Clock, Target, Calendar,
  CalendarDays, CalendarRange, Award, Mic2, TrendingUp, FileText,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

type Session = {
  id: string;
  surah_id: number;
  start_ayah: number;
  end_ayah: number;
  accuracy: number;
  words_matched: number;
  words_total: number;
  duration_ms: number;
  wpm: number;
  created_at: string;
};

type Achievement = {
  id: string;
  unlocked_at: string;
  achievement: { id: string; title: string; description: string; icon: string; category: string } | null;
};

const WORDS_PER_PAGE = 300; // Mushaf average

function startOfDay(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
function fmtDuration(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function StudentDashboard({ user }: { user: User }) {
  const qc = useQueryClient();

  const sessionsQ = useQuery({
    queryKey: ["dash-sessions", user.id],
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await supabase
        .from("recitation_sessions")
        .select("id,surah_id,start_ayah,end_ayah,accuracy,words_matched,words_total,duration_ms,wpm,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });

  const hifzQ = useQuery({
    queryKey: ["dash-hifz", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("hifz_progress")
        .select("surah,percent,status,streak_days,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const lastReadQ = useQuery({
    queryKey: ["dash-lastread", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("last_read")
        .select("surah,ayah,updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const bookmarksQ = useQuery({
    queryKey: ["dash-bookmarks", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("surah,ayah,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const achievementsQ = useQuery({
    queryKey: ["dash-achievements", user.id],
    queryFn: async (): Promise<Achievement[]> => {
      const { data } = await supabase
        .from("user_achievements")
        .select("id, unlocked_at, achievement:achievements(id,title,description,icon,category)")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false })
        .limit(12);
      return (data ?? []) as unknown as Achievement[];
    },
  });

  const goalsQ = useQuery({
    queryKey: ["dash-goals", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_goals")
        .select("daily_minutes_target,weekly_sessions_target")
        .eq("user_id", user.id)
        .maybeSingle();
      return data ?? { daily_minutes_target: 10, weekly_sessions_target: 5 };
    },
  });

  // Realtime auto-refresh on new sessions / achievements / bookmarks / last_read
  useEffect(() => {
    const ch = supabase
      .channel(`dash-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "recitation_sessions", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["dash-sessions", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_achievements", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["dash-achievements", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "last_read", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["dash-lastread", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bookmarks", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["dash-bookmarks", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hifz_progress", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["dash-hifz", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_goals", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["dash-goals", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user.id, qc]);

  const sessions = sessionsQ.data ?? [];
  const hifz = hifzQ.data ?? [];
  const lastRead = lastReadQ.data;
  const bookmarks = bookmarksQ.data ?? [];
  const achievements = achievementsQ.data ?? [];
  const goals = goalsQ.data ?? { daily_minutes_target: 10, weekly_sessions_target: 5 };

  const stats = useMemo(() => {
    const now = Date.now();
    const today = startOfDay();
    const weekStart = today - new Date().getDay() * 86400000;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    let dailyMs = 0, weeklyMs = 0, monthlyMs = 0, totalMs = 0, totalWords = 0;
    let weekSessions = 0;
    const allDays = new Set<string>();
    for (const s of sessions) {
      const t = new Date(s.created_at).getTime();
      totalMs += s.duration_ms || 0;
      totalWords += s.words_matched || 0;
      if (t >= today) dailyMs += s.duration_ms || 0;
      if (t >= weekStart) { weeklyMs += s.duration_ms || 0; weekSessions += 1; }
      if (t >= monthStart) monthlyMs += s.duration_ms || 0;
      allDays.add(new Date(t).toDateString());
    }
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today - i * 86400000).toDateString();
      if (allDays.has(d)) streak += 1;
      else if (i > 0) break;
    }
    const avgAccuracy = sessions.length
      ? Math.round(sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length)
      : 0;
    return {
      dailyMs, weeklyMs, monthlyMs, totalMs, totalWords,
      weekSessions, streak, avgAccuracy,
      pagesRead: Math.floor(totalWords / WORDS_PER_PAGE),
      now,
    };
  }, [sessions]);

  const surahsMastered = hifz.filter((h) => h.percent >= 100).length;
  const surahsInProgress = hifz.filter((h) => h.percent > 0 && h.percent < 100).length;

  // Accuracy chart — group by day, last 14 days
  const chartData = useMemo(() => {
    const days: { date: string; label: string; accuracy: number | null }[] = [];
    const map = new Map<string, { sum: number; n: number }>();
    for (const s of sessions) {
      const key = new Date(s.created_at).toDateString();
      const cur = map.get(key) ?? { sum: 0, n: 0 };
      cur.sum += s.accuracy || 0;
      cur.n += 1;
      map.set(key, cur);
    }
    for (let i = 13; i >= 0; i--) {
      const d = new Date(startOfDay() - i * 86400000);
      const key = d.toDateString();
      const m = map.get(key);
      days.push({
        date: key,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        accuracy: m ? Math.round(m.sum / m.n) : null,
      });
    }
    return days;
  }, [sessions]);

  const recentReads = useMemo(() => {
    const seen = new Set<number>();
    const out: Session[] = [];
    for (const s of sessions) {
      if (seen.has(s.surah_id)) continue;
      seen.add(s.surah_id);
      out.push(s);
      if (out.length >= 6) break;
    }
    return out;
  }, [sessions]);

  const dailyPct = Math.min(100, Math.round((stats.dailyMs / 60000 / Math.max(1, goals.daily_minutes_target)) * 100));
  const weeklyPct = Math.min(100, Math.round((stats.weekSessions / Math.max(1, goals.weekly_sessions_target)) * 100));

  return (
    <div className="space-y-6">
      {/* Reading period tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Tile icon={<Calendar className="size-4" />} label="Daily" value={fmtDuration(stats.dailyMs)} tone="teal" />
        <Tile icon={<CalendarDays className="size-4" />} label="Weekly" value={fmtDuration(stats.weeklyMs)} tone="teal" />
        <Tile icon={<CalendarRange className="size-4" />} label="Monthly" value={fmtDuration(stats.monthlyMs)} tone="pearl" />
        <Tile icon={<Flame className="size-4" />} label="Streak" value={`${stats.streak}d`} tone="gold" />
        <Tile icon={<Clock className="size-4" />} label="Total time" value={fmtDuration(stats.totalMs)} tone="pearl" />
        <Tile icon={<Target className="size-4" />} label="Avg accuracy" value={`${stats.avgAccuracy}%`} tone={stats.avgAccuracy >= 80 ? "teal" : "gold"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile icon={<Trophy className="size-4" />} label="Completed surahs" value={String(surahsMastered)} tone="teal" />
        <Tile icon={<BookOpen className="size-4" />} label="In progress" value={String(surahsInProgress)} tone="pearl" />
        <Tile icon={<FileText className="size-4" />} label="Pages recited" value={stats.pagesRead.toLocaleString()} tone="gold" />
        <Tile icon={<Sparkles className="size-4" />} label="Words read" value={stats.totalWords.toLocaleString()} tone="pearl" />
      </div>

      {/* Accuracy chart + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-[#2FD4A7]" /> Accuracy — last 14 days
            </h2>
            <Link to="/reports" className="text-xs text-[#E0B15A] font-bold hover:opacity-80">Reports →</Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0B2420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                  formatter={(v) => (v == null ? "—" : `${v}%`)}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#2FD4A7" strokeWidth={2.5} dot={{ r: 3, fill: "#2FD4A7" }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Target className="size-4 text-[#2FD4A7]" /> Goals
            </h2>
            <Link to="/reports" className="text-xs text-[#E0B15A] font-bold hover:opacity-80">Edit →</Link>
          </div>
          <GoalRow
            label="Daily practice"
            value={`${Math.round(stats.dailyMs / 60000)} / ${goals.daily_minutes_target} min`}
            pct={dailyPct}
          />
          <GoalRow
            label="Weekly sessions"
            value={`${stats.weekSessions} / ${goals.weekly_sessions_target}`}
            pct={weeklyPct}
          />
          <GoalRow
            label="Current streak"
            value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`}
            pct={Math.min(100, stats.streak * 10)}
            tone="gold"
          />
        </section>
      </div>

      {/* Continue reading + Recently read */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <BookOpen className="size-4 text-[#2FD4A7]" /> Continue reading
          </h2>
          {lastRead ? (
            <Link
              to="/quran/$surahId"
              params={{ surahId: String(lastRead.surah) }}
              className="flex items-center justify-between rounded-2xl bg-[#2FD4A7]/10 border border-[#2FD4A7]/30 p-4 hover:bg-[#2FD4A7]/15 transition"
            >
              <div>
                <p className="text-[#E0B15A] text-[10px] font-bold uppercase tracking-widest">Last read</p>
                <p className="text-white font-bold mt-1 text-lg" dir="rtl">
                  {SURAHS.find((s) => s.n === lastRead.surah)?.nameAr ?? `Surah ${lastRead.surah}`}
                </p>
                <p className="text-xs text-white/60 mt-1">Ayah {lastRead.ayah}</p>
              </div>
              <span className="text-[#2FD4A7] font-bold">Resume →</span>
            </Link>
          ) : (
            <Link to="/quran" className="block rounded-2xl bg-white/5 border border-white/10 p-4 text-white/70 hover:bg-white/10 transition">
              You haven't started reading yet. <span className="text-[#E0B15A] font-semibold">Open Qur'an →</span>
            </Link>
          )}
        </section>

        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Mic2 className="size-4 text-[#2FD4A7]" /> Recently recited
          </h2>
          {recentReads.length === 0 ? (
            <p className="text-white/60 text-sm">No sessions yet — start a Live Recite from any surah.</p>
          ) : (
            <ul className="space-y-2">
              {recentReads.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/quran/$surahId"
                    params={{ surahId: String(s.surah_id) }}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5 transition"
                  >
                    <span className="text-sm text-white/90">
                      <span dir="rtl">{SURAHS.find((x) => x.n === s.surah_id)?.nameAr ?? `Surah ${s.surah_id}`}</span>
                      <span className="text-white/50"> · Ayah {s.start_ayah}{s.end_ayah !== s.start_ayah ? `–${s.end_ayah}` : ""}</span>
                    </span>
                    <span className={`text-xs font-bold ${s.accuracy >= 80 ? "text-[#2FD4A7]" : s.accuracy >= 50 ? "text-[#E0B15A]" : "text-red-400"}`}>
                      {Math.round(s.accuracy)}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Achievements & Badges */}
      <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Award className="size-4 text-[#E0B15A]" /> Achievements & badges
          </h2>
          <span className="text-xs text-white/50">{achievements.length} unlocked</span>
        </div>
        {achievements.length === 0 ? (
          <p className="text-white/60 text-sm">Complete a Live Recite to earn your first badge.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements.map((a) => (
              <div key={a.id} className="rounded-2xl border border-[#E0B15A]/30 bg-gradient-to-br from-[#E0B15A]/10 to-transparent p-3 flex items-start gap-2">
                <div className="text-2xl leading-none" aria-hidden>{a.achievement?.icon ?? "🏅"}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{a.achievement?.title ?? "Achievement"}</p>
                  <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5">{a.achievement?.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bookmarks + Hifz recap (preserved) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Bookmark className="size-4 text-[#E0B15A]" /> Bookmarks
            </h2>
            <Link to="/quran/bookmarks" className="text-xs text-[#E0B15A] font-bold hover:opacity-80">All →</Link>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-white/60 text-sm">No bookmarks yet.</p>
          ) : (
            <ul className="space-y-2">
              {bookmarks.map((b) => (
                <li key={`${b.surah}-${b.ayah}`}>
                  <Link
                    to="/quran/$surahId"
                    params={{ surahId: String(b.surah) }}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5"
                  >
                    <span className="text-sm text-white/90">
                      <span dir="rtl">{SURAHS.find((s) => s.n === b.surah)?.nameAr ?? `Surah ${b.surah}`}</span>
                      <span className="text-white/50"> · Ayah {b.ayah}</span>
                    </span>
                    <span className="text-[#E0B15A] text-xs font-bold">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Hifz progress</h2>
            <Link to="/hifz" className="text-xs text-[#E0B15A] font-bold hover:opacity-80">Manage →</Link>
          </div>
          {hifz.length === 0 ? (
            <p className="text-white/60 text-sm">No hifz progress tracked yet.</p>
          ) : (
            <ul className="space-y-3">
              {hifz.slice(0, 5).map((h) => (
                <li key={h.surah}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/85 font-semibold" dir="rtl">
                      {SURAHS.find((s) => s.n === h.surah)?.nameAr ?? `Surah ${h.surah}`}
                    </span>
                    <span className="text-[#E0B15A] font-bold">{h.percent}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2FD4A7] to-[#E0B15A]" style={{ width: `${h.percent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Tile({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone: "teal" | "gold" | "pearl" }) {
  const c = tone === "teal" ? "text-[#2FD4A7]" : tone === "gold" ? "text-[#E0B15A]" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50">
        <span className={c}>{icon}</span>
        {label}
      </div>
      <p className={`mt-1.5 font-bold text-lg ${c}`}>{value}</p>
    </div>
  );
}

function GoalRow({ label, value, pct, tone = "teal" }: { label: string; value: string; pct: number; tone?: "teal" | "gold" }) {
  const bar = tone === "teal" ? "bg-[#2FD4A7]" : "bg-[#E0B15A]";
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/75">{label}</span>
        <span className="text-white font-semibold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
