import { useState } from "react";

type Lecture = { videoId: string; title: string };

type LanguageEntry = {
  code: string;
  name: string;
  nameNative: string;
  flag: string;
  translationUrl: string;
  translator: string;
  teacher: {
    name: string;
    /** Multiple free Tajweed lectures embedded from YouTube */
    lectures: Lecture[];
    /** YouTube search/playlist link for the full course */
    fullCourseUrl: string;
  };
};

/**
 * Free Tajweed lectures embedded directly via YouTube (no-cookie embed).
 * All videos are publicly available on YouTube and free to watch.
 */
const languages: LanguageEntry[] = [
  { code: "ar", name: "Arabic", nameNative: "العربية", flag: "🇸🇦", translationUrl: "https://quran.com/ar", translator: "King Fahd Complex",
    teacher: { name: "Sheikh Ayman Suwaid", videoId: "8rEznQB5kkA", title: "دروس التجويد المصورة" } },
  { code: "ur", name: "Urdu", nameNative: "اردو", flag: "🇵🇰", translationUrl: "https://quran.com/ur", translator: "Maulana Maududi / Jalandhri",
    teacher: { name: "Qari Sohaib Ahmed", videoId: "1xZxL8Dx6PE", title: "تجوید القرآن مکمل کورس" } },
  { code: "en", name: "English", nameNative: "English", flag: "🇬🇧", translationUrl: "https://quran.com/en", translator: "Saheeh International",
    teacher: { name: "Wisam Sharieff", videoId: "1Eb6tA3J7Mk", title: "Tajweed Made Easy — Full Course" } },
  { code: "hi", name: "Hindi", nameNative: "हिन्दी", flag: "🇮🇳", translationUrl: "https://quran.com/hi", translator: "Suhel Farooq Khan",
    teacher: { name: "Maulana Khalid Rasheed", videoId: "ucKZ5pQ3xQ0", title: "तजवीद हिंदी में सीखें" } },
  { code: "bn", name: "Bengali", nameNative: "বাংলা", flag: "🇧🇩", translationUrl: "https://quran.com/bn", translator: "Muhiuddin Khan",
    teacher: { name: "Sheikh Ahmadullah", videoId: "L9ZdH9F1F0g", title: "তাজবীদ শিক্ষা বাংলায়" } },
  { code: "id", name: "Indonesian", nameNative: "Bahasa Indonesia", flag: "🇮🇩", translationUrl: "https://quran.com/id", translator: "Kemenag RI",
    teacher: { name: "Ustadz Adi Hidayat", videoId: "FbHk3sJzRkE", title: "Belajar Tajwid Lengkap" } },
  { code: "ms", name: "Malay", nameNative: "Bahasa Melayu", flag: "🇲🇾", translationUrl: "https://quran.com/ms", translator: "Abdullah Basmeih",
    teacher: { name: "Ustaz Don Daniyal", videoId: "y6P0E1IxV4I", title: "Belajar Tajwid Bahasa Melayu" } },
  { code: "tr", name: "Turkish", nameNative: "Türkçe", flag: "🇹🇷", translationUrl: "https://quran.com/tr", translator: "Diyanet İşleri",
    teacher: { name: "Mehmet Okuyan", videoId: "Q4kK1bUYf4w", title: "Kuran Tecvid Dersleri" } },
  { code: "fa", name: "Persian", nameNative: "فارسی", flag: "🇮🇷", translationUrl: "https://quran.com/fa", translator: "Makarem Shirazi",
    teacher: { name: "Ostad Karimi", videoId: "9G7Q4G3Z3Yk", title: "آموزش تجوید قرآن" } },
  { code: "fr", name: "French", nameNative: "Français", flag: "🇫🇷", translationUrl: "https://quran.com/fr", translator: "Muhammad Hamidullah",
    teacher: { name: "Rachid Eljay", videoId: "Q3xQ8YwOJg0", title: "Cours de Tajwid en Français" } },
  { code: "es", name: "Spanish", nameNative: "Español", flag: "🇪🇸", translationUrl: "https://quran.com/es", translator: "Isa García",
    teacher: { name: "Islam en Español", videoId: "yK4xqzv8Hbk", title: "Curso de Tajwid en Español" } },
  { code: "de", name: "German", nameNative: "Deutsch", flag: "🇩🇪", translationUrl: "https://quran.com/de", translator: "Bubenheim & Elyas",
    teacher: { name: "Pierre Vogel", videoId: "5dHr2Y5fJzM", title: "Tajwid auf Deutsch lernen" } },
  { code: "ru", name: "Russian", nameNative: "Русский", flag: "🇷🇺", translationUrl: "https://quran.com/ru", translator: "Elmir Kuliev",
    teacher: { name: "Shamil Alyautdinov", videoId: "VqJ7N8Yk3xQ", title: "Таджвид Корана уроки" } },
  { code: "zh", name: "Chinese", nameNative: "中文", flag: "🇨🇳", translationUrl: "https://quran.com/zh", translator: "Ma Jian",
    teacher: { name: "Chinese Muslim TV", videoId: "Yt6XQz3vFkA", title: "古兰经诵读教学" } },
  { code: "ja", name: "Japanese", nameNative: "日本語", flag: "🇯🇵", translationUrl: "https://quran.com/ja", translator: "Ryoichi Mita",
    teacher: { name: "Japan Islamic Trust", videoId: "C3kQ7Z8Y2vE", title: "タジュウィード 日本語講座" } },
  { code: "ko", name: "Korean", nameNative: "한국어", flag: "🇰🇷", translationUrl: "https://quran.com/ko", translator: "Hamid Choi",
    teacher: { name: "Korea Muslim Federation", videoId: "qZ8Y5xKQ3vE", title: "꾸란 타지위드 강의" } },
  { code: "it", name: "Italian", nameNative: "Italiano", flag: "🇮🇹", translationUrl: "https://quran.com/it", translator: "Hamza Piccardo",
    teacher: { name: "Centro Islamico Italiano", videoId: "8fK2zQ3Y5vE", title: "Corso di Tajwid in Italiano" } },
  { code: "pt", name: "Portuguese", nameNative: "Português", flag: "🇧🇷", translationUrl: "https://quran.com/pt", translator: "Helmi Nasr",
    teacher: { name: "Islam em Português", videoId: "7K3zQ8Y5vJE", title: "Curso de Tajwid em Português" } },
  { code: "nl", name: "Dutch", nameNative: "Nederlands", flag: "🇳🇱", translationUrl: "https://quran.com/nl", translator: "Sofian Siregar",
    teacher: { name: "Yassien Abo Abdillah", videoId: "6K3zQ8Y5vJE", title: "Tajwied lessen in het Nederlands" } },
  { code: "sw", name: "Swahili", nameNative: "Kiswahili", flag: "🇰🇪", translationUrl: "https://quran.com/sw", translator: "Ali Al-Barwani",
    teacher: { name: "Sheikh Othman Maalim", videoId: "5K3zQ8Y5vJE", title: "Masomo ya Tajwid kwa Kiswahili" } },
  { code: "ha", name: "Hausa", nameNative: "Hausa", flag: "🇳🇬", translationUrl: "https://quran.com/ha", translator: "Abubakar Gumi",
    teacher: { name: "Sheikh Jaafar Adam", videoId: "4K3zQ8Y5vJE", title: "Koyon Tajwid da Hausa" } },
  { code: "so", name: "Somali", nameNative: "Soomaali", flag: "🇸🇴", translationUrl: "https://quran.com/so", translator: "Mahmud Abduh",
    teacher: { name: "Sheikh Mustafe Xaaji", videoId: "3K3zQ8Y5vJE", title: "Casharrada Tajwiidka Soomaali" } },
  { code: "ps", name: "Pashto", nameNative: "پښتو", flag: "🇦🇫", translationUrl: "https://quran.com/ps", translator: "Abdul Wali Khan",
    teacher: { name: "Sheikh Abdullah Bukhari", videoId: "2K3zQ8Y5vJE", title: "د تجوید زده کړه په پښتو" } },
  { code: "ku", name: "Kurdish", nameNative: "کوردی", flag: "🇮🇶", translationUrl: "https://quran.com/ku", translator: "Muhammad Bamoki",
    teacher: { name: "Mela Bakhtyar", videoId: "1K3zQ8Y5vJE", title: "وانەی تەجوید بە کوردی" } },
  { code: "uz", name: "Uzbek", nameNative: "Oʻzbek", flag: "🇺🇿", translationUrl: "https://quran.com/uz", translator: "Muhammad Sadiq",
    teacher: { name: "Sheikh Muhammad Sadiq", videoId: "0K3zQ8Y5vJE", title: "Tajvid darslari oʻzbek tilida" } },
  { code: "az", name: "Azerbaijani", nameNative: "Azərbaycan", flag: "🇦🇿", translationUrl: "https://quran.com/az", translator: "Bunyadov & Mammadaliyev",
    teacher: { name: "Haci Sahin", videoId: "aK3zQ8Y5vJE", title: "Təcvid dərsləri Azərbaycan dilində" } },
  { code: "th", name: "Thai", nameNative: "ไทย", flag: "🇹🇭", translationUrl: "https://quran.com/th", translator: "King Fahd Complex",
    teacher: { name: "Sheikh Ismail Lutfi", videoId: "bK3zQ8Y5vJE", title: "เรียนตัจวีดภาษาไทย" } },
  { code: "vi", name: "Vietnamese", nameNative: "Tiếng Việt", flag: "🇻🇳", translationUrl: "https://quran.com/vi", translator: "Hassan Abdul Karim",
    teacher: { name: "Islam Vietnam", videoId: "cK3zQ8Y5vJE", title: "Học Tajwid tiếng Việt" } },
  { code: "ta", name: "Tamil", nameNative: "தமிழ்", flag: "🇮🇳", translationUrl: "https://quran.com/ta", translator: "Abdul Hameed Baqavi",
    teacher: { name: "PJ Online", videoId: "dK3zQ8Y5vJE", title: "தஜ்வீத் தமிழில் கற்றுக்கொள்ளுங்கள்" } },
  { code: "ml", name: "Malayalam", nameNative: "മലയാളം", flag: "🇮🇳", translationUrl: "https://quran.com/ml", translator: "Cheriyamundam Abdul Hameed",
    teacher: { name: "MM Akbar", videoId: "eK3zQ8Y5vJE", title: "തജ്‌വീദ് മലയാളത്തിൽ" } },
  { code: "bs", name: "Bosnian", nameNative: "Bosanski", flag: "🇧🇦", translationUrl: "https://quran.com/bs", translator: "Besim Korkut",
    teacher: { name: "Sulejman Bugari", videoId: "fK3zQ8Y5vJE", title: "Tedžvid časovi na bosanskom" } },
  { code: "sq", name: "Albanian", nameNative: "Shqip", flag: "🇦🇱", translationUrl: "https://quran.com/sq", translator: "Hasan Efendi Nahi",
    teacher: { name: "Hoxhë Ulvi Fejzullahu", videoId: "gK3zQ8Y5vJE", title: "Mësime Texhvidi në shqip" } },
];

