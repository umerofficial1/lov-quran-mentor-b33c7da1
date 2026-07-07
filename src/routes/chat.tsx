import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { Send, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Mentor — Verse Wise Mentor" },
      { name: "description", content: "Ask an AI Quran mentor about tajweed, tafsir, hifz technique and Islamic questions — grounded in classical scholarship." },
      { property: "og:title", content: "AI Mentor — Verse Wise Mentor" },
      { property: "og:description", content: "Trilingual AI teacher for Quran, tafsir and Islamic knowledge." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Explain Surah Al-Fatiha verse by verse",
  "How do I improve my Tajweed at home?",
  "Best plan to memorize the Quran in 2 years?",
  "Tafsir of Ayat al-Kursi (2:255)",
  "نماز کا طریقہ مختصراً سمجھائیں",
];

function ChatPage() {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(input, { ...init, headers });
        },
      }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="size-3" /> AI Teacher
          </div>
          <h1 className="text-3xl font-bold text-white mt-3">Love Qran Assistant</h1>
          <p className="text-slate-400 text-sm mt-1">Ask about the Quran, Tajweed, Tafsir or any Islamic question</p>
        </div>

        {!loading && !user && (
          <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-400/30 p-4 text-center text-amber-100 text-sm">
            Please <Link to="/auth" className="font-semibold underline">sign in</Link> to chat with the AI Teacher.
          </div>
        )}

        <div className="flex-1 space-y-4 mb-4 min-h-[40vh]">
          {messages.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-amber-400/30 transition-all text-sm text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    isUser
                      ? "max-w-[85%] rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-lg"
                      : "max-w-[90%] text-slate-200 leading-relaxed whitespace-pre-wrap"
                  }
                >
                  {text || (busy && !isUser ? <span className="text-slate-500 italic">Thinking…</span> : null)}
                </div>
              </div>
            );
          })}

          {error && (
            <p className="text-red-400 text-sm text-center">
              {error.message || "Something went wrong. Please try again."}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="sticky bottom-4 flex gap-2 p-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the Quran…"
            disabled={busy}
            autoFocus
            className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="size-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white grid place-items-center disabled:opacity-50 shadow-[0_0_20px_rgba(5,150,105,0.4)]"
            aria-label="Send"
          >
            <Send className="size-5" />
          </button>
        </form>
      </main>
    </div>
  );
}
