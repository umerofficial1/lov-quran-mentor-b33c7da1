import { Link } from "@tanstack/react-router";
import { Home, BookOpen, MessageSquare, Compass, LayoutDashboard } from "lucide-react";

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-emerald-950/90 backdrop-blur-2xl border-t border-white/10">
      <ul className="grid grid-cols-5 text-[10px] font-bold uppercase tracking-wider">
        <Item to="/" icon={<Home className="size-5" />} label="Home" exact />
        <Item to="/quran" icon={<BookOpen className="size-5" />} label="Quran" />
        <Item to="/chat" icon={<MessageSquare className="size-5" />} label="AI" />
        <Item to="/tools" icon={<Compass className="size-5" />} label="Tools" />
        <Item to="/dashboard" icon={<LayoutDashboard className="size-5" />} label="Me" />
      </ul>
    </nav>
  );
}

function Item({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex flex-col items-center gap-1 py-2.5 text-slate-400 hover:text-amber-300"
        activeProps={{ className: "flex flex-col items-center gap-1 py-2.5 text-amber-300" }}
        activeOptions={{ exact: !!exact }}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}
