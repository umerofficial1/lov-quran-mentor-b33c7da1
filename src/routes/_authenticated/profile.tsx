import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { SURAHS } from "@/lib/surahs";
import {
  User, Camera, Bookmark, Heart, Award, GraduationCap, Flame, Target,
  Bell, Languages, Palette, Save, Trash2, Sparkles, Clock, BookOpen, LogOut,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Verse Wise Mentor" },
      { name: "description", content: "Manage your Quran learning profile, bookmarks, favorites, achievements, certificates, goals and settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

type NotifPrefs = {
  daily_reminder: boolean;
  weekly_summary: boolean;
  achievements: boolean;
  announcements: boolean;
};

function surahName(n: number) {
  return SURAHS.find((s) => s.n === n)?.nameAr ?? `Surah ${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}
function fmtDuration(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [signedAvatar, setSignedAvatar] = useState<string | null>(null);

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, bio, avatar_url, theme, language, notification_prefs, created_at")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [draft, setDraft] = useState({
    display_name: "",
    username: "",
    bio: "",
    theme: "dark" as "dark" | "light" | "auto",
    language: "en" as "en" | "ur" | "ar",
    notification_prefs: {
      daily_reminder: true, weekly_summary: true, achievements: true, announcements: true,
    } as NotifPrefs,
  });

  useEffect(() => {
    if (!profileQ.data) return;
    setDraft({
      display_name: profileQ.data.display_name ?? "",
      username: profileQ.data.username ?? "",
      bio: profileQ.data.bio ?? "",
      theme: (profileQ.data.theme ?? "dark") as "dark" | "light" | "auto",
      language: (profileQ.data.language ?? "en") as "en" | "ur" | "ar",
      notification_prefs: (profileQ.data.notification_prefs as NotifPrefs) ?? draft.notification_prefs,
    });
  }, [profileQ.data]);

  // Signed avatar URL (private bucket)
  useEffect(() => {
    const path = profileQ.data?.avatar_url;
    if (!path) { setSignedAvatar(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
      if (!cancelled) setSignedAvatar(data?.signedUrl ?? null);
    })();
    return () => { cancelled = true; };
  }, [profileQ.data?.avatar_url]);

  const statsQ = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("recitation_sessions")
        .select("accuracy,words_matched,duration_ms,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(500);
      const sessions = data ?? [];
      const totalMs = sessions.reduce((a, s) => a + (s.duration_ms || 0), 0);
      const totalWords = sessions.reduce((a, s) => a + (s.words_matched || 0), 0);
      const avgAcc = sessions.length
        ? Math.round(sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length)
        : 0;
      const days = new Set(sessions.map((s) => new Date(s.created_at).toDateString()));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(today.getTime() - i * 86400000).toDateString();
        if (days.has(d)) streak++;
        else if (i > 0) break;
      }
      return { count: sessions.length, totalMs, totalWords, avgAcc, streak };
    },
  });

  const bookmarksQ = useQuery({
    queryKey: ["profile-bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("bookmarks")
        .select("id,surah,ayah,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  const favoritesQ = useQuery({
    queryKey: ["profile-favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites")
        .select("id,surah,ayah,note,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  const achievementsQ = useQuery({
    queryKey: ["profile-achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_achievements")
        .select("id,unlocked_at,achievement:achievements(title,description,icon)")
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false });
      return (data ?? []) as unknown as Array<{ id: string; unlocked_at: string; achievement: { title: string; description: string; icon: string } | null }>;
    },
  });

  const certificatesQ = useQuery({
    queryKey: ["profile-certs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("certificates")
        .select("id,title,description,surah_from,surah_to,issued_at,issuer")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false });
      return data ?? [];
    },
  });

  const goalsQ = useQuery({
    queryKey: ["profile-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_goals")
        .select("daily_minutes_target,weekly_sessions_target")
        .eq("user_id", user!.id).maybeSingle();
      return data ?? { daily_minutes_target: 10, weekly_sessions_target: 5 };
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["profile", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookmarks", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["profile-bookmarks", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["profile-favorites", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "user_achievements", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["profile-achievements", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "certificates", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["profile-certs", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "user_goals", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["profile-goals", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "recitation_sessions", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["profile-stats", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({
        display_name: draft.display_name || null,
        username: draft.username?.trim() || null,
        bio: draft.bio || null,
        theme: draft.theme,
        language: draft.language,
        notification_prefs: draft.notification_prefs,
      }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });

  const saveGoals = useMutation({
    mutationFn: async (g: { daily_minutes_target: number; weekly_sessions_target: number }) => {
      if (!user) return;
      const { error } = await supabase.from("user_goals").upsert(
        { user_id: user.id, ...g }, { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-goals", user?.id] }),
  });

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { alert("Please pick an image under 5MB."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (dbErr) throw dbErr;
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const stats = statsQ.data ?? { count: 0, totalMs: 0, totalWords: 0, avgAcc: 0, streak: 0 };
  const goals = goalsQ.data ?? { daily_minutes_target: 10, weekly_sessions_target: 5 };
  const initial = useMemo(
    () => (draft.display_name || user?.email || "?").trim().charAt(0).toUpperCase(),
    [draft.display_name, user?.email],
  );

  return (
    <div className="min-h-screen pb-32 md:pb-16">
      <SiteNav />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header card */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F1E3D] to-[#070C1F] p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="size-28 rounded-full bg-gradient-to-br from-[#1FB6B0] to-[#C9A24C] p-[3px]">
                <div className="size-full rounded-full bg-[#070C1F] overflow-hidden flex items-center justify-center">
                  {signedAvatar ? (
                    <img src={signedAvatar} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-4xl font-display text-white">{initial}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 size-9 rounded-full bg-[#1FB6B0] text-white flex items-center justify-center border-2 border-[#070C1F] hover:scale-105 transition disabled:opacity-50"
                aria-label="Change photo"
              >
                <Camera className="size-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
            </div>

            <div className="flex-1 min-w-0 text-center md:text-left">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#C9A24C] font-bold">Assalāmu ‘alaikum</p>
              <h1 className="text-3xl md:text-4xl font-display text-white mt-1">{draft.display_name || user?.email?.split("@")[0]}</h1>
              {draft.username && <p className="text-sm text-white/60 mt-1">@{draft.username}</p>}
              {draft.bio && <p className="text-sm text-white/70 mt-2 max-w-xl">{draft.bio}</p>}
              <p className="text-xs text-white/40 mt-3">Member since {profileQ.data?.created_at ? fmtDate(profileQ.data.created_at) : "—"}</p>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-lg font-display text-white mb-3 flex items-center gap-2">
            <Sparkles className="size-5 text-[#1FB6B0]" /> Reading statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Tile icon={<Flame className="size-4" />} label="Streak" value={`${stats.streak}d`} tone="gold" />
            <Tile icon={<BookOpen className="size-4" />} label="Sessions" value={stats.count.toString()} tone="teal" />
            <Tile icon={<Clock className="size-4" />} label="Time" value={fmtDuration(stats.totalMs)} tone="pearl" />
            <Tile icon={<Target className="size-4" />} label="Accuracy" value={`${stats.avgAcc}%`} tone={stats.avgAcc >= 80 ? "teal" : "gold"} />
            <Tile icon={<Sparkles className="size-4" />} label="Words" value={stats.totalWords.toLocaleString()} tone="pearl" />
          </div>
        </section>

        {/* Goals */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-display text-white mb-3 flex items-center gap-2">
            <Target className="size-5 text-[#1FB6B0]" /> Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RangeRow
              label="Daily practice"
              suffix="min"
              value={goals.daily_minutes_target}
              min={1} max={120}
              onCommit={(v) => saveGoals.mutate({ daily_minutes_target: v, weekly_sessions_target: goals.weekly_sessions_target })}
            />
            <RangeRow
              label="Weekly sessions"
              suffix=""
              value={goals.weekly_sessions_target}
              min={1} max={30}
              onCommit={(v) => saveGoals.mutate({ daily_minutes_target: goals.daily_minutes_target, weekly_sessions_target: v })}
            />
          </div>
        </section>

        {/* Bookmarks + Favorites */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ListCard
            icon={<Bookmark className="size-5 text-[#C9A24C]" />}
            title="Bookmarks"
            empty="No bookmarks yet."
            manageHref="/quran/bookmarks"
            items={(bookmarksQ.data ?? []).map((b) => ({
              key: b.id,
              surah: b.surah,
              ayah: b.ayah,
              date: b.created_at,
            }))}
          />
          <ListCard
            icon={<Heart className="size-5 text-rose-400" />}
            title="Favorites"
            empty="No favorites yet. Tap the heart on any surah or ayah to save it."
            items={(favoritesQ.data ?? []).map((f) => ({
              key: f.id,
              surah: f.surah,
              ayah: f.ayah ?? undefined,
              date: f.created_at,
              note: f.note ?? undefined,
              onRemove: async () => {
                await supabase.from("favorites").delete().eq("id", f.id);
                qc.invalidateQueries({ queryKey: ["profile-favorites", user?.id] });
              },
            }))}
          />
        </div>

        {/* Achievements */}
        <section>
          <h2 className="text-lg font-display text-white mb-3 flex items-center gap-2">
            <Award className="size-5 text-[#C9A24C]" /> Achievements
          </h2>
          {(achievementsQ.data ?? []).length === 0 ? (
            <p className="text-white/60 text-sm rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              Complete a Live Recite session to earn your first achievement.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(achievementsQ.data ?? []).map((a) => (
                <div key={a.id} className="rounded-2xl border border-[#C9A24C]/30 bg-gradient-to-br from-[#C9A24C]/10 to-transparent p-3 flex items-start gap-2">
                  <div className="text-2xl leading-none" aria-hidden>{a.achievement?.icon ?? "🏅"}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{a.achievement?.title ?? "Achievement"}</p>
                    <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5">{a.achievement?.description}</p>
                    <p className="text-[10px] text-[#C9A24C]/80 mt-1">{fmtDate(a.unlocked_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certificates */}
        <section>
          <h2 className="text-lg font-display text-white mb-3 flex items-center gap-2">
            <GraduationCap className="size-5 text-[#1FB6B0]" /> Certificates
          </h2>
          {(certificatesQ.data ?? []).length === 0 ? (
            <p className="text-white/60 text-sm rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              You'll receive a certificate here after completing a course or memorizing a Juz.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(certificatesQ.data ?? []).map((c) => (
                <article key={c.id} className="rounded-2xl border border-[#1FB6B0]/30 bg-gradient-to-br from-[#1FB6B0]/[0.08] to-transparent p-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="size-6 text-[#1FB6B0] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white">{c.title}</p>
                      {c.description && <p className="text-xs text-white/70 mt-1">{c.description}</p>}
                      {(c.surah_from || c.surah_to) && (
                        <p className="text-[11px] text-white/50 mt-2" dir="rtl">
                          {c.surah_from ? surahName(c.surah_from) : ""}{c.surah_to && c.surah_to !== c.surah_from ? ` – ${surahName(c.surah_to)}` : ""}
                        </p>
                      )}
                      <p className="text-[11px] text-[#C9A24C] font-bold mt-2">
                        {c.issuer} · {fmtDate(c.issued_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Settings */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
          <h2 className="text-lg font-display text-white flex items-center gap-2">
            <User className="size-5 text-[#1FB6B0]" /> Profile & settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Display name">
              <input
                value={draft.display_name}
                onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm focus:border-[#1FB6B0] outline-none"
                placeholder="Your name"
                maxLength={80}
              />
            </Field>
            <Field label="Username">
              <input
                value={draft.username}
                onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value.replace(/[^a-zA-Z0-9_.-]/g, "") }))}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm focus:border-[#1FB6B0] outline-none"
                placeholder="unique_username"
                maxLength={30}
              />
            </Field>
            <Field label="Bio" className="md:col-span-2">
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm focus:border-[#1FB6B0] outline-none min-h-[72px]"
                placeholder="A short intro (optional)"
                maxLength={280}
              />
            </Field>

            <Field label={<><Palette className="size-3.5 inline mr-1" /> Theme</>}>
              <div className="flex gap-2">
                {(["dark", "light", "auto"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDraft((d) => ({ ...d, theme: t }))}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border transition ${
                      draft.theme === t
                        ? "bg-[#1FB6B0]/15 text-[#1FB6B0] border-[#1FB6B0]/40"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={<><Languages className="size-3.5 inline mr-1" /> Language</>}>
              <div className="flex gap-2">
                {([{ v: "en", l: "English" }, { v: "ur", l: "اردو" }, { v: "ar", l: "العربية" }] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setDraft((d) => ({ ...d, language: o.v as "en" | "ur" | "ar" }))}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border transition ${
                      draft.language === o.v
                        ? "bg-[#C9A24C]/15 text-[#C9A24C] border-[#C9A24C]/40"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Notification prefs */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1.5">
              <Bell className="size-3.5" /> Notification preferences
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {([
                ["daily_reminder", "Daily practice reminder"],
                ["weekly_summary", "Weekly summary email"],
                ["achievements", "Achievements & badges"],
                ["announcements", "New features & announcements"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 cursor-pointer">
                  <span className="text-sm text-white/85">{label}</span>
                  <Toggle
                    on={draft.notification_prefs[key]}
                    onChange={(v) => setDraft((d) => ({ ...d, notification_prefs: { ...d.notification_prefs, [key]: v } }))}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => saveProfile.mutate()}
              disabled={saveProfile.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[#1FB6B0] px-5 py-2 text-sm font-bold text-white hover:scale-[1.02] transition disabled:opacity-50"
            >
              <Save className="size-4" /> {saveProfile.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}

function Tile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "teal" | "gold" | "pearl" }) {
  const c = tone === "teal" ? "text-[#1FB6B0]" : tone === "gold" ? "text-[#C9A24C]" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50`}>
        <span className={c}>{icon}</span>{label}
      </div>
      <p className={`mt-1.5 font-bold text-lg ${c}`}>{value}</p>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-widest text-white/60 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition ${on ? "bg-[#1FB6B0]" : "bg-white/15"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

function RangeRow({ label, value, min, max, suffix, onCommit }: {
  label: string; value: number; min: number; max: number; suffix: string; onCommit: (v: number) => void;
}) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-white/75">{label}</span>
        <span className="text-[#1FB6B0] font-bold">{v}{suffix ? ` ${suffix}` : ""}</span>
      </div>
      <input
        type="range" min={min} max={max} step={1} value={v}
        onChange={(e) => setV(Number(e.target.value))}
        onPointerUp={() => v !== value && onCommit(v)}
        onKeyUp={() => v !== value && onCommit(v)}
        className="w-full accent-[#1FB6B0]"
      />
    </div>
  );
}

function ListCard({
  icon, title, items, empty, manageHref,
}: {
  icon: React.ReactNode; title: string; empty: string; manageHref?: string;
  items: Array<{ key: string; surah: number; ayah?: number; date: string; note?: string; onRemove?: () => void | Promise<void> }>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold flex items-center gap-2">{icon} {title}</h3>
        {manageHref && (
          <Link to={manageHref} className="text-xs text-[#C9A24C] font-bold hover:opacity-80">Manage →</Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-white/60 text-sm">{empty}</p>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-auto pr-1">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5">
              <Link
                to="/quran/$surahId"
                params={{ surahId: String(it.surah) }}
                className="flex-1 min-w-0 flex items-center justify-between"
              >
                <span className="text-sm text-white/90 truncate">
                  <span dir="rtl">{surahName(it.surah)}</span>
                  {it.ayah != null && <span className="text-white/50"> · Ayah {it.ayah}</span>}
                  {it.note && <span className="text-white/50 ml-2 italic">— {it.note}</span>}
                </span>
                <span className="text-[10px] text-white/40 ml-3 shrink-0">{fmtDate(it.date)}</span>
              </Link>
              {it.onRemove && (
                <button
                  onClick={() => it.onRemove?.()}
                  className="p-1 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
