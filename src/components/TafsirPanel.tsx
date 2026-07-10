import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { BookOpen, X } from "lucide-react";
import { TAFSIRS, fetchTafsir } from "@/lib/tafsir";

export function TafsirButton({ verseKey }: { verseKey: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-300 hover:text-amber-300 transition"
        aria-label={`Open tafsir for ${verseKey}`}
      >
        <BookOpen className="size-3.5" /> Tafsir
      </button>
      {open && <TafsirModal verseKey={verseKey} onClose={() => setOpen(false)} />}
    </>
  );
}

function TafsirModal({ verseKey, onClose }: { verseKey: string; onClose: () => void }) {
  const [activeId, setActiveId] = useState<number>(TAFSIRS[0].id);
  const active = TAFSIRS.find((t) => t.id === activeId)!;

  const q = useQuery({
    queryKey: ["tafsir", activeId, verseKey],
    queryFn: () => fetchTafsir(activeId, verseKey),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0F1E3D] border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
              Tafsir · Ayah {verseKey}
            </p>
            <h3 className="text-white font-bold">{active.name}</h3>
            <p className="text-[11px] text-slate-400">{active.author}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
            aria-label="Close tafsir"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-white/10">
          {TAFSIRS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition ${
                t.id === activeId
                  ? "bg-amber-400 text-black border-amber-300"
                  : "bg-white/5 border-white/10 text-slate-300 hover:text-amber-300"
              }`}
            >
              {t.short}
              <span className="ml-1 opacity-60">{t.lang}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {q.isLoading && (
            <div className="space-y-2">
              <div className="h-4 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-white/10 animate-pulse" />
            </div>
          )}
          {q.isError && (
            <p className="text-sm text-red-400">Could not load tafsir.</p>
          )}
          {q.data && (
            <div
              className={`prose prose-invert prose-sm max-w-none leading-relaxed text-slate-200 ${
                active.lang === "ur" ? "text-right" : ""
              }`}
              dir={active.lang === "ur" || active.lang === "ar" ? "rtl" : "ltr"}
              lang={active.lang}
              style={
                active.lang === "ur"
                  ? { fontFamily: '"Noto Nastaliq Urdu", serif', lineHeight: 2.2 }
                  : undefined
              }
              dangerouslySetInnerHTML={{ __html: toCleanHtml(q.data.text) }}
            />
          )}
          {q.data === null && !q.isLoading && (
            <p className="text-sm text-slate-400">
              This tafsir is not available for this ayah. Try another source above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
