import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SURAHS, padSurah } from "@/lib/surahs";

type Reciter = {
  id: string;
  name: string;
  nameUr: string;
  origin: string;
  /** Base server URL ending in "/" — append {001..114}.mp3 — HADR (fast) */
  hadrServer: string;
  /** Optional MASHQ (slow, teaching/mujawwad) server — falls back to hadr if absent */
  mashqServer?: string;
  /** Decorative gradient classes for avatar */
  gradient: string;
};

const misriQurra: Reciter[] = [
  {
    id: "husary",
    name: "Mahmoud Khalil Al-Husary",
    nameUr: "محمود خلیل الحصری",
    origin: "Egypt • شیخ القراء",
    hadrServer: "https://server13.mp3quran.net/husr/",
    mashqServer: "https://server13.mp3quran.net/husr_muallim/",
    gradient: "from-emerald-deep to-emerald-700",
  },
  {
    id: "minshawi",
    name: "Mohamed Siddiq El-Minshawi",
    nameUr: "محمد صدیق المنشاوی",
    origin: "Egypt • مجوّد",
    hadrServer: "https://server10.mp3quran.net/minsh/",
    mashqServer: "https://server10.mp3quran.net/menshawi_teacher/",
    gradient: "from-amber-700 to-gold-leaf",
  },
  {
    id: "abdulbasit",
    name: "Abdul Basit Abdul Samad",
    nameUr: "عبد الباسط عبد الصمد",
    origin: "Egypt • صوت الذہب",
    hadrServer: "https://server7.mp3quran.net/basit/",
    mashqServer: "https://server7.mp3quran.net/basit_mjwd/",
    gradient: "from-emerald-800 to-teal-700",
  },
  {
    id: "mustafa",
    name: "Mustafa Ismail",
    nameUr: "مصطفیٰ اسماعیل",
    origin: "Egypt • مجوّد",
    hadrServer: "https://server14.mp3quran.net/mustafa_ismail/",
    mashqServer: "https://server6.mp3quran.net/mustafa_ismail_mjwd/",
    gradient: "from-stone-700 to-stone-900",
  },
  {
    id: "albanna",
    name: "Mahmoud Ali Al-Banna",
    nameUr: "محمود علی البنا",
    origin: "Egypt • مجوّد",
    hadrServer: "https://server8.mp3quran.net/banna/",
    mashqServer: "https://server8.mp3quran.net/banna_mjwd/",
    gradient: "from-amber-800 to-orange-900",
  },
  {
    id: "tablawi",
    name: "Mohamed Mahmoud Al-Tablawi",
    nameUr: "محمد محمود الطبلاوی",
    origin: "Egypt",
    hadrServer: "https://server16.mp3quran.net/tblawi/",
    mashqServer: "https://server10.mp3quran.net/tblawi_mjwd/",
    gradient: "from-teal-800 to-emerald-deep",
  },
  {
    id: "jibreel",
    name: "Mohamed Jibreel",
    nameUr: "محمد جبریل",
    origin: "Egypt",
    hadrServer: "https://server8.mp3quran.net/jibreel/",
    gradient: "from-emerald-700 to-emerald-900",
  },
  {
    id: "rifai",
    name: "Hani Ar-Rifai",
    nameUr: "ہانی الرفاعی",
    origin: "Saudi Arabia",
    hadrServer: "https://server8.mp3quran.net/rifai/",
    gradient: "from-amber-700 to-amber-900",
  },
  {
    id: "ayyub",
    name: "Muhammad Ayyub",
    nameUr: "محمد أیوب",
    origin: "Imam, Masjid An-Nabawi",
    hadrServer: "https://server16.mp3quran.net/ayyub/",
    mashqServer: "https://server6.mp3quran.net/ayyub_mtj/",
    gradient: "from-emerald-800 to-teal-900",
  },
];

