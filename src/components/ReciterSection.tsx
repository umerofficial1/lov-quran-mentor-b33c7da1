import { useEffect, useRef, useState } from "react";

type Reciter = {
  id: string;
  name: string;
  nameUr: string;
  origin: string;
  hadr: string;
  mashq: string;
};

const misriQurra: Reciter[] = [
  {
    id: "husary",
    name: "Mahmoud Khalil Al-Husary",
    nameUr: "محمود خلیل الحصری",
    origin: "Egypt",
    hadr: "https://server13.mp3quran.net/husr/001.mp3",
    mashq: "https://server13.mp3quran.net/husr_muallim/001.mp3",
  },
  {
    id: "minshawi",
    name: "Mohamed Siddiq El-Minshawi",
    nameUr: "محمد صدیق المنشاوی",
    origin: "Egypt",
    hadr: "https://server10.mp3quran.net/minsh/001.mp3",
    mashq: "https://server10.mp3quran.net/menshawi_teacher/001.mp3",
  },
  {
    id: "abdulbasit",
    name: "Abdul Basit Abdul Samad",
    nameUr: "عبد الباسط عبد الصمد",
    origin: "Egypt",
    hadr: "https://server7.mp3quran.net/basit/001.mp3",
    mashq: "https://server7.mp3quran.net/basit_mjwd/001.mp3",
  },
  {
    id: "mustafa",
    name: "Mustafa Ismail",
    nameUr: "مصطفیٰ اسماعیل",
    origin: "Egypt",
    hadr: "https://server14.mp3quran.net/mustafa_ismail/001.mp3",
    mashq: "https://server14.mp3quran.net/mustafa_ismail/001.mp3",
  },
  {
    id: "albanna",
    name: "Mahmoud Ali Al-Banna",
    nameUr: "محمود علی البنا",
    origin: "Egypt",
    hadr: "https://server8.mp3quran.net/banna/001.mp3",
    mashq: "https://server8.mp3quran.net/banna/001.mp3",
  },
  {
    id: "tablawi",
    name: "Mohamed Mahmoud Al-Tablawi",
    nameUr: "محمد محمود الطبلاوی",
    origin: "Egypt",
    hadr: "https://server16.mp3quran.net/tblawi/001.mp3",
    mashq: "https://server16.mp3quran.net/tblawi/001.mp3",
  },
  {
    id: "jibreel",
    name: "Mohamed Jibreel",
    nameUr: "محمد جبریل",
    origin: "Egypt",
    hadr: "https://server8.mp3quran.net/jibreel/001.mp3",
    mashq: "https://server8.mp3quran.net/jibreel/001.mp3",
  },
  {
    id: "rifai",
    name: "Hani Ar-Rifai",
    nameUr: "ہانی الرفاعی",
    origin: "Egypt",
    hadr: "https://server8.mp3quran.net/rifai/001.mp3",
    mashq: "https://server8.mp3quran.net/rifai/001.mp3",
  },
];

const imameKaaba: Reciter[] = [
  {
    id: "sudais",
    name: "Abdul Rahman Al-Sudais",
    nameUr: "عبد الرحمٰن السدیس",
    origin: "Imam, Masjid Al-Haram",
    hadr: "https://server11.mp3quran.net/sds/001.mp3",
    mashq: "https://server11.mp3quran.net/sds/001.mp3",
  },
  {
    id: "shuraim",
    name: "Saud Al-Shuraim",
    nameUr: "سعود الشریم",
    origin: "Imam, Masjid Al-Haram",
    hadr: "https://server7.mp3quran.net/shur/001.mp3",
    mashq: "https://server7.mp3quran.net/shur/001.mp3",
  },
  {
    id: "muaiqly",
    name: "Maher Al-Muaiqly",
    nameUr: "ماہر المعیقلی",
    origin: "Imam, Masjid Al-Haram",
    hadr: "https://server12.mp3quran.net/maher/001.mp3",
    mashq: "https://server12.mp3quran.net/maher/001.mp3",
  },
  {
    id: "balilah",
    name: "Bandar Balilah",
    nameUr: "بندر بلیلہ",
    origin: "Imam, Masjid Al-Haram",
    hadr: "https://server6.mp3quran.net/balilah/001.mp3",
    mashq: "https://server6.mp3quran.net/balilah/001.mp3",
  },
  {
    id: "dossari",
    name: "Yasser Al-Dosari",
    nameUr: "یاسر الدوسری",
    origin: "Imam, Masjid Al-Haram",
    hadr: "https://server11.mp3quran.net/yasser/001.mp3",
    mashq: "https://server11.mp3quran.net/yasser/001.mp3",
  },
  {
    id: "ghamdi",
    name: "Saad Al-Ghamdi",
    nameUr: "سعد الغامدی",
    origin: "Imam, Madinah",
    hadr: "https://server7.mp3quran.net/s_gmd/001.mp3",
    mashq: "https://server7.mp3quran.net/s_gmd/001.mp3",
  },
  {
    id: "ghazzawi",
    name: "Faisal Al-Ghazzawi",
    nameUr: "فیصل الغزاوی",
    origin: "Imam, Masjid Al-Haram",
    hadr: "https://server7.mp3quran.net/ghazawi/001.mp3",
    mashq: "https://server7.mp3quran.net/ghazawi/001.mp3",
  },
  {
    id: "budair",
    name: "Salah Al-Budair",
    nameUr: "صلاح البدیر",
    origin: "Imam, Masjid An-Nabawi",
    hadr: "https://server14.mp3quran.net/bsfr/001.mp3",
    mashq: "https://server14.mp3quran.net/bsfr/001.mp3",
  },
];

