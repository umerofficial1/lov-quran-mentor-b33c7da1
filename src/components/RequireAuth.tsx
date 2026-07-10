import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, Loader2 } from "lucide-react";

/**
 * Client-side auth gate. Used only around AI features (chat) and
 * Learning tools. Shows an inline sign-in prompt when signed out.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { location } = useRouterState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-pearl/70">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (session) return <>{children}</>;

  const next = encodeURIComponent(location.href);
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0F1E3D]/70 p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-teal-500/15 flex items-center justify-center">
          <LogIn className="size-5 text-teal-300" />
        </div>
        <h2 className="text-xl font-semibold text-pearl">Sign in required</h2>
        <p className="text-sm text-pearl/70">
          Please sign in to use AI and Learning features. Your progress and bookmarks stay saved to your account.
        </p>
        <Link
          to="/auth"
          search={{ next: location.href }}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#070C1F] px-4 py-2 text-sm font-medium"
        >
          <LogIn className="size-4" /> Sign in / Create account
        </Link>
        <p className="text-xs text-pearl/40">
          <button
            className="underline hover:text-pearl/70"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = `/auth?next=${next}`;
            }}
          >
            Trouble signing in? Reset session
          </button>
        </p>
      </div>
    </div>
  );
}
