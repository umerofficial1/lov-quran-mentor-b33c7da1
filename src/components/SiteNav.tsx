import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, MessageSquare, Home, LogOut, User as UserIcon, Compass, LayoutDashboard, Search } from "lucide-react";

export function SiteNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <nav className="sticky top-4 z-50 mx-4 md:mx-8 mt-4 rounded-full bg-[#0F1E3D]/70 backdrop-blur-xl border border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-5 md:px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <span className="w-8 h-8 border border-[#C9A24C]/60 rotate-45 flex items-center justify-center bg-[#0F1E3D] group-hover:border-[#C9A24C] transition-colors">
            <span className="-rotate-45 font-display font-semibold text-[#C9A24C] text-sm">V</span>
          </span>
          <span className="font-display text-lg tracking-[0.15em] uppercase text-pearl-muted group-hover:text-[#EEF2FB] transition-colors hidden sm:inline">
            Verse Wise
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-sm">
          <NavLink to="/" icon={<Home className="size-4" />} label="Home" />
          <NavLink to="/quran" icon={<BookOpen className="size-4" />} label="Quran" />
          <NavLink to="/chat" icon={<MessageSquare className="size-4" />} label="AI Mentor" />
          <NavLink to="/tools" icon={<Compass className="size-4" />} label="Tools" />
          {user && <NavLink to="/dashboard" icon={<LayoutDashboard className="size-4" />} label="Dashboard" />}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-white/50 truncate max-w-[140px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-5 py-2 rounded-full bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] text-sm font-semibold transition-all shadow-[0_0_20px_rgba(201,162,76,0.25)] inline-flex items-center gap-2"
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
      className="px-3 py-2 rounded-full text-white/70 hover:text-[#C9A24C] hover:bg-white/5 transition-all inline-flex items-center gap-2 uppercase tracking-widest text-[11px] font-medium"
      activeProps={{ className: "px-3 py-2 rounded-full text-[#C9A24C] bg-white/5 inline-flex items-center gap-2 uppercase tracking-widest text-[11px] font-medium" }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon} {label}
    </Link>
  );
}
