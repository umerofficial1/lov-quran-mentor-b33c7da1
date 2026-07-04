// Consent screen for the app's managed OAuth server (MCP clients).
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";

// Minimal typed wrapper around the beta supabase.auth.oauth namespace.
type AuthDetails = {
  client?: { name?: string; client_uri?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};
type OauthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: Error | null }>;
};
const oauth = () =>
  (supabase.auth as unknown as { oauth: OauthNs }).oauth;

function isSafeRelative(p: string) {
  return p.startsWith("/") && !p.startsWith("//");
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId =
      new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <SiteNav />
      <main className="max-w-md mx-auto px-6 py-16 text-slate-200">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8">
          <h1 className="text-2xl font-bold mb-2 text-amber-300">Authorization error</h1>
          <p className="text-slate-400 text-sm">
            {String((error as Error)?.message ?? error)}
          </p>
        </div>
      </main>
    </div>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setErr(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setErr("No redirect returned by the authorization server.");
      return;
    }
    if (isSafeRelative(target)) {
      window.location.assign(target);
    } else {
      window.location.href = target;
    }
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
            Authorize
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Connect {clientName} to Love Qran
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {clientName} will be able to use Love Qran on your behalf: search
            surahs, read ayahs, and manage your bookmarks and Hifz progress.
          </p>

          {err && (
            <p role="alert" className="text-sm text-red-400 mb-4">
              {err}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => decide(true)}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-[0_0_20px_rgba(5,150,105,0.4)] border border-emerald-400/30 disabled:opacity-50"
            >
              {busy ? "Please wait…" : "Approve"}
            </button>
            <button
              onClick={() => decide(false)}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold border border-white/10 disabled:opacity-50"
            >
              Deny
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
