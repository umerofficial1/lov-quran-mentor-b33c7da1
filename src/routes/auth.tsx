import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Verse Wise Mentor" },
      { name: "description", content: "Sign in or create your Verse Wise Mentor account to save bookmarks, track hifz progress and chat with the AI mentor." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: AuthPage,
});

function isSafeRelative(p: string | undefined): p is string {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const goNext = () => {
    if (isSafeRelative(next)) {
      window.location.assign(next);
    } else {
      navigate({ to: "/" });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goNext();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const returnUrl =
    typeof window === "undefined"
      ? "/"
      : isSafeRelative(next)
        ? `${window.location.origin}${next}`
        : window.location.origin;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: returnUrl,
            data: { full_name: name },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      goNext();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: returnUrl,
    });
    if (result.error) {
      setErr(result.error instanceof Error ? result.error.message : "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    goNext();
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent mb-2">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            {mode === "signin" ? "Sign in to continue your Quran journey" : "Begin your Quran journey today"}
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full mb-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] font-semibold transition-all disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "signin" && (
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  setErr(null);
                  if (!email) return setErr("Enter your email above first.");
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) setErr(error.message);
                  else setErr("Check your inbox for a reset link.");
                }}
                className="text-xs text-white/50 hover:text-[#C9A24C] transition-colors"
              >
                Forgot password?
              </button>
            </p>
          )}

          <p className="mt-6 text-sm text-center text-white/60">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-[#C9A24C] font-semibold hover:text-[#E0BC6A]"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
