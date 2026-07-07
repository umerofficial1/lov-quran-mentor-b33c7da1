import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { Search as SearchIcon, BookOpen } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";
import { SURAHS } from "@/lib/surahs";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search the Quran — Arabic, English & Urdu · Verse Wise Mentor" },
      {
        name: "description",
        content:
          "Powerful Quran search across Arabic, English and Urdu — find verses by topic, root words, surah or ayah reference. Powered by Verse Wise Mentor.",
      },
      { property: "og:title", content: "Search the Quran — Verse Wise Mentor" },
      {
        property: "og:description",
        content: "Search the Holy Quran in Arabic, English and Urdu with topic and root-word lookup.",
      },
    ],
  }),
  component: SearchPage,
});

type Hit = {
  verse_id: number;
  verse_key: string;
  text: string;
  highlighted: string;
  words: unknown[];
  translations: { text: string; language_name: string; resource_name: string }[];
};

type SearchResponse = {
  search: {
    query: string;
    total_results: number;
    results: Hit[];
  };
};

const LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic" },
  { code: "ur", label: "Urdu" },
];

// Topic quick-picks — send as normal queries
const TOPICS = [
  "Mercy", "Patience", "Prayer", "Charity", "Paradise",
  "Repentance", "Prophets", "Knowledge", "Justice", "Family",
];

// A few common root letters
const ROOTS = ["رحم", "علم", "صبر", "سلم", "كتب", "حكم", "عدل", "ذكر"];

function parseRef(q: string): { surah: number; ayah?: number } | null {
  const m = q.trim().match(/^(\d{1,3})[:\s.-]?(\d{1,3})?$/);
  if (!m) return null;
  const surah = Number(m[1]);
  if (surah < 1 || surah > 114) return null;
  const ayah = m[2] ? Number(m[2]) : undefined;
  return { surah, ayah };
}

function SearchPage() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [lang, setLang] = useState("en");

  const ref = parseRef(submitted);

  const search = useQuery<SearchResponse>({
    queryKey: ["quran-search", submitted, lang],
    enabled: !!submitted && !ref,
    queryFn: async () => {
      const url = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(
        submitted,
      )}&size=25&page=0&language=${lang}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as SearchResponse;
    },
    staleTime: 1000 * 60 * 5,
  });

  const submit = (value?: string) => {
    const next = (value ?? q).trim();
    if (!next) return;
    if (value !== undefined) setQ(next);
    setSubmitted(next);
  };

  return (
    <div className="min-h-screen pb-28 md:pb-16">
      <SiteNav />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-bold">
            Powerful search
          </p>
          <h1 className="text-4xl md:text-5xl font-display text-white mt-2">
            Search the Holy Quran
          </h1>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Search by topic, verse, surah, or root letters — in Arabic, English or
            Urdu. Type a reference like <span className="text-amber-300">2:255</span>
            {" "}to jump directly.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2"
        >
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3">
            <SearchIcon className="size-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Mercy · صبر · 2:255 · Al-Fatihah"
              className="flex-1 bg-transparent py-2.5 text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="rounded-lg bg-black/30 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50"
            aria-label="Search language"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-amber-400 text-black px-4 py-2 font-bold text-sm hover:scale-[1.02] transition"
          >
            Search
          </button>
        </form>

        {!submitted && (
          <div className="mt-8 space-y-6">
            <Section title="Topics">
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <Pill key={t} onClick={() => submit(t)}>{t}</Pill>
                ))}
              </div>
            </Section>
            <Section title="Root letters">
              <div className="flex flex-wrap gap-2" dir="rtl">
                {ROOTS.map((r) => (
                  <Pill key={r} onClick={() => submit(r)}>
                    <span className="font-uthmani text-lg">{r}</span>
                  </Pill>
                ))}
              </div>
            </Section>
            <Section title="Jump by reference">
              <p className="text-sm text-slate-400">
                Try <button onClick={() => submit("2:255")} className="text-amber-300 hover:underline">2:255</button>
                {" · "}
                <button onClick={() => submit("36")} className="text-amber-300 hover:underline">Surah 36</button>
                {" · "}
                <button onClick={() => submit("112:1")} className="text-amber-300 hover:underline">112:1</button>
              </p>
            </Section>
          </div>
        )}

        {ref && (
          <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
            <BookOpen className="size-6 mx-auto text-amber-300" />
            <p className="mt-3 text-slate-300 text-sm">
              Jump to <span className="text-white font-bold">Surah {ref.surah}
              {ref.ayah ? `, Ayah ${ref.ayah}` : ""}</span>
            </p>
            <Link
              to="/quran/$surahId"
              params={{ surahId: String(ref.surah) }}
              hash={ref.ayah ? `v-${ref.surah}-${ref.ayah}` : undefined}
              className="mt-4 inline-block rounded-lg bg-amber-400 text-black px-4 py-2 font-bold text-sm hover:scale-[1.02] transition"
            >
              Open reader
            </Link>
          </div>
        )}

        {submitted && !ref && (
          <div className="mt-8 space-y-3">
            {search.isLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            )}
            {search.isError && (
              <p className="text-red-400 text-sm text-center py-6">Search failed. Please try again.</p>
            )}
            {search.data && (
              <>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  {search.data.search.total_results} result
                  {search.data.search.total_results === 1 ? "" : "s"} for
                  {" "}<span className="text-amber-300">"{submitted}"</span>
                </p>
                {search.data.search.results.map((hit) => {
                  const [sNum, aNum] = hit.verse_key.split(":").map(Number);
                  const surah = SURAHS.find((s) => s.n === sNum);
                  return (
                    <Link
                      key={`${hit.verse_key}-${hit.verse_id}`}
                      to="/quran/$surahId"
                      params={{ surahId: String(sNum) }}
                      hash={`v-${sNum}-${aNum}`}
                      className="block rounded-xl border border-white/10 bg-white/[0.03] hover:border-amber-400/40 hover:bg-white/5 p-5 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">
                          {surah?.nameAr ?? `Surah ${sNum}`} · {hit.verse_key}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {surah?.name}
                        </span>
                      </div>
                      <p
                        className="font-uthmani text-white text-right text-xl leading-loose"
                        dir="rtl"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(hit.text ?? ""),
                        }}
                      />
                      {hit.translations?.[0]?.text && (
                        <p
                          className="mt-3 text-sm text-slate-300"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(hit.translations[0].text),
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
                {search.data.search.results.length === 0 && (
                  <p className="text-slate-400 text-center py-8">
                    No matches. Try another word or switch language.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</p>
      {children}
    </div>
  );
}

function Pill({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-amber-400/10 text-slate-200 hover:text-amber-200 px-4 py-1.5 text-sm transition"
    >
      {children}
    </button>
  );
}