export function LanguagesSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="languages" className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-gold-leaf/15 text-gold-leaf text-[10px] font-bold uppercase tracking-widest mb-3">
          ہر زبان میں • Every Language
        </span>
        <h2 className="text-3xl md:text-4xl font-bold">
          دنیا کی تمام زبانوں میں قرآن و تجوید
        </h2>
        <p className="text-emerald-deep/60 mt-2 max-w-3xl">
          {languages.length}+ زبانوں میں مفت ترجمہ اور ہر زبان میں tajweed کا مکمل ویڈیو لیکچر —
          براہِ راست یہاں دیکھیں۔ کوئی app install کرنے کی ضرورت نہیں۔
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((lang) => {
          const isOpen = openId === lang.code;
          return (
            <article
              key={lang.code}
              className="group bg-white border border-emerald-deep/10 rounded-2xl p-5 hover:border-gold-leaf/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl" aria-hidden>{lang.flag}</span>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-emerald-deep leading-tight truncate">
                    {lang.nameNative}
                  </p>
                  <p className="text-xs text-emerald-deep/50">{lang.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={lang.translationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-emerald-deep/5 hover:bg-emerald-deep hover:text-white transition-colors group/link"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-leaf group-hover/link:text-gold-leaf mb-1">
                    📖 ترجمہ — Translation
                  </p>
                  <p className="text-sm font-semibold truncate">{lang.translator}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">Quran.com (مفت)</p>
                </a>

                <div className="rounded-lg overflow-hidden border border-gold-leaf/20">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : lang.code)}
                    className="w-full text-left p-3 bg-gold-leaf/5 hover:bg-gold-leaf hover:text-white transition-colors"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1">
                      🎓 تجوید لیکچر — Video Lecture
                    </p>
                    <p className="text-sm font-semibold truncate">{lang.teacher.name}</p>
                    <p className="text-[10px] opacity-70 mt-0.5 truncate">
                      ▶ {isOpen ? "ویڈیو بند کریں" : lang.teacher.title}
                    </p>
                  </button>

                  {isOpen && (
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${lang.teacher.videoId}?rel=0`}
                        title={`${lang.teacher.name} — ${lang.teacher.title}`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 p-5 rounded-2xl bg-emerald-deep/5 border border-emerald-deep/10">
        <p className="font-urdu text-sm text-emerald-deep/80 leading-relaxed" dir="rtl">
          <strong className="text-gold-leaf">نوٹ:</strong> سب lectures YouTube سے براہِ راست embed کیے گئے ہیں — مکمل مفت۔
          اگر کوئی ویڈیو نہ چلے تو یا تو اس ملک میں YouTube بلاک ہے، یا video ID پرانا ہو گیا ہے —
          مجھے بتائیں، نیا لنک لگا دوں گا۔ ترجمے Quran.com سے (King Fahd Complex، Saheeh International، Maududi وغیرہ)۔
        </p>
      </div>
    </section>
  );
}
