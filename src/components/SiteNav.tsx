import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProBadge } from "@/components/ProBadge";
import { useUserRoles } from "@/hooks/use-user-roles";
import { BookOpen, MessageSquare, Home, LogOut, User as UserIcon, Compass, LayoutDashboard, Search, Sparkles, Mic2, Mic, ChevronLeft, ChevronRight, Shield, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useRef, useState } from "react";

export function SiteNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <nav className="sticky top-2 md:top-4 z-50 mx-2 md:mx-8 mt-2 md:mt-4 glass-panel !rounded-2xl md:!rounded-full transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-0 md:h-14 flex flex-wrap md:flex-nowrap items-center justify-between gap-x-2 gap-y-1 md:gap-4">
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
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggle}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-foreground/70 hover:text-foreground transition-all hover:scale-105"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
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
        <ScrollableNav user={!!user} />
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const base =
    "group/nav shrink-0 snap-start whitespace-nowrap px-2.5 md:px-3 py-2 rounded-full transition-all inline-flex items-center gap-1.5 md:gap-2 uppercase tracking-widest text-[11px] font-medium";
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`${base} text-white/70 hover:text-[#C9A24C] hover:bg-white/5`}
      activeProps={{ className: `${base} text-[#C9A24C] bg-white/10 ring-1 ring-[#C9A24C]/40` }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden text-[10px]">{label}</span>
    </Link>
  );
}

function ScrollableNav({ user }: { user: boolean }) {
  const { roles } = useUserRoles();
  const isAdmin = roles.includes("admin");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    check();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    // Auto-scroll active item into view
    const active = el.querySelector<HTMLElement>("[data-status='active']")
      || el.querySelector<HTMLElement>("a[aria-current='page']");
    if (active) {
      const offset = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
    }
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const fadeMask =
    (canLeft && canRight)
      ? "[mask-image:linear-gradient(90deg,transparent_0,#000_28px,#000_calc(100%-28px),transparent_100%)]"
      : canLeft
        ? "[mask-image:linear-gradient(90deg,transparent_0,#000_28px,#000_100%)]"
        : canRight
          ? "[mask-image:linear-gradient(90deg,#000_0,#000_calc(100%-28px),transparent_100%)]"
          : "";

  return (
    <div className="relative order-3 md:order-none basis-full md:basis-auto flex-1 min-w-0 mx-0 md:mx-2 border-t border-white/10 md:border-0 pt-1 md:pt-0">
      {canLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll nav left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:grid place-items-center size-7 rounded-full bg-[#0B1730]/95 border border-white/15 text-white/80 hover:text-[#C9A24C] shadow-md"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll nav right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:grid place-items-center size-7 rounded-full bg-[#0B1730]/95 border border-white/15 text-white/80 hover:text-[#C9A24C] shadow-md"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        className={`flex w-full flex-wrap justify-center md:flex-nowrap items-center gap-1 text-sm md:overflow-x-auto scroll-smooth md:snap-x md:snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0 md:px-8 md:justify-center ${fadeMask}`}
      >
        <NavLink to="/" icon={<Home className="size-5 md:size-4" />} label="Home" />
        <NavLink to="/quran" icon={<BookOpen className="size-5 md:size-4" />} label="Quran" />
        <NavLink to="/search" icon={<Search className="size-5 md:size-4" />} label="Search" />
        <NavLink to="/chat" icon={<MessageSquare className="size-5 md:size-4" />} label="AI Mentor" />
        {user && <NavLink to="/reports" icon={<Mic className="size-5 md:size-4" />} label="Recite" />}
        <NavLink to="/learn" icon={<Sparkles className="size-5 md:size-4" />} label="Learn" />
        <NavLink to="/reciters" icon={<Mic2 className="size-5 md:size-4" />} label="Qurra" />
        <NavLink to="/tools" icon={<Compass className="size-5 md:size-4" />} label="Tools" />
        {user && <NavLink to="/dashboard" icon={<LayoutDashboard className="size-5 md:size-4" />} label="Dashboard" />}
        {user && <NavLink to="/profile" icon={<UserIcon className="size-5 md:size-4" />} label="Profile" />}
        {user && isAdmin && <NavLink to="/admin" icon={<Shield className="size-5 md:size-4" />} label="Admin" />}
      </div>
    </div>
  );
}