const imameKaaba: Reciter[] = [
  {
    id: "sudais",
    name: "Abdul Rahman Al-Sudais",
    nameUr: "عبد الرحمٰن السدیس",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server11.mp3quran.net/sds/",
    gradient: "from-emerald-deep to-emerald-800",
  },
  {
    id: "shuraim",
    name: "Saud Al-Shuraim",
    nameUr: "سعود الشریم",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server7.mp3quran.net/shur/",
    gradient: "from-stone-800 to-emerald-900",
  },
  {
    id: "muaiqly",
    name: "Maher Al-Muaiqly",
    nameUr: "ماہر المعیقلی",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server12.mp3quran.net/maher/",
    gradient: "from-emerald-700 to-teal-800",
  },
  {
    id: "balilah",
    name: "Bandar Balilah",
    nameUr: "بندر بلیلہ",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server6.mp3quran.net/balilah/",
    gradient: "from-amber-700 to-amber-900",
  },
  {
    id: "dossari",
    name: "Yasser Al-Dosari",
    nameUr: "یاسر الدوسری",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server11.mp3quran.net/yasser/",
    gradient: "from-emerald-800 to-emerald-deep",
  },
  {
    id: "ghamdi",
    name: "Saad Al-Ghamdi",
    nameUr: "سعد الغامدی",
    origin: "Imam, Madinah",
    hadrServer: "https://server7.mp3quran.net/s_gmd/",
    gradient: "from-teal-700 to-emerald-800",
  },
  {
    id: "ghazzawi",
    name: "Faisal Al-Ghazzawi",
    nameUr: "فیصل الغزاوی",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server7.mp3quran.net/ghazawi/",
    gradient: "from-stone-700 to-amber-900",
  },
  {
    id: "budair",
    name: "Salah Al-Budair",
    nameUr: "صلاح البدیر",
    origin: "Imam, Masjid An-Nabawi",
    hadrServer: "https://server14.mp3quran.net/bsfr/",
    gradient: "from-emerald-900 to-stone-900",
  },
  {
    id: "juhany",
    name: "Abdullah Awad Al-Juhany",
    nameUr: "عبد اللہ عواد الجہنی",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server13.mp3quran.net/jhn/",
    gradient: "from-emerald-800 to-teal-900",
  },
  {
    id: "hudhaify",
    name: "Ali Al-Hudhaify",
    nameUr: "علی الحذیفی",
    origin: "Imam, Masjid An-Nabawi",
    hadrServer: "https://server7.mp3quran.net/hthfi/",
    gradient: "from-stone-800 to-emerald-900",
  },
  {
    id: "bukhatir",
    name: "Salah Bukhatir",
    nameUr: "صلاح بوخاطر",
    origin: "UAE",
    hadrServer: "https://server12.mp3quran.net/bu_khtr/",
    gradient: "from-amber-800 to-stone-900",
  },
  {
    id: "thubaity",
    name: "Saleh Al-Talib",
    nameUr: "صالح الطالب",
    origin: "Imam, Masjid Al-Haram",
    hadrServer: "https://server16.mp3quran.net/talb/",
    gradient: "from-teal-800 to-emerald-900",
  },
  {
    id: "basfar",
    name: "Abdullah Basfar",
    nameUr: "عبد اللہ بصفر",
    origin: "Jeddah",
    hadrServer: "https://server7.mp3quran.net/basfer/",
    mashqServer: "https://server7.mp3quran.net/basfer_2/",
    gradient: "from-emerald-700 to-emerald-900",
  },
  {
    id: "ajamy",
    name: "Ahmad Al-Ajamy",
    nameUr: "أحمد العجمی",
    origin: "Saudi Arabia",
    hadrServer: "https://server10.mp3quran.net/ajm/",
    gradient: "from-amber-700 to-amber-900",
  },
  {
    id: "shatri",
    name: "Abu Bakr Al-Shatri",
    nameUr: "أبو بکر الشاطری",
    origin: "Jeddah",
    hadrServer: "https://server11.mp3quran.net/shatri/",
    gradient: "from-emerald-deep to-emerald-800",
  },
];

type Mode = "hadr" | "mashq";

