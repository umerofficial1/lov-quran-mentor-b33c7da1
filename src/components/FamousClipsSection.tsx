import { useEffect, useRef, useState } from "react";

type Clip = {
  id: string;
  reciter: string;
  reciterUr: string;
  title: string;
  titleUr: string;
  note: string;
  src: string;
  badge?: string;
};

/**
 * Hand-picked iconic recitations from the great Misri Qurra.
 * URLs come from mp3quran.net's mujawwad/teaching servers — full surah
 * recitations, well known across the Muslim world.
 */
const famousClips: Clip[] = [
  {
    id: "basit-ibrahim",
    reciter: "Abdul Basit Abdul Samad",
    reciterUr: "عبد الباسط عبد الصمد",
    title: "Surah Ibrahim (Mujawwad)",
    titleUr: "سورۃ ابراہیم — مجوّد",
    note: "تاریخی تلاوت — 'صوت الذہب' کا شاہکار",
    src: "https://server7.mp3quran.net/basit_mjwd/014.mp3",
    badge: "ICONIC",
  },
  {
    id: "basit-tahrim",
    reciter: "Abdul Basit Abdul Samad",
    reciterUr: "عبد الباسط عبد الصمد",
    title: "Surah At-Tahrim (Mujawwad)",
    titleUr: "سورۃ التحریم — مجوّد",
    note: "مشہور ترین تلاوتوں میں سے ایک",
    src: "https://server7.mp3quran.net/basit_mjwd/066.mp3",
  },
  {
    id: "basit-fajr",
    reciter: "Abdul Basit Abdul Samad",
    reciterUr: "عبد الباسط عبد الصمد",
    title: "Surah Al-Fajr (Mujawwad)",
    titleUr: "سورۃ الفجر — مجوّد",
    note: "روحانی کیفیت سے بھرپور",
    src: "https://server7.mp3quran.net/basit_mjwd/089.mp3",
  },
  {
    id: "minshawi-hashr",
    reciter: "Mohamed Siddiq El-Minshawi",
    reciterUr: "محمد صدیق المنشاوی",
    title: "Surah Al-Hashr (Mu'allim)",
    titleUr: "سورۃ الحشر — مُعَلِّم",
    note: "آیاتِ آخر کی روح ہلا دینے والی تلاوت",
    src: "https://server10.mp3quran.net/menshawi_teacher/059.mp3",
    badge: "FAMOUS",
  },
  {
    id: "minshawi-rahman",
    reciter: "Mohamed Siddiq El-Minshawi",
    reciterUr: "محمد صدیق المنشاوی",
    title: "Surah Ar-Rahman",
    titleUr: "سورۃ الرحمٰن",
    note: "خشوع کا اعلیٰ نمونہ",
    src: "https://server10.mp3quran.net/minsh/055.mp3",
  },
  {
    id: "minshawi-qiyamah",
    reciter: "Mohamed Siddiq El-Minshawi",
    reciterUr: "محمد صدیق المنشاوی",
    title: "Surah Al-Qiyamah",
    titleUr: "سورۃ القیامہ",
    note: "دل کو جھنجھوڑ دینے والی تلاوت",
    src: "https://server10.mp3quran.net/minsh/075.mp3",
  },
  {
    id: "husary-baqarah",
    reciter: "Mahmoud Khalil Al-Husary",
    reciterUr: "محمود خلیل الحصری",
    title: "Surah Al-Baqarah (Mu'allim)",
    titleUr: "سورۃ البقرہ — مُعَلِّم",
    note: "تجوید سیکھنے کے لیے بہترین معیار",
    src: "https://server13.mp3quran.net/husr_muallim/002.mp3",
    badge: "TEACHING",
  },
  {
    id: "husary-yaseen",
    reciter: "Mahmoud Khalil Al-Husary",
    reciterUr: "محمود خلیل الحصری",
    title: "Surah Yaseen",
    titleUr: "سورۃ یٰسٓ",
    note: "صاف، واضح اور ترتیل کا معیار",
    src: "https://server13.mp3quran.net/husr/036.mp3",
  },
  {
    id: "mustafa-hud",
    reciter: "Mustafa Ismail",
    reciterUr: "مصطفیٰ اسماعیل",
    title: "Surah Hud",
    titleUr: "سورۃ ہود",
    note: "مقامات کے بے مثل استاد کی تلاوت",
    src: "https://server14.mp3quran.net/mustafa_ismail/011.mp3",
    badge: "MAQAMAT",
  },
  {
    id: "mustafa-najm",
    reciter: "Mustafa Ismail",
    reciterUr: "مصطفیٰ اسماعیل",
    title: "Surah An-Najm",
    titleUr: "سورۃ النجم",
    note: "تاریخی ریکارڈنگ",
    src: "https://server14.mp3quran.net/mustafa_ismail/053.mp3",
  },
  {
    id: "banna-kahf",
    reciter: "Mahmoud Ali Al-Banna",
    reciterUr: "محمود علی البنا",
    title: "Surah Al-Kahf",
    titleUr: "سورۃ الکہف",
    note: "جمعہ کے دن کے لیے مشہور",
    src: "https://server8.mp3quran.net/banna/018.mp3",
  },
  {
    id: "tablawi-mulk",
    reciter: "Mohamed Mahmoud Al-Tablawi",
    reciterUr: "محمد محمود الطبلاوی",
    title: "Surah Al-Mulk",
    titleUr: "سورۃ الملک",
    note: "روزانہ ورد کی محبوب تلاوت",
    src: "https://server16.mp3quran.net/tblawi/067.mp3",
  },
  {
    id: "jibreel-waqiah",
    reciter: "Mohamed Jibreel",
    reciterUr: "محمد جبریل",
    title: "Surah Al-Waqi'ah",
    titleUr: "سورۃ الواقعہ",
    note: "ترویحات میں مشہور انداز",
    src: "https://server8.mp3quran.net/jibreel/056.mp3",
  },
  {
    id: "rifai-sajdah",
    reciter: "Hani Ar-Rifai",
    reciterUr: "ہانی الرفاعی",
    title: "Surah As-Sajdah",
    titleUr: "سورۃ السجدہ",
    note: "نرم، خشوع آمیز آواز",
    src: "https://server8.mp3quran.net/rifai/032.mp3",
  },
];

