import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, BookOpen, Sparkles, X, Send, MessageCircle } from "lucide-react";
import { fetchBookMeta, fetchSection, getBook } from "@/lib/hadith";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/hadith/$bookId")({
  loader: ({ params }) => {
    const book = getBook(params.bookId);
    if (!book) throw notFound();
    return { book };
  },
  component: BookPage,
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center text-white">
      <div className="text-center">
        <p className="text-white/70">Book not found.</p>
        <Link to="/hadith" className="mt-4 inline-block text-[#C9A24C] underline">Back to books</Link>
      </div>
    </div>
  ),
});

function BookPage() {
  const { book } = Route.useLoaderData();
  const [section, setSection] = useState<string>("1");
  const [mentorOpen, setMentorOpen] = useState(false);
  const [contextText, setContextText] = useState<string>("");

  const meta = useQuery({
    queryKey: ["hadith-meta", book.id],
    queryFn: () => fetchBookMeta(book.id),
    staleTime: 1000 * 60 * 60,
  });

  const sections = useMemo(() => {
    const entries = Object.entries(meta.data?.sections ?? {}).filter(([id, name]) => id !== "0" && name);
    return entries;
  }, [meta.data]);

  const translationLang: "urd" | "eng" = book.hasUrdu ? "urd" : "eng";

  const arSec = useQuery({
    queryKey: ["hadith-sec", book.id, "ara", section],
    queryFn: () => fetchSection(book.id, section, "ara"),
    enabled: !!section,
    staleTime: 1000 * 60 * 30,
  });
  const trSec = useQuery({
    queryKey: ["hadith-sec", book.id, translationLang, section],
    queryFn: () => fetchSection(book.id, section, translationLang),
    enabled: !!section,
    staleTime: 1000 * 60 * 30,
  });

  const merged = useMemo(() => {
    const ar = arSec.data?.hadiths ?? [];
    const tr = trSec.data?.hadiths ?? [];
    const trMap = new Map(tr.map((h) => [h.hadithnumber, h.text]));
    return ar.map((h) => ({
      n: h.hadithnumber,
      ar: h.text,
      tr: trMap.get(h.hadithnumber) ?? "",
      grades: h.grades ?? [],
    }));
  }, [arSec.data, trSec.data]);

  const openMentor = (seed?: string) => {
    if (seed) setContextText(seed);
    setMentorOpen(true);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Link to="/hadith" className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-[#C9A24C] uppercase tracking-widest">
          <ArrowLeft className="size-3.5" /> All books
        </Link>

        <header className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#C9A24C]/80">Kitab</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl text-white leading-tight" dir="rtl" lang="ar">
              {book.titleAr}
            </h1>
            <p className="mt-1 text-sm text-white/70">{book.title} — <span className="text-white/50">{book.author}</span></p>
          </div>
          <button
            onClick={() => openMentor()}
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] px-4 py-2 text-sm font-bold shadow-[0_0_24px_rgba(201,162,76,0.35)]"
          >
            <Sparkles className="size-4" /> Ask AI Mentor
          </button>
        </header>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Section list */}
          <aside className="lg:sticky lg:top-24 lg:self-start rounded-2xl border border-white/10 bg-white/[0.03] p-3 max-h-[70vh] overflow-y-auto">
            <div className="text-[10px] uppercase tracking-widest text-white/50 px-2 py-1 flex items-center gap-1.5">
              <BookOpen className="size-3" /> Abwaab (Chapters)
            </div>
            {meta.isLoading && <div className="p-3 text-sm text-white/60">Loading chapters…</div>}
            {meta.error && <div className="p-3 text-sm text-red-300">Couldn't load chapters.</div>}
            <ul className="mt-1 space-y-0.5">
              {sections.map(([id, name]) => (
                <li key={id}>
                  <button
                    onClick={() => setSection(id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      section === id
                        ? "bg-[#C9A24C]/15 text-[#C9A24C] border border-[#C9A24C]/30"
                        : "text-white/80 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className="text-[10px] text-white/40 mr-2">{id}</span>
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Hadiths */}
          <section className="space-y-4">
            {(arSec.isLoading || trSec.isLoading) && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 text-sm">
                Loading ahadith…
              </div>
            )}
            {arSec.error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200 text-sm">
                Failed to load this chapter. Please try another chapter.
              </div>
            )}
            {!arSec.isLoading && merged.length === 0 && !arSec.error && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 text-sm">
                No ahadith in this chapter.
              </div>
            )}
            {merged.map((h) => (
              <article
                key={h.n}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F1E3D]/70 to-[#070C1F]/80 p-5 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.4)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[#C9A24C]/80">
                    Hadith #{h.n}
                  </span>
                  <button
                    onClick={() =>
                      openMentor(
                        `Hadith #${h.n} from ${book.title}:\n\nArabic: ${h.ar}\n\nTranslation: ${h.tr}`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#1FB6B0]/15 border border-[#1FB6B0]/40 text-[#1FB6B0] hover:bg-[#1FB6B0]/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Sparkles className="size-3" /> Explain
                  </button>
                </div>
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-2xl md:text-[26px] leading-[2.1] text-white"
                  style={{ fontFamily: "'Amiri','Scheherazade New',serif" }}
                >
                  {h.ar}
                </p>
                {h.tr && (
                  <p
                    dir={translationLang === "urd" ? "rtl" : "ltr"}
                    lang={translationLang === "urd" ? "ur" : "en"}
                    className="mt-4 pt-4 border-t border-white/10 text-[15px] leading-relaxed text-white/85"
                    style={translationLang === "urd" ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : undefined}
                  >
                    {h.tr}
                  </p>
                )}
                {h.grades.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {h.grades.map((g, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-200">
                        {g.name}: {g.grade}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>
        </div>
      </main>

      {/* Floating AI Mentor button */}
      {!mentorOpen && (
        <button
          onClick={() => openMentor()}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] px-5 py-3 font-bold shadow-[0_10px_30px_-6px_rgba(201,162,76,0.55)]"
          aria-label="Open AI Mentor"
        >
          <MessageCircle className="size-5" /> AI Mentor
        </button>
      )}

      <MentorDrawer
        open={mentorOpen}
        onClose={() => setMentorOpen(false)}
        book={book}
        contextText={contextText}
      />
    </div>
  );
}

function MentorDrawer({
  open,
  onClose,
  book,
  contextText,
}: {
  open: boolean;
  onClose: () => void;
  book: { title: string; titleAr: string; author: string };
  contextText: string;
}) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(url, { ...init, headers });
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const bookContext = `You are helping a student study "${book.title}" (${book.titleAr}) by ${book.author}. Answer hadith questions in the user's language (Urdu or English). Give sanad/narrator context when relevant, explain fiqh implications briefly, and cite the book + hadith number when you reference specific texts.${
    contextText ? `\n\nCurrent hadith the student is asking about:\n${contextText}` : ""
  }`;

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text }, { body: { mode: "ask", context: bookContext } });
    setInput("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close mentor"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside className="relative w-full sm:w-[440px] h-full bg-[#0B1730] border-l border-white/10 flex flex-col shadow-2xl">
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[#C9A24C]">AI Mentor</div>
            <div className="text-sm font-semibold text-white truncate">{book.title}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70" aria-label="Close">
            <X className="size-4" />
          </button>
        </header>

        {!user && (
          <div className="m-3 rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 text-amber-100 text-xs">
            Please <Link to="/auth" className="font-bold underline">sign in</Link> to chat with the AI Mentor.
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {contextText && (
            <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3 text-[11px] text-white/70 max-h-32 overflow-y-auto whitespace-pre-wrap">
              <div className="text-[10px] uppercase tracking-widest text-[#1FB6B0] mb-1">Context</div>
              {contextText}
            </div>
          )}
          {messages.length === 0 && (
            <div className="space-y-2">
              {[
                "اس حدیث کا پس منظر اور شانِ ورود بیان کریں۔",
                "What are the main fiqh rulings derived from this hadith?",
                "راویوں کی ثقاہت اور سند پر روشنی ڈالیں۔",
                "Explain this hadith for a beginner in simple Urdu.",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="w-full text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C9A24C]/40 px-3 py-2 text-[13px] text-white/85"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {isUser ? (
                  <div className="max-w-[85%] rounded-2xl bg-emerald-600 text-white px-3 py-2 text-sm whitespace-pre-wrap">
                    {text}
                  </div>
                ) : (
                  <div className="max-w-[92%] prose prose-invert prose-sm text-white/90 leading-relaxed">
                    {text ? <ReactMarkdown>{text}</ReactMarkdown> : busy ? <span className="text-white/40 italic">Thinking…</span> : null}
                  </div>
                )}
              </div>
            );
          })}
          {error && (
            <p className="text-red-300 text-xs text-center">{error.message || "Something went wrong."}</p>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="p-3 border-t border-white/10 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this hadith…"
            disabled={busy || !user}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A24C]/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim() || !user}
            className="size-10 shrink-0 rounded-xl bg-[#C9A24C] hover:bg-[#B38F40] text-[#070C1F] grid place-items-center disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </form>
      </aside>
    </div>
  );
}
