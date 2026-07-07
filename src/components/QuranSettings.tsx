import { useState } from "react";
import { Settings2, Type, AlignJustify, X } from "lucide-react";
import type { QuranPrefs, QuranScript } from "@/hooks/use-quran-prefs";

export function QuranSettings({
  prefs,
  update,
}: {
  prefs: QuranPrefs;
  update: (p: Partial<QuranPrefs>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reader settings"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 size-12 rounded-full bg-amber-400 text-black shadow-[0_10px_30px_rgba(201,162,76,0.35)] grid place-items-center hover:scale-105 transition"
      >
        <Settings2 className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end md:place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#0F1E3D] border border-white/10 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Reader settings</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close settings"
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Script</p>
              <div className="grid grid-cols-2 gap-2">
                {(["uthmani", "indopak"] as QuranScript[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update({ script: s })}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize ${
                      prefs.script === s
                        ? "bg-amber-400 text-black border-amber-300"
                        : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {s === "uthmani" ? "Uthmani (خط عثماني)" : "IndoPak (نستعلیق)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="inline-flex items-center gap-1"><Type className="size-3" /> Font size</span>
                <span className="text-amber-300">{prefs.fontSize}px</span>
              </div>
              <input
                type="range"
                min={20}
                max={64}
                step={1}
                value={prefs.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="inline-flex items-center gap-1"><AlignJustify className="size-3" /> Line spacing</span>
                <span className="text-amber-300">{prefs.lineSpacing.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={1.4}
                max={3.2}
                step={0.05}
                value={prefs.lineSpacing}
                onChange={(e) => update({ lineSpacing: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <label className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <span className="text-sm text-white">Show translation</span>
              <input
                type="checkbox"
                checked={prefs.showTranslation}
                onChange={(e) => update({ showTranslation: e.target.checked })}
                className="size-4 accent-amber-400"
              />
            </label>
          </div>
        </div>
      )}
    </>
  );
}
