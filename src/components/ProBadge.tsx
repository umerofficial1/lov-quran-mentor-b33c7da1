import { Sparkles } from "lucide-react";

/**
 * Static "PRO" badge — visual only. No billing yet.
 * Indicates every signed-in learner currently has full access to Ayatica Pro.
 */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] border border-[#C9A24C]/50 bg-gradient-to-r from-[#C9A24C]/20 to-[#F4E4A6]/10 text-[#F4E4A6] shadow-[0_0_10px_rgba(212,175,55,0.2)] ${className}`}
      title="You have full access to Ayatica Pro"
    >
      <Sparkles className="size-2.5" /> Pro
    </span>
  );
}