type Mode = "hadr" | "mashq";

function ReciterGrid({
  reciters,
  mode,
  playingId,
  onPlay,
}: {
  reciters: Reciter[];
  mode: Mode;
  playingId: string | null;
  onPlay: (r: Reciter) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {reciters.map((r) => {
        const isPlaying = playingId === `${r.id}-${mode}`;
        return (
          <article
            key={r.id}
            className="group bg-white border border-emerald-deep/10 rounded-2xl p-5 hover:border-gold-leaf/40 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-xl bg-emerald-deep/5 grid place-items-center text-emerald-deep font-arabic text-xl">
                {r.nameUr.charAt(0)}
              </div>
              <span
                className={
                  mode === "hadr"
                    ? "text-[10px] font-bold uppercase tracking-widest text-gold-leaf bg-gold-leaf/10 px-2 py-1 rounded"
                    : "text-[10px] font-bold uppercase tracking-widest text-emerald-deep bg-emerald-deep/5 px-2 py-1 rounded"
                }
              >
                {mode === "hadr" ? "حدر" : "مشق"}
              </span>
            </div>
            <p className="font-urdu text-lg text-emerald-deep mb-1 leading-tight" dir="rtl">
              {r.nameUr}
            </p>
            <p className="text-sm font-semibold text-emerald-deep/80">{r.name}</p>
            <p className="text-xs text-emerald-deep/50 mb-4">{r.origin}</p>
            <button
              onClick={() => onPlay(r)}
              className={
                isPlaying
                  ? "w-full bg-emerald-deep text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                  : "w-full bg-emerald-deep/5 text-emerald-deep py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-deep hover:text-white transition-colors"
              }
            >
              <span>{isPlaying ? "⏸" : "▶"}</span>
              <span>{isPlaying ? "روک دیں" : "سنیں — الفاتحہ"}</span>
            </button>
          </article>
        );
      })}
    </div>
  );
}

export function RecitersSection() {
  const [group, setGroup] = useState<"misri" | "kaaba">("misri");
  const [mode, setMode] = useState<Mode>("hadr");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<{ name: string; nameUr: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handlePlay = (r: Reciter) => {
    const key = `${r.id}-${mode}`;
    const src = mode === "hadr" ? r.hadr : r.mashq;

    if (playingId === key) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(src);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audioRef.current = audio;
    void audio.play().catch(() => setPlayingId(null));
    setPlayingId(key);
    setNowPlaying({ name: r.name, nameUr: r.nameUr });
  };

  const reciters = group === "misri" ? misriQurra : imameKaaba;

  return (
    <section id="reciters" className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-gold-leaf/10 text-gold-leaf text-[10px] font-bold uppercase tracking-widest mb-3">
            مشہور قراء کرام
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">قراء کی تلاوت</h2>
          <p className="text-emerald-deep/60 mt-2">
            مصری قراء اور حرمین شریفین کے ائمہ — حدر اور مشق دونوں اندازوں میں
          </p>
        </div>

        {/* Mode toggle: Hadr / Mashq */}
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

      {/* Group tabs: Misri / Kaaba */}
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

      {/* Helper note based on mode */}
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
            <strong className="text-emerald-deep">مشق:</strong> آہستہ تعلیمی انداز (مُعَلِّم) — تجوید سیکھنے اور آیت بہ آیت دہرانے کے لیے بہترین۔
          </p>
        )}
      </div>

      <ReciterGrid reciters={reciters} mode={mode} playingId={playingId} onPlay={handlePlay} />

      {nowPlaying && playingId && (
        <div className="mt-8 p-4 rounded-2xl bg-white border border-emerald-deep/10 flex items-center gap-4">
          <div className="size-3 rounded-full bg-gold-leaf animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gold-leaf font-bold">
              Now Playing — {mode === "hadr" ? "حدر" : "مشق"}
            </p>
            <p className="font-urdu text-base truncate" dir="rtl">
              سورۃ الفاتحہ • {nowPlaying.nameUr}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
