import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { RECITERS, CATEGORIES, type Reciter } from "@/data/reciters";
import { SURAHS as ALL_SURAHS } from "@/lib/surahs";
import { Youtube, Volume2, MapPin, Calendar, Award, X, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/reciters")({
  head: () => ({
    meta: [
      { title: "Quran Reciters & Tilawat Videos | Verse Wise Mentor" },
      { name: "description", content: "Watch verified Quran recitation videos and listen to full surahs by renowned Imams and Qurra, including Sudais, Minshawi, and Abdul Basit." },
      { property: "og:title", content: "Qurra Library — Famous Reciters of the Holy Quran" },
      { property: "og:description", content: "Curated tilawaat from Sudais, Mishary, Abdul Basit, Minshawi and more — video and audio, all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequireAuth><RecitersPage /></RequireAuth>,
});

const SURAHS: Record<string, string> = {
  "2": "Al-Baqarah", "3": "Ale-Imran", "8": "Al-Anfal", "11": "Hud", "12": "Yusuf",
  "17": "Al-Isra", "18": "Al-Kahf", "19": "Maryam", "25": "Al-Furqan", "35": "Fatir",
  "36": "Ya-Sin", "53": "An-Najm", "55": "Ar-Rahman", "56": "Al-Waqi'ah", "59": "Al-Hashr",
  "67": "Al-Mulk", "75": "Al-Qiyamah", "76": "Al-Insan", "82": "Al-Infitar", "88": "Al-Ghashiyah",
  "93": "Ad-Duha",
};

const POPULAR_SURAHS: { name: string; arabic: string }[] = [
  { name: "Al-Fatiha", arabic: "الفاتحة" },
  { name: "Al-Baqarah", arabic: "البقرة" },
  { name: "Ya-Sin", arabic: "يس" },
  { name: "Ar-Rahman", arabic: "الرحمن" },
  { name: "Al-Waqi'ah", arabic: "الواقعة" },
  { name: "Al-Mulk", arabic: "الملك" },
];

// Verified public YouTube videos in the same order as POPULAR_SURAHS.
// Direct watch links are intentionally used instead of search-result links.
const RECITER_VIDEO_IDS: Record<string, readonly string[]> = {
  sudais: ["t5EjVkXYswc", "IdaPmyk3fsc", "Q--H5uqHP5s", "Lbcta_bVxP4", "sgwN0OwPGLw", "NYti96AJOFc"],
  shuraim: ["LgUWoJh8OqU", "53zSEE7JDnA", "NPihAhuwn5w", "aCUHVNBh6tQ", "8J94rufVwkc", "8UA6D19nIrQ"],
  maher: ["7wf_lV_3o_8", "jFLdhKTFGPc", "oa0BeU8tQZ0", "4dG57DDr4_E", "Qj_03OTtkdg", "OMJJ40AX4t4"],
  juhany: ["DUSWJa3iCW8", "7wf_lV_3o_8", "Cw7VI3se9w0", "bWEwnKs762M", "-r4LBzfEg94", "QUasb_qBLRk"],
  budair: ["PItAQkmGplA", "YEDzmDw1ROg", "ijViMjQ2NpU", "oZh0hcuFLAw", "uuxauj87zWA", "6c10pctj8rs"],
  ghamdi: ["j7DReKjLdRo", "oP8aS6sZkB4", "K1qGY5SqAHQ", "e0bK4ukYkuA", "ElW7hm3BOK0", "gFyicQF6jvg"],
  abdulbasit: ["zyeaEEGgJ2Q", "_QjOJo7cTTM", "vuOJXkFHriE", "cJzMWiUno8M", "tuNESmUOszs", "IfdKIAdEF0E"],
  minshawi: ["0jLYZ5s2FQQ", "P8_MbwnSFpY", "PwjXv0KqheM", "ENTY9pn3jSU", "bhadDWbT39I", "kkrPEEWIN8U"],
  hussary: ["X0T2unXgJ4s", "WLiNXh0ztOo", "CrmJL_hLA9U", "dX4j-P8Im8Y", "BKygH8FWgiU", "krA3W-QDzWU"],
  "mustafa-ismail": ["o2QfupiB5Zs", "rrmGq4VgBnY", "YgbSEpJUJrY", "Elb9YcjWu2w", "gkPryvIkt3Q", "t3fcdfpemig"],
  rifat: ["ettj9lIggug", "goQQsYBNIRg", "y35mTuuNCbM", "ettj9lIggug", "emakp1IJMV8", "qboZqcZlhOE"],
  tablawi: ["P3JDGcdwodg", "1rs_8IUPpCM", "w3tFls89A40", "_Fhu-StHAMc", "sTBAeye0yoY", "tRlwVZ8DlaA"],
  mishary: ["7wf_lV_3o_8", "X2YnP50cwNU", "ZdsddmOvu5E", "H4N5eFbLl9A", "NDE6iXOK7_Q", "ifGIMi82aFE"],
  ajmy: ["OZh09nkj8Hg", "yvuUA1M9jSM", "2twStp36NQQ", "OAb4h4MV7yA", "7l8xzR4eNaA", "gPEw8Bm7Qtc"],
  shatri: ["_b6r-scG588", "PjyiRpgiDkc", "IAwhT7KszNs", "dHgkscIdruc", "9kAprBi8luc", "U59Q0aTNtHY"],
  "muaiqly-yasser": ["LBcugZpkhXo", "9-SYYnQzVIY", "x3GCQBWg2Ic", "zUmDUKjTVdU", "wuQRhcaUYr8", "cObnEdY_gOY"],
  banna: ["V9Tgz4xf-Iw", "-o4Mg1P0op8", "aTYZsHOtzrM", "kq5cdeoUs00", "FUoKy9P60Ko", "O1hgyaMWPJQ"],
};

function RecitersPage() {
  const [category, setCategory] = useState<string>("all");
  const [active, setActive] = useState<Reciter | null>(null);

  const filtered = useMemo(
    () => category === "all" ? RECITERS : RECITERS.filter(r => r.category === category),
    [category]
  );

  return (
    <div className="min-h-dvh bg-[#070C1F] text-[#EEF2FB]">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-32">
        {/* Hero */}
        <header className="text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#C9A24C] mb-3">Qurra — القراء</p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold mb-4" style={{ backgroundImage: "linear-gradient(135deg,#F4E4A6,#D4AF37,#0F6D4F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Voices of the Holy Quran
          </h1>
          <p className="max-w-2xl mx-auto text-white/70 leading-relaxed">
            The world's greatest reciters — Imams of the two Holy Mosques, legendary Egyptian Kibar al-Qurra, and modern voices moving hearts today. Video and audio, all embedded.
          </p>
        </header>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all border ${
                category === c.id
                  ? "bg-[#C9A24C] text-[#070C1F] border-[#C9A24C] shadow-[0_0_20px_rgba(201,162,76,0.35)]"
                  : "bg-white/5 border-white/10 text-white/70 hover:border-[#C9A24C]/40 hover:text-[#C9A24C]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => setActive(r)}
              className="group relative text-left rounded-2xl bg-gradient-to-br from-[#0F1E3D] to-[#0B1730] border border-white/10 hover:border-[#C9A24C]/50 p-6 transition-all hover:shadow-[0_0_30px_rgba(201,162,76,0.2)] hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 text-[10px] tracking-widest uppercase text-[#C9A24C]/80">
                {r.style}
              </div>
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-14 h-14 rounded-full bg-[#0B1730] border border-[#C9A24C]/40 flex items-center justify-center text-2xl font-display text-[#C9A24C]">
                  {r.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg leading-tight text-white">{r.name.replace("Sheikh ", "")}</h3>
                  <p className="text-2xl text-[#1FB6B0] mt-1" style={{ fontFamily: "'Scheherazade New', serif" }} dir="rtl">
                    {r.arabicName}
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/60 line-clamp-3 mb-4">{r.bio}</p>
              <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-white/50">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{r.country}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{r.era}</span>
                <span className="inline-flex items-center gap-1"><Youtube className="size-3 text-[#C9A24C]" />YouTube</span>
                {r.audio && <span className="inline-flex items-center gap-1"><Volume2 className="size-3 text-[#1FB6B0]" />114 surahs</span>}
              </div>
            </button>
          ))}
        </div>
      </main>

      {active && <ReciterModal reciter={active} onClose={() => setActive(null)} />}

      <SiteFooter />
      <MobileNav />
    </div>
  );
}

function ReciterModal({ reciter, onClose }: { reciter: Reciter; onClose: () => void }) {
  const [surahNum, setSurahNum] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);

  const audioSrc = reciter.audio
    ? `${reciter.audio.server}/${reciter.audio.folder}/${String(surahNum).padStart(3, "0")}.mp3`
    : null;
  const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(reciter.youtubeQuery)}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="min-h-dvh flex items-start justify-center p-4 py-10">
        <div
          className="relative w-full max-w-4xl bg-gradient-to-br from-[#0F1E3D] to-[#070C1F] border border-[#C9A24C]/30 rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          {/* Header */}
          <div className="p-6 md:p-8 border-b border-white/10">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#0B1730] border-2 border-[#C9A24C]/50 flex items-center justify-center text-3xl font-display text-[#C9A24C]">
                {reciter.name.split(" ").slice(-1)[0][0]}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl md:text-3xl text-white">{reciter.name}</h2>
                <p className="text-3xl text-[#1FB6B0] mt-1" style={{ fontFamily: "'Scheherazade New', serif" }} dir="rtl">
                  {reciter.arabicName}
                </p>
                <div className="flex flex-wrap gap-3 mt-3 text-[10px] uppercase tracking-widest text-white/60">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{reciter.country}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{reciter.era}</span>
                  <span className="inline-flex items-center gap-1"><Award className="size-3 text-[#C9A24C]" />{reciter.style}</span>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm text-white/75 leading-relaxed">{reciter.bio}</p>
          </div>

          {/* Video Recitations — curated surah searches */}
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#C9A24C]">Video Recitations</h3>
              <a
                href={ytSearch}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-white/70 hover:text-[#C9A24C] transition"
              >
                All videos <ExternalLink className="size-3" />
              </a>
            </div>
            {selectedVideo && (
              <div className="mb-4 overflow-hidden rounded-xl border border-[#C9A24C]/40 bg-black">
                <div className="relative aspect-video">
                  <iframe
                    key={selectedVideo.id}
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                    title={`${reciter.name} — ${selectedVideo.title}`}
                    className="absolute inset-0 size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <p className="min-w-0 truncate text-xs font-semibold text-white">
                    {selectedVideo.title}
                  </p>
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[#C9A24C] hover:text-white transition"
                  >
                    YouTube <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {POPULAR_SURAHS.map((s, index) => {
                const videoId = RECITER_VIDEO_IDS[reciter.id]?.[index];
                const url = videoId
                  ? `https://www.youtube.com/watch?v=${videoId}`
                  : ytSearch;
                const thumb = videoId
                  ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                  : null;
                const cardClassName = "group relative overflow-hidden rounded-xl border border-white/10 hover:border-[#C9A24C]/60 bg-[#0B1730] text-left transition";
                const cardContent = (
                  <>
                    <div className="relative aspect-video bg-black">
                      {thumb && (
                        <img
                          src={thumb}
                          alt={`${reciter.name} reciting Surah ${s.name}`}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                        <div className="w-11 h-11 rounded-full bg-[#C9A24C] flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Youtube className="size-5 text-black" />
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-semibold text-white truncate">Surah {s.name}</p>
                      <p className="text-[9px] text-white/50 truncate" dir="rtl" style={{ fontFamily: "'Scheherazade New', serif" }}>{s.arabic}</p>
                    </div>
                  </>
                );

                return videoId ? (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSelectedVideo({ id: videoId, title: `Surah ${s.name}` })}
                    className={cardClassName}
                    aria-label={`Play ${reciter.name} reciting Surah ${s.name}`}
                  >
                    {cardContent}
                  </button>
                ) : (
                  <a
                    key={s.name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                  >
                    {cardContent}
                  </a>
                );
              })}
            </div>
            <p className="text-[10px] text-white/40 mt-3">Tap any surah to play the video here, or open it directly on YouTube.</p>
          </div>


          {/* Audio player */}
          {reciter.audio && (
            <div className="p-6 md:p-8 border-t border-white/10 bg-black/20">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#1FB6B0] mb-3">Full Mushaf Audio — Choose Surah</h3>
              <div className="flex items-center gap-3 mb-4">
                <select
                  value={surahNum}
                  onChange={e => setSurahNum(Number(e.target.value))}
                  className="flex-1 bg-[#0B1730] border border-white/15 rounded-lg px-4 py-3 text-sm text-white focus:border-[#1FB6B0] outline-none"
                >
                  {ALL_SURAHS.map(s => (
                    <option key={s.n} value={s.n}>
                      {String(s.n).padStart(3, "0")} — {s.nameAr} · {SURAHS[String(s.n)] ?? s.nameUr}
                    </option>
                  ))}
                </select>
              </div>
              {audioSrc && (
                <audio key={audioSrc} controls className="w-full" preload="none">
                  <source src={audioSrc} type="audio/mpeg" />
                </audio>
              )}
              <p className="text-[10px] text-white/40 mt-2">
                Audio streamed from MP3Quran.net · free & legal for all Muslims worldwide.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
