import { Link } from "@tanstack/react-router";
import { Home, BookOpen, MessageSquare, Compass, Mic } from "lucide-react";

export function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0F1E3D]/95 backdrop-blur-2xl border-t border-white/10"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 text-[10px] font-bold uppercase tracking-wider">
        <Item to="/" icon={<Home className="size-5" />} label="Home" exact />
        <Item to="/quran" icon={<BookOpen className="size-5" />} label="Quran" />
        <Item to="/reports" icon={<Mic className="size-5" />} label="Recite" />
        <Item to="/chat" icon={<MessageSquare className="size-5" />} label="AI" />
        <Item to="/tools" icon={<Compass className="size-5" />} label="Tools" />
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
        className="min-h-11 flex flex-col items-center gap-1 py-2.5 text-white/60 hover:text-[#C9A24C] transition-colors"
        activeProps={{ className: "min-h-11 flex flex-col items-center gap-1 py-2.5 text-[#C9A24C]" }}
        activeOptions={{ exact: !!exact }}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}
