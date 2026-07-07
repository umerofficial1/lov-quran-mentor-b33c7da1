import { useEffect } from "react";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Lock } from "lucide-react";

/**
 * Client-only auth gate. Wrap any page whose contents must be signed-in.
 * Home (/) and /auth stay public.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = location.pathname + (location.searchStr ?? "");
      navigate({ to: "/auth", search: { next } as never, replace: true });
    }
  }, [loading, user, location.pathname, location.searchStr, navigate]);

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center px-4">
        <div className="flex items-center gap-3 text-white/70 text-sm">
          <span className="size-2 rounded-full bg-[#C9A24C] animate-pulse" />
          Loading your session…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh grid place-items-center px-4 py-16 text-center">
        <div className="max-w-md animate-fade-in">
          <div className="mx-auto mb-6 size-16 rounded-full bg-[#0F1E3D] border border-[#C9A24C]/40 grid place-items-center">
            <Lock className="size-6 text-[#C9A24C]" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-white">Sign in required</h1>
          <p className="mt-2 text-sm text-white/60">
            This part of Ayatica is available to signed-in learners. It takes a moment.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#C9A24C] px-5 text-sm font-semibold text-[#070C1F] shadow-[0_0_20px_rgba(201,162,76,0.25)] hover:scale-[1.02] transition-transform"
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
