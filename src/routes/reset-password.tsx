import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Verse Wise Mentor" },
      { name: "description", content: "Choose a new password for your Verse Wise Mentor account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash on redirect.
    // The client library exchanges it and fires PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    setOk(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 1500);
  };

  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <h1 className="font-display text-3xl text-[#E9F5F0] mb-2">Set a new password</h1>
          <p className="text-white/60 text-sm mb-8">
            Choose a strong password of at least 8 characters.
          </p>

          {!ready && (
            <p className="text-white/60 text-sm">
              Waiting for the recovery link to be verified…
              <br />
              If this doesn't finish, request a new reset from the{" "}
              <Link to="/auth" className="text-[#E0B15A] underline">
                sign-in page
              </Link>
              .
            </p>
          )}

          {ready && !ok && (
            <form onSubmit={submit} className="space-y-4">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E0B15A]/50"
              />
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E0B15A]/50"
              />
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#E0B15A] hover:bg-[#B38F40] text-[#04100D] font-semibold transition-all disabled:opacity-50"
              >
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          )}

          {ok && (
            <p className="text-emerald-300 text-sm">
              Password updated. Redirecting to your dashboard…
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