function ReciterCard({
  r,
  mode,
  surahNum,
  isPlaying,
  onPlay,
}: {
  r: Reciter;
  mode: Mode;
  surahNum: number;
  isPlaying: boolean;
  onPlay: (r: Reciter) => void;
}) {
  const surah = SURAHS.find((s) => s.n === surahNum)!;
  const usingFallback = mode === "mashq" && !r.mashqServer;

  return (
    <article className="group bg-white border border-emerald-deep/10 rounded-2xl overflow-hidden hover:border-gold-leaf/40 hover:shadow-lg transition-all flex flex-col">
      {/* Calligraphic portrait tile */}
      <div className={`relative h-40 bg-gradient-to-br ${r.gradient} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)" }} />
        <p className="font-arabic text-white text-5xl drop-shadow-lg relative z-10" dir="rtl">
          {r.nameUr.split(" ")[0]}
        </p>
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white bg-black/20 backdrop-blur px-2 py-1 rounded">
          {mode === "hadr" ? "حدر" : usingFallback ? "حدر (متبادل)" : "مشق"}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <p className="font-urdu text-lg text-emerald-deep mb-1 leading-tight" dir="rtl">
          {r.nameUr}
        </p>
        <p className="text-sm font-semibold text-emerald-deep/80">{r.name}</p>
        <p className="text-xs text-emerald-deep/50 mb-4">{r.origin}</p>

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => onPlay(r)}
            className={
              isPlaying
                ? "w-full bg-emerald-deep text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                : "w-full bg-emerald-deep/5 text-emerald-deep py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-deep hover:text-white transition-colors"
            }
          >
            <span>{isPlaying ? "⏸" : "▶"}</span>
            <span dir="rtl">{isPlaying ? "روک دیں" : `سورۃ ${surah.nameUr}`}</span>
          </button>
          <Link
            to="/reciters"
            className="w-full bg-gold-leaf/10 text-gold-leaf py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gold-leaf hover:text-white transition-colors"
          >
            <span>🎥</span>
            <span dir="rtl">ویڈیو تلاوت دیکھیں</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function RecitersSection() {
  const [group, setGroup] = useState<"misri" | "kaaba">("misri");
  const [mode, setMode] = useState<Mode>("hadr");
  const [surahNum, setSurahNum] = useState<number>(1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<{ name: string; nameUr: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handlePlay = (r: Reciter) => {
    const key = `${r.id}-${mode}-${surahNum}`;
    const base = mode === "hadr" ? r.hadrServer : r.mashqServer;
    if (!base) return;
    const src = `${base}${padSurah(surahNum)}.mp3`;

    if (playingId === key) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(src);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audioRef.current = audio;
    void audio.play().catch(() => setPlayingId(null));
    setPlayingId(key);
    setNowPlaying({ name: r.name, nameUr: r.nameUr });
  };

  const reciters = group === "misri" ? misriQurra : imameKaaba;
  const currentSurah = SURAHS.find((s) => s.n === surahNum)!;

  return (
    <section id="reciters" className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-gold-leaf/10 text-gold-leaf text-[10px] font-bold uppercase tracking-widest mb-3">
            مشہور قراء کرام • مکمل قرآن
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">قراء کی تلاوت</h2>
          <p className="text-emerald-deep/60 mt-2">
            مصری قراء اور حرمین شریفین کے ائمہ — تمام 114 سورتیں، حدر اور مشق دونوں اندازوں میں
          </p>
        </div>

        <div className="inline-flex bg-emerald-deep/5 p-1 rounded-full self-start lg:self-end">
          <button
            onClick={() => setMode("hadr")}
            className={
              mode === "hadr"
                ? "px-5 py-2 rounded-full bg-emerald-deep text-white text-sm font-bold transition-all"
                : "px-5 py-2 rounded-full text-emerald-deep/70 text-sm font-medium hover:text-emerald-deep transition-colors"
            }
          >
            حدر (تیز)
          </button>
          <button
            onClick={() => setMode("mashq")}
            className={
              mode === "mashq"
                ? "px-5 py-2 rounded-full bg-emerald-deep text-white text-sm font-bold transition-all"
                : "px-5 py-2 rounded-full text-emerald-deep/70 text-sm font-medium hover:text-emerald-deep transition-colors"
            }
          >
            مشق (تعلیمی)
          </button>
        </div>
      </div>

      {/* Surah picker */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-white border border-emerald-deep/10">
        <label className="text-sm font-bold text-emerald-deep whitespace-nowrap">
          سورۃ منتخب کریں:
        </label>
        <select
          value={surahNum}
          onChange={(e) => setSurahNum(Number(e.target.value))}
          className="flex-1 bg-emerald-deep/5 border border-emerald-deep/10 rounded-lg px-3 py-2 text-emerald-deep font-medium focus:outline-none focus:border-gold-leaf"
          dir="rtl"
        >
          {SURAHS.map((s) => (
            <option key={s.n} value={s.n}>
              {s.n}. {s.nameAr} — {s.nameUr}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          <button
            onClick={() => setSurahNum((n) => Math.max(1, n - 1))}
            className="px-3 py-2 rounded-lg bg-emerald-deep/5 hover:bg-emerald-deep/10 text-emerald-deep font-bold"
            aria-label="Previous Surah"
          >
            ‹
          </button>
          <button
            onClick={() => setSurahNum((n) => Math.min(114, n + 1))}
            className="px-3 py-2 rounded-lg bg-emerald-deep/5 hover:bg-emerald-deep/10 text-emerald-deep font-bold"
            aria-label="Next Surah"
          >
            ›
          </button>
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-emerald-deep/10">
        <button
          onClick={() => setGroup("misri")}
          className={
            group === "misri"
              ? "px-1 pb-3 text-base font-bold text-emerald-deep border-b-2 border-gold-leaf -mb-px"
              : "px-1 pb-3 text-base font-medium text-emerald-deep/50 hover:text-emerald-deep transition-colors"
          }
        >
          مصری قراء <span className="text-xs opacity-60">({misriQurra.length})</span>
        </button>
        <button
          onClick={() => setGroup("kaaba")}
          className={
            group === "kaaba"
              ? "px-1 pb-3 text-base font-bold text-emerald-deep border-b-2 border-gold-leaf -mb-px ml-4"
              : "px-1 pb-3 text-base font-medium text-emerald-deep/50 hover:text-emerald-deep transition-colors ml-4"
          }
        >
          ائمہ حرمین (امام کعبہ) <span className="text-xs opacity-60">({imameKaaba.length})</span>
        </button>
      </div>

      <div
        className={
          mode === "hadr"
            ? "mb-8 p-4 rounded-xl bg-gold-leaf/5 border border-gold-leaf/20 text-sm text-emerald-deep/80"
            : "mb-8 p-4 rounded-xl bg-emerald-deep/5 border border-emerald-deep/10 text-sm text-emerald-deep/80"
        }
      >
        {mode === "hadr" ? (
          <p>
            <strong className="text-gold-leaf">حدر:</strong> روانی کے ساتھ تیز تلاوت — مکمل قرآن سننے یا روزانہ ورد کے لیے بہترین۔
          </p>
        ) : (
          <p>
            <strong className="text-emerald-deep">مشق:</strong> آہستہ تعلیمی انداز (مُعَلِّم) — صرف بعض مصری قراء (الحصری، المنشاوی، عبد الباسط) کے لیے دستیاب۔
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reciters.map((r) => (
          <ReciterCard
            key={r.id}
            r={r}
            mode={mode}
            surahNum={surahNum}
            isPlaying={playingId === `${r.id}-${mode}-${surahNum}`}
            onPlay={handlePlay}
          />
        ))}
      </div>

      {nowPlaying && playingId && (
        <div className="mt-8 p-4 rounded-2xl bg-white border border-emerald-deep/10 flex items-center gap-4 sticky bottom-4 shadow-lg">
          <div className="size-3 rounded-full bg-gold-leaf animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gold-leaf font-bold">
              Now Playing — {mode === "hadr" ? "حدر" : "مشق"}
            </p>
            <p className="font-urdu text-base truncate" dir="rtl">
              سورۃ {currentSurah.nameUr} • {nowPlaying.nameUr}
            </p>
          </div>
          <button
            onClick={() => {
              audioRef.current?.pause();
              setPlayingId(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-deep/5 hover:bg-emerald-deep hover:text-white text-emerald-deep text-sm font-bold transition-colors"
          >
            روکیں
          </button>
        </div>
      )}
    </section>
  );
}
