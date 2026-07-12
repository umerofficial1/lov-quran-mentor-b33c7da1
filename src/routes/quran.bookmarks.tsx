import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";
import { SURAHS } from "@/lib/surahs";
import { BookmarkCheck, ChevronRight, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/quran/bookmarks")({
  head: () => ({
    meta: [
      { title: "My Bookmarks & Favorites — Verse Wise Mentor" },
      { name: "description", content: "All your saved ayahs across every surah, in one place." },
      { property: "og:title", content: "My Bookmarks — Verse Wise Mentor" },
      { property: "og:description", content: "Jump back into any saved ayah instantly." },
    ],
  }),
  component: () => (<RequireAuth><BookmarksPage /></RequireAuth>),
});

type Row = { id: string; surah: number; ayah: number; created_at: string };

function BookmarksPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { setLoading(false); return; }
      const { data } = await supabase
        .from("bookmarks")
        .select("id, surah, ayah, created_at")
        .eq("user_id", sess.session.user.id)
        .order("created_at", { ascending: false });
      if (data) setRows(data as Row[]);
      setLoading(false);
    })();
  }, []);

  const remove = async (id: string) => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    await supabase.from("bookmarks").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#C9A24C] font-bold">
            <Star className="size-3.5" /> Your library
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">Bookmarks &amp; Favorites</h1>
          <p className="text-slate-400 mt-1">Every ayah you've saved, ready to resume.</p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <BookmarkCheck className="size-8 text-[#C9A24C] mx-auto" />
            <p className="text-white font-bold mt-3">No bookmarks yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Tap the bookmark icon on any ayah while reading to save it here.
            </p>
            <Link
              to="/quran"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-[#C9A24C] text-[#070C1F] text-sm font-bold hover:brightness-110 transition"
            >
              Browse the Quran <ChevronRight className="size-4" />
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {rows.map((r) => {
            const s = SURAHS.find((x) => x.n === r.surah);
            return (
              <div
                key={r.id}
                className="group flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C9A24C]/40 hover:bg-white/10 p-4 transition-all"
              >
                <div className="size-12 rounded-xl bg-gradient-to-br from-[#C9A24C]/25 to-[#1FB6B0]/20 border border-white/10 grid place-items-center text-[#C9A24C] font-bold shrink-0">
                  {r.surah}:{r.ayah}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">
                    Surah {r.surah} · Ayah {r.ayah}
                  </p>
                  <p className="text-xs text-slate-400 truncate" dir="rtl">
                    {s?.nameAr ?? ""} · {s?.nameUr ?? ""}
                  </p>
                </div>
                <Link
                  to="/quran/$surahId"
                  params={{ surahId: String(r.surah) }}
                  hash={`v-${r.surah}-${r.ayah}`}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:text-[#C9A24C] hover:border-[#C9A24C]/40 transition"
                >
                  Open <ChevronRight className="size-3.5" />
                </Link>
                <button
                  onClick={() => remove(r.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition"
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
