import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SURAHS } from "@/lib/surahs";
import { JUZ_COUNT, HIZB_COUNT, PAGE_COUNT } from "@/lib/quran-meta";
import { BookOpen, Layers, FileText, Hash } from "lucide-react";

type Mode = "surah" | "juz" | "hizb" | "page";

export function QuranJumpBar({ current }: { current?: { mode: Mode; id: number } }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(current?.mode ?? "surah");
  const [value, setValue] = useState<number>(current?.id ?? 1);

  const go = (m: Mode, v: number) => {
    if (m === "surah") navigate({ to: "/quran/$surahId", params: { surahId: String(v) } });
    else if (m === "juz") navigate({ to: "/quran/juz/$juzId", params: { juzId: String(v) } });
    else if (m === "hizb") navigate({ to: "/quran/hizb/$hizbId", params: { hizbId: String(v) } });
    else navigate({ to: "/quran/page/$pageId", params: { pageId: String(v) } });
  };

  const options = () => {
    if (mode === "surah") return SURAHS.map((s) => ({ v: s.n, label: `${s.n}. ${s.nameAr}` }));
    const n = mode === "juz" ? JUZ_COUNT : mode === "hizb" ? HIZB_COUNT : PAGE_COUNT;
    return Array.from({ length: n }, (_, i) => ({ v: i + 1, label: String(i + 1) }));
  };

  const MODES: { key: Mode; label: string; icon: React.ReactNode }[] = [
    { key: "surah", label: "Surah", icon: <BookOpen className="size-3.5" /> },
    { key: "juz", label: "Juz", icon: <Layers className="size-3.5" /> },
    { key: "hizb", label: "Hizb", icon: <Hash className="size-3.5" /> },
    { key: "page", label: "Page", icon: <FileText className="size-3.5" /> },
  ];

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMode(m.key); setValue(1); }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${
              mode === m.key
                ? "bg-amber-400 text-black border-amber-300"
                : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/50"
        >
          {options().map((o) => (
            <option key={o.v} value={o.v}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => go(mode, value)}
          className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-sm hover:bg-amber-300"
        >
          Go
        </button>
      </div>
    </div>
  );
}
