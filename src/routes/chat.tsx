import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { Send, Sparkles, BookOpen, Brain, GraduationCap, Languages, Ear, Scale } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Mentor — Verse Wise Mentor" },
      { name: "description", content: "Ask an AI Quran mentor about tajweed, tafsir, hifz technique and Islamic questions — grounded in classical scholarship." },
      { property: "og:title", content: "AI Mentor — Verse Wise Mentor" },
      { property: "og:description", content: "Trilingual AI teacher for Quran, tafsir and Islamic knowledge." },
      { property: "og:url", content: "https://lov-quran-mentor.lovable.app/chat" },
    ],
    links: [{ rel: "canonical", href: "https://lov-quran-mentor.lovable.app/chat" }],
  }),
  component: () => (<RequireAuth><ChatPage /></RequireAuth>),
});

type Mode = "ask" | "learning" | "tafsir" | "translation" | "mistake" | "quiz";

const MODES: { id: Mode; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "ask", label: "Ask", icon: <Sparkles className="size-3.5" />, hint: "Open Q&A" },
  { id: "learning", label: "Learning", icon: <GraduationCap className="size-3.5" />, hint: "Step-by-step lessons" },
  { id: "tafsir", label: "Tafsir", icon: <BookOpen className="size-3.5" />, hint: "Classical commentary" },
  { id: "translation", label: "Translate", icon: <Languages className="size-3.5" />, hint: "Compare translations" },
  { id: "mistake", label: "Mistake check", icon: <Scale className="size-3.5" />, hint: "Recitation review" },
  { id: "quiz", label: "Quiz", icon: <Brain className="size-3.5" />, hint: "One question at a time" },
];

const SUGGESTIONS: Record<Mode, string[]> = {
  ask: [
    "Explain Surah Al-Fatiha verse by verse",
    "How do I improve my Tajweed at home?",
    "Best plan to memorize the Quran in 2 years?",
    "نماز کا طریقہ مختصراً سمجھائیں",
  ],
  learning: [
    "Teach me the rules of Noon Sakinah step by step",
    "Introduce me to the Uloom al-Quran",
    "Beginner's roadmap to learn Arabic of Quran",
  ],
  tafsir: [
    "Tafsir of Ayat al-Kursi (2:255)",
    "Compare Ibn Kathir and Maariful on Surah Al-Kahf verse 1",
    "Reasons of revelation for Surah Al-Falaq",
  ],
  translation: [
    "Compare translations of 55:13",
    "Nuances in Saheeh Intl vs Maududi for 1:6",
  ],
  mistake: [
    "I recited 2:255 — check for mistakes",
    "Common errors on Surah Fatiha for beginners",
  ],
  quiz: [
    "Quiz me on the Prophets in the Quran",
    "Quiz me on Tajweed rules",
    "Quiz me on the Pillars of Islam",
  ],
};

function ChatPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("ask");
  const [ctx, setCtx] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const { messages, sendMessage, status, error, setMessages } = useChat({ transport });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy, mode]);

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage(
      { text },
      { body: { mode, context: ctx.trim() || undefined } },
    );
    setInput("");
  };

  return (
    <div className="min-h-dvh flex flex-col pb-24 md:pb-8">
      <SiteNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="size-3" /> AI Quran Assistant
          </div>
          <h1 className="text-3xl font-bold text-white mt-3">Verse Wise Mentor</h1>
          <p className="text-slate-400 text-sm mt-1">
            Context-aware answers · translation compare · learning &amp; quiz modes
          </p>
        </div>

        {!loading && !user && (
          <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-400/30 p-4 text-center text-amber-100 text-sm">
            Please <Link to="/auth" className="font-semibold underline">sign in</Link> to chat with the AI Teacher.
          </div>
        )}

        {/* Mode selector */}
        <div className="mb-3 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setMessages([]); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition ${
                mode === m.id
                  ? "bg-amber-400 text-black border-amber-300"
                  : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
              }`}
              title={m.hint}
              type="button"
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Context (verse ref / topic) */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-widest text-slate-400 font-bold shrink-0">
            Context
          </label>
          <input
            value={ctx}
            onChange={(e) => setCtx(e.target.value)}
            placeholder="Optional — e.g. Surah 2:255, or 'noon sakinah rules'"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/40"
          />
        </div>

        <div className="flex-1 space-y-4 mb-4 min-h-[40vh]">
          {messages.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUGGESTIONS[mode].map((s) => (
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
                {isUser ? (
                  <div className="max-w-[85%] rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-lg whitespace-pre-wrap">
                    {text}
                  </div>
                ) : (
                  <div className="max-w-[92%] prose prose-invert prose-sm text-slate-200 leading-relaxed">
                    {text ? (
                      <ReactMarkdown>{text}</ReactMarkdown>
                    ) : busy ? (
                      <span className="text-slate-500 italic">Thinking…</span>
                    ) : null}
                  </div>
                )}
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
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "quiz" ? "Type your answer or 'next'…" : "Ask anything about the Quran…"}
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
      <MobileNav />
    </div>
  );
}
// silence unused-import warning
void Ear;
