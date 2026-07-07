import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProBadge } from "@/components/ProBadge";
import { BookOpen, MessageSquare, Home, LogOut, User as UserIcon, Compass, LayoutDashboard, Search, Sparkles, Mic2 } from "lucide-react";

export function SiteNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <nav className="sticky top-4 z-50 mx-4 md:mx-8 mt-4 rounded-full bg-[#0F1E3D]/70 backdrop-blur-xl border border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-5 md:px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0 group" aria-label="Ayatica — Read, Reflect, Live">
          <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0B1730] border border-[#D4AF37]/40 shadow-[0_0_16px_rgba(212,175,55,0.15)] transition-all duration-300 group-hover:shadow-[0_0_28px_rgba(212,175,55,0.45)] group-hover:scale-[1.05] group-hover:border-[#D4AF37]/70">
            <svg viewBox="0 0 40 40" className="w-6 h-6" aria-hidden="true">
              <defs>
                <linearGradient id="ayatica-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F4E4A6" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
              <g transform="translate(31 9)" fill="url(#ayatica-gold)">
                <path d="M0 -3.2 L0.9 -0.9 L3.2 0 L0.9 0.9 L0 3.2 L-0.9 0.9 L-3.2 0 L-0.9 -0.9 Z" />
                <path d="M0 -3.2 L0.9 -0.9 L3.2 0 L0.9 0.9 L0 3.2 L-0.9 0.9 L-3.2 0 L-0.9 -0.9 Z" transform="rotate(22.5)" opacity="0.65" />
              </g>
              <path
                d="M28 20a10 10 0 1 1-10-10 8 8 0 0 0 10 10z"
                fill="url(#ayatica-gold)"
                stroke="#0F6D4F"
                strokeWidth="0.6"
              />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="flex items-center gap-2">
              <span
                className="font-display font-semibold text-base md:text-lg tracking-[0.22em] uppercase bg-clip-text text-transparent transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_8px_rgba(212,175,55,0.45))]"
                style={{ backgroundImage: "linear-gradient(135deg, #F4E4A6 0%, #D4AF37 55%, #0F6D4F 140%)" }}
              >
                Ayatica
              </span>
              {user && <ProBadge />}
            </span>
            <span className="hidden sm:inline mt-1.5 text-[9px] tracking-[0.32em] uppercase text-[#0F6D4F] font-medium">
              Read · Reflect · Live
            </span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-sm">
          <NavLink to="/" icon={<Home className="size-4" />} label="Home" />
          <NavLink to="/quran" icon={<BookOpen className="size-4" />} label="Quran" />
          <NavLink to="/search" icon={<Search className="size-4" />} label="Search" />
          <NavLink to="/chat" icon={<MessageSquare className="size-4" />} label="AI Mentor" />
          <NavLink to="/learn" icon={<Sparkles className="size-4" />} label="Learn" />
          <NavLink to="/reciters" icon={<Mic2 className="size-4" />} label="Qurra" />
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