export function FamousClipsSection() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  const handlePlay = (clip: Clip) => {
    if (playingId === clip.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(clip.src);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audioRef.current = audio;
    void audio.play().catch(() => setPlayingId(null));
    setPlayingId(clip.id);
  };

  return (
    <section id="famous-clips" className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-gold-leaf/15 text-gold-leaf text-[10px] font-bold uppercase tracking-widest mb-3">
          مشہور ترین تلاوات • Iconic Clips
        </span>
        <h2 className="text-3xl md:text-4xl font-bold">مصری قراء کی شہرہ آفاق تلاوتیں</h2>
        <p className="text-emerald-deep/60 mt-2">
          عبد الباسط، المنشاوی، الحصری، مصطفیٰ اسماعیل اور دیگر اساتذہ کی وہ تلاوتیں جنہوں نے دنیا کو متاثر کیا
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {famousClips.map((clip) => {
          const isPlaying = playingId === clip.id;
          return (
            <article
              key={clip.id}
              className={
                isPlaying
                  ? "relative bg-emerald-deep text-white rounded-2xl p-5 border border-gold-leaf shadow-lg transition-all"
                  : "relative bg-white text-emerald-deep rounded-2xl p-5 border border-emerald-deep/10 hover:border-gold-leaf/40 hover:shadow-md transition-all"
              }
            >
              {clip.badge && (
                <span className="absolute -top-2 right-4 text-[9px] font-bold tracking-widest bg-gold-leaf text-white px-2 py-0.5 rounded">
                  {clip.badge}
                </span>
              )}
              <p
                className={
                  isPlaying
                    ? "font-urdu text-lg leading-tight mb-1 text-white"
                    : "font-urdu text-lg leading-tight mb-1 text-emerald-deep"
                }
                dir="rtl"
              >
                {clip.titleUr}
              </p>
              <p
                className={
                  isPlaying ? "text-xs opacity-80 mb-3" : "text-xs text-emerald-deep/60 mb-3"
                }
              >
                {clip.title}
              </p>
              <div
                className={
                  isPlaying
                    ? "border-t border-white/20 pt-3 mb-4"
                    : "border-t border-emerald-deep/10 pt-3 mb-4"
                }
              >
                <p
                  className={isPlaying ? "font-urdu text-sm mb-1" : "font-urdu text-sm text-emerald-deep mb-1"}
                  dir="rtl"
                >
                  {clip.reciterUr}
                </p>
                <p
                  className={
                    isPlaying ? "text-[11px] opacity-70" : "text-[11px] text-emerald-deep/50"
                  }
                >
                  {clip.reciter}
                </p>
              </div>
              <p
                className={
                  isPlaying
                    ? "font-urdu text-xs opacity-90 mb-4 leading-relaxed"
                    : "font-urdu text-xs text-emerald-deep/70 mb-4 leading-relaxed"
                }
                dir="rtl"
              >
                {clip.note}
              </p>
              <button
                onClick={() => handlePlay(clip)}
                className={
                  isPlaying
                    ? "w-full bg-gold-leaf text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                    : "w-full bg-emerald-deep/5 text-emerald-deep py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-deep hover:text-white transition-colors"
                }
              >
                <span>{isPlaying ? "⏸" : "▶"}</span>
                <span>{isPlaying ? "روک دیں" : "سنیں"}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
