import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Ann = { id: string; title: string; body: string; audience: string };

const DISMISSED_KEY = "vwm.announcements.dismissed";

export function AnnouncementsBanner() {
  const [items, setItems] = useState<Ann[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISSED_KEY);
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {/* ignore */}
    supabase.from("announcements")
      .select("id, title, body, audience")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setItems((data ?? []) as Ann[]));
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id);
    setDismissed(next);
    try { window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next))); } catch {/* ignore */}
  };

  const visible = items.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  const a = visible[0];
  return (
    <div className="max-w-5xl mx-auto px-4 mt-4">
      <div className="rounded-2xl bg-amber-400/10 border border-amber-400/30 p-4 flex items-start gap-3">
        <Megaphone className="size-4 text-amber-300 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">{a.title}</p>
          <p className="text-slate-200 text-xs mt-0.5 whitespace-pre-wrap">{a.body}</p>
        </div>
        <button onClick={() => dismiss(a.id)} aria-label="Dismiss" className="text-slate-400 hover:text-white p-1"><X className="size-4" /></button>
      </div>
    </div>
  );
}
