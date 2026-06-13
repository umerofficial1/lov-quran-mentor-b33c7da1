import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, MessageSquare, Home, LogOut, User as UserIcon } from "lucide-react";

export function SiteNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <nav className="sticky top-4 z-50 mx-4 md:mx-8 mt-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent shrink-0"
        >
          Love Qran
        </Link>
        <div className="hidden md:flex items-center gap-1 text-sm font-medium">
          <NavLink to="/" icon={<Home className="size-4" />} label="Home" />
          <NavLink to="/quran" icon={<BookOpen className="size-4" />} label="قرآن" />
          <NavLink to="/chat" icon={<MessageSquare className="size-4" />} label="AI Teacher" />
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[140px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] border border-emerald-400/30 inline-flex items-center gap-2"
            >
              <UserIcon className="size-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-white/5 transition-all inline-flex items-center gap-2"
      activeProps={{ className: "px-3 py-2 rounded-xl text-amber-300 bg-white/10 inline-flex items-center gap-2" }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon} {label}
    </Link>
  );
}
