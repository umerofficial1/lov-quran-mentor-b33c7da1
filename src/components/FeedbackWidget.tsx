import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquarePlus, X, Send, Loader2 } from "lucide-react";
import { submitFeedback } from "@/lib/community.functions";
import { useAuth } from "@/hooks/use-auth";

export function FeedbackWidget() {
  const { user } = useAuth();
  const submit = useServerFn(submitFeedback);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<"general" | "bug" | "feature" | "content">("general");
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  if (!user) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending"); setErr(null);
    try {
      await submit({ data: { category: cat, message: msg, rating: rating || undefined } });
      setState("done"); setMsg(""); setRating(0);
      setTimeout(() => { setOpen(false); setState("idle"); }, 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setState("error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-24 left-4 md:bottom-6 md:left-6 z-40 size-11 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white grid place-items-center hover:bg-white/20"
      >
        <MessageSquarePlus className="size-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-end md:place-items-center p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={send} className="w-full max-w-md rounded-3xl bg-[#0F1E3D] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Send us feedback</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10 text-slate-400"><X className="size-4" /></button>
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm">
              <option value="general">General</option><option value="bug">Bug report</option>
              <option value="feature">Feature request</option><option value="content">Content correction</option>
            </select>
            <textarea required rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Your feedback…" className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white text-sm placeholder:text-slate-500" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className={`text-xl ${rating >= n ? "text-amber-300" : "text-slate-600 hover:text-amber-200"}`}>★</button>
              ))}
              <span className="ml-2 text-xs text-slate-500">Optional rating</span>
            </div>
            {err && <p className="text-rose-300 text-xs">{err}</p>}
            <button disabled={state === "sending"} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-black font-bold py-2.5 text-sm hover:scale-[1.02] disabled:opacity-50">
              {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {state === "done" ? "Thank you!" : "Send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
