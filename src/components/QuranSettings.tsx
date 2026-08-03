import { useState } from "react";
import {
  Settings2, Type, AlignJustify, X, Palette, LayoutGrid, Scroll, ZoomIn,
  PlayCircle, Moon, Focus, Sun,
} from "lucide-react";
import type { QuranPrefs, QuranScript, MushafLayout, ViewMode } from "@/hooks/use-quran-prefs";

const LAYOUTS: { id: MushafLayout; label: string; hint: string }[] = [
  { id: "flow", label: "Flow", hint: "Verse-by-verse cards" },
  { id: "15line", label: "15 Line", hint: "Classic 15-line" },
  { id: "16line", label: "16 Line", hint: "Classic 16-line" },
  { id: "madani", label: "Madani", hint: "Madinah Mushaf" },
];

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "continuous", label: "Continuous", icon: <Scroll className="size-4" /> },
  { id: "pageflip", label: "Page Flip", icon: <LayoutGrid className="size-4" /> },
];

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
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 size-12 rounded-full bg-amber-400 text-black shadow-[0_10px_30px_rgba(224,177,90,0.35)] grid place-items-center hover:scale-105 transition"
      >
        <Settings2 className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end md:place-items-center p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#0B2420] border border-white/10 p-6 space-y-6 max-h-[92vh] overflow-y-auto"
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

            {/* Script */}
            <Section title="Script">
              <div className="grid grid-cols-2 gap-2">
                {(["uthmani", "indopak"] as QuranScript[]).map((s) => (
                  <Chip key={s} active={prefs.script === s} onClick={() => update({ script: s })}>
                    {s === "uthmani" ? "Uthmani" : "IndoPak"}
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Mushaf layout */}
            <Section title="Mushaf layout" icon={<LayoutGrid className="size-3" />}>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUTS.map((l) => (
                  <Chip key={l.id} active={prefs.layout === l.id} onClick={() => update({ layout: l.id })}>
                    <div className="text-left">
                      <div>{l.label}</div>
                      <div className="text-[10px] opacity-70 font-normal normal-case">{l.hint}</div>
                    </div>
                  </Chip>
                ))}
              </div>
            </Section>

            {/* View mode */}
            <Section title="View mode">
              <div className="grid grid-cols-2 gap-2">
                {VIEW_MODES.map((m) => (
                  <Chip key={m.id} active={prefs.viewMode === m.id} onClick={() => update({ viewMode: m.id })}>
                    <span className="inline-flex items-center gap-2">{m.icon}{m.label}</span>
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Tajweed */}
            <Toggle
              icon={<Palette className="size-4 text-amber-300" />}
              label="Tajweed colors"
              hint="Color-coded recitation rules (Uthmani script)"
              checked={prefs.tajweed}
              onChange={(v) => update({ tajweed: v })}
            />

            {/* Sliders */}
            <Slider
              icon={<Type className="size-3" />}
              label="Font size"
              value={prefs.fontSize} min={20} max={64} step={1} suffix="px"
              onChange={(v) => update({ fontSize: v })}
            />
            <Slider
              icon={<AlignJustify className="size-3" />}
              label="Line spacing"
              value={prefs.lineSpacing} min={1.4} max={3.2} step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => update({ lineSpacing: v })}
            />
            <Slider
              icon={<AlignJustify className="size-3 rotate-90" />}
              label="Word spacing"
              value={prefs.wordSpacing} min={0} max={0.8} step={0.02}
              format={(v) => `${v.toFixed(2)}em`}
              onChange={(v) => update({ wordSpacing: v })}
            />
            <Slider
              icon={<ZoomIn className="size-3" />}
              label="Zoom"
              value={prefs.zoom} min={0.8} max={1.8} step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => update({ zoom: v })}
            />

            {/* Brightness */}
            <Slider
              icon={<Sun className="size-3" />}
              label="Brightness"
              value={prefs.brightness} min={0.3} max={1} step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => update({ brightness: v })}
            />

            {/* Auto scroll */}
            <Toggle
              icon={<PlayCircle className="size-4 text-teal-300" />}
              label="Auto scroll"
              hint="Slowly scroll the page while you read"
              checked={prefs.autoScroll}
              onChange={(v) => update({ autoScroll: v })}
            />
            {prefs.autoScroll && (
              <Slider
                label="Scroll speed"
                value={prefs.autoScrollSpeed} min={10} max={120} step={5} suffix=" px/s"
                onChange={(v) => update({ autoScrollSpeed: v })}
              />
            )}

            {/* Modes */}
            <Toggle
              icon={<Moon className="size-4 text-slate-300" />}
              label="Night mode"
              hint="Deep black background, softer text"
              checked={prefs.nightMode}
              onChange={(v) => update({ nightMode: v })}
            />
            <Toggle
              icon={<Focus className="size-4 text-amber-300" />}
              label="Focus mode"
              hint="Dim all verses except the one you hover"
              checked={prefs.focusMode}
              onChange={(v) => update({ focusMode: v })}
            />

            {/* Word by Word */}
            <Toggle
              label="Word-by-word"
              hint="Arabic + English + Urdu + Roman + root + pronunciation"
              checked={prefs.wordByWord}
              onChange={(v) => update({ wordByWord: v })}
            />

            {/* Translation */}
            <Toggle
              label="Show translation"
              checked={prefs.showTranslation}
              onChange={(v) => update({ showTranslation: v })}
            />
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest inline-flex items-center gap-1">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-bold capitalize text-left ${
        active
          ? "bg-amber-400 text-black border-amber-300"
          : "bg-white/5 text-white border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  icon, label, hint, checked, onChange,
}: { icon?: React.ReactNode; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 cursor-pointer">
      <span className="flex items-start gap-2">
        {icon}
        <span>
          <span className="text-sm text-white block">{label}</span>
          {hint && <span className="text-[11px] text-slate-400 block">{hint}</span>}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-amber-400"
      />
    </label>
  );
}

function Slider({
  icon, label, value, min, max, step, suffix, format, onChange,
}: {
  icon?: React.ReactNode; label: string; value: number; min: number; max: number; step: number;
  suffix?: string; format?: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
        <span className="inline-flex items-center gap-1">{icon} {label}</span>
        <span className="text-amber-300">{format ? format(value) : `${value}${suffix ?? ""}`}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400"
      />
    </div>
  );
}
