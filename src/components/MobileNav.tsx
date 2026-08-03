import { Link } from "@tanstack/react-router";
import { Home, BookOpen, MessageSquare, Compass, Mic } from "lucide-react";

export function MobileNav() {
  return null;
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
        className="min-h-11 flex flex-col items-center gap-1 py-2.5 text-white/60 hover:text-[#E0B15A] transition-colors"
        activeProps={{ className: "min-h-11 flex flex-col items-center gap-1 py-2.5 text-[#E0B15A]" }}
        activeOptions={{ exact: !!exact }}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}
