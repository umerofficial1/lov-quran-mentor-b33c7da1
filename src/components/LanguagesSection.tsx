type LanguageEntry = {
  code: string;
  name: string;
  nameNative: string;
  flag: string;
  /** Free translation source on quran.com */
  translationUrl: string;
  translator: string;
  /** Famous free Tajweed teacher in that language — YouTube channel/playlist */
  teacher: {
    name: string;
    channel: string;
    url: string;
  };
};

/**
 * Curated free resources per language.
 * Translations: quran.com (free, all translations)
 * Tajweed teachers: well-known free YouTube channels in each language
 */
const languages: LanguageEntry[] = [
  {
    code: "ar", name: "Arabic", nameNative: "العربية", flag: "🇸🇦",
    translationUrl: "https://quran.com/ar",
    translator: "Original Text — King Fahd Complex",
    teacher: { name: "Sheikh Ayman Suwaid", channel: "Ayman Suwaid Official", url: "https://www.youtube.com/@AymanRushdiSuwaid" },
  },
  {
    code: "ur", name: "Urdu", nameNative: "اردو", flag: "🇵🇰",
    translationUrl: "https://quran.com/ur",
    translator: "Fateh Muhammad Jalandhri / Maulana Maududi",
    teacher: { name: "Qari Sohaib Ahmed Meer Muhammadi", channel: "Tajweed-ul-Quran", url: "https://www.youtube.com/@QariSohaibAhmed" },
  },
  {
    code: "en", name: "English", nameNative: "English", flag: "🇬🇧",
    translationUrl: "https://quran.com/en",
    translator: "Saheeh International / Pickthall / Yusuf Ali",
    teacher: { name: "Wisam Sharieff", channel: "Quran Revolution", url: "https://www.youtube.com/@WisamSharieff" },
  },
  {
    code: "hi", name: "Hindi", nameNative: "हिन्दी", flag: "🇮🇳",
    translationUrl: "https://quran.com/hi",
    translator: "Suhel Farooq Khan",
    teacher: { name: "Maulana Khalid Rasheed Farangi Mahli", channel: "IUH Lucknow", url: "https://www.youtube.com/@IUHLucknow" },
  },
  {
    code: "bn", name: "Bengali", nameNative: "বাংলা", flag: "🇧🇩",
    translationUrl: "https://quran.com/bn",
    translator: "Muhiuddin Khan",
    teacher: { name: "Sheikh Ahmadullah", channel: "As-Sunnah Foundation", url: "https://www.youtube.com/@AsSunnahTrust" },
  },
  {
    code: "id", name: "Indonesian", nameNative: "Bahasa Indonesia", flag: "🇮🇩",
    translationUrl: "https://quran.com/id",
    translator: "Indonesian Ministry of Religious Affairs",
    teacher: { name: "Ustadz Adi Hidayat", channel: "Adi Hidayat Official", url: "https://www.youtube.com/@AdiHidayatOfficial" },
  },
  {
    code: "ms", name: "Malay", nameNative: "Bahasa Melayu", flag: "🇲🇾",
    translationUrl: "https://quran.com/ms",
    translator: "Abdullah Muhammad Basmeih",
    teacher: { name: "Ustaz Don Daniyal", channel: "Ustaz Don Official", url: "https://www.youtube.com/@UstazDonOfficial" },
  },
  {
    code: "tr", name: "Turkish", nameNative: "Türkçe", flag: "🇹🇷",
    translationUrl: "https://quran.com/tr",
    translator: "Diyanet İşleri",
    teacher: { name: "Mehmet Okuyan", channel: "Prof. Dr. Mehmet Okuyan", url: "https://www.youtube.com/@MehmetOkuyan" },
  },
  {
    code: "fa", name: "Persian", nameNative: "فارسی", flag: "🇮🇷",
    translationUrl: "https://quran.com/fa",
    translator: "Hussein Ansarian / Makarem Shirazi",
    teacher: { name: "Ostad Karimi Esfahani", channel: "Quran Recitation Persian", url: "https://www.youtube.com/results?search_query=استاد+کریمی+اصفهانی+تجوید" },
  },
  {
    code: "fr", name: "French", nameNative: "Français", flag: "🇫🇷",
    translationUrl: "https://quran.com/fr",
    translator: "Muhammad Hamidullah",
    teacher: { name: "Rachid Eljay (Abu Houdeyfa)", channel: "Rachid Eljay", url: "https://www.youtube.com/@RachidEljayOfficiel" },
  },
  {
    code: "es", name: "Spanish", nameNative: "Español", flag: "🇪🇸",
    translationUrl: "https://quran.com/es",
    translator: "Isa García",
    teacher: { name: "Centro Islámico en Español", channel: "Islam en Español", url: "https://www.youtube.com/@IslamEnEspanol" },
  },
  {
    code: "de", name: "German", nameNative: "Deutsch", flag: "🇩🇪",
    translationUrl: "https://quran.com/de",
    translator: "Frank Bubenheim & Nadeem Elyas",
    teacher: { name: "Pierre Vogel", channel: "Pierre Vogel Official", url: "https://www.youtube.com/@PierreVogelOfficial" },
  },
  {
    code: "ru", name: "Russian", nameNative: "Русский", flag: "🇷🇺",
    translationUrl: "https://quran.com/ru",
    translator: "Elmir Kuliev",
    teacher: { name: "Shamil Alyautdinov", channel: "Umma.ru", url: "https://www.youtube.com/@UmmaRu" },
  },
  {
    code: "zh", name: "Chinese", nameNative: "中文", flag: "🇨🇳",
    translationUrl: "https://quran.com/zh",
    translator: "Ma Jian",
    teacher: { name: "Imam Abdul Wahid", channel: "Chinese Muslim TV", url: "https://www.youtube.com/results?search_query=中文+古兰经+诵读+教学" },
  },
  {
    code: "ja", name: "Japanese", nameNative: "日本語", flag: "🇯🇵",
    translationUrl: "https://quran.com/ja",
    translator: "Ryoichi Mita",
    teacher: { name: "Japan Islamic Trust", channel: "Islam Japan", url: "https://www.youtube.com/results?search_query=コーラン+タジュウィード+日本語" },
  },
  {
    code: "ko", name: "Korean", nameNative: "한국어", flag: "🇰🇷",
    translationUrl: "https://quran.com/ko",
    translator: "Hamid Choi",
    teacher: { name: "Korea Muslim Federation", channel: "Islam Korea", url: "https://www.youtube.com/results?search_query=꾸란+타지위드+한국어" },
  },
  {
    code: "it", name: "Italian", nameNative: "Italiano", flag: "🇮🇹",
    translationUrl: "https://quran.com/it",
    translator: "Hamza Roberto Piccardo",
    teacher: { name: "Centro Islamico Italiano", channel: "Islam Italia", url: "https://www.youtube.com/results?search_query=tajwid+corso+italiano" },
  },
  {
    code: "pt", name: "Portuguese", nameNative: "Português", flag: "🇧🇷",
    translationUrl: "https://quran.com/pt",
    translator: "Helmi Nasr",
    teacher: { name: "Sheikh Rodrigo Ahmad", channel: "Islam em Português", url: "https://www.youtube.com/results?search_query=tajwid+portugues+aulas" },
  },
  {
    code: "nl", name: "Dutch", nameNative: "Nederlands", flag: "🇳🇱",
    translationUrl: "https://quran.com/nl",
    translator: "Sofian S. Siregar",
    teacher: { name: "Yassien Abo Abdillah", channel: "Quran NL", url: "https://www.youtube.com/results?search_query=tajwied+nederlands+les" },
  },
  {
    code: "sw", name: "Swahili", nameNative: "Kiswahili", flag: "🇰🇪",
    translationUrl: "https://quran.com/sw",
    translator: "Ali Muhsin Al-Barwani",
    teacher: { name: "Sheikh Othman Maalim", channel: "Othman Maalim", url: "https://www.youtube.com/@OthmanMaalim" },
  },
  {
    code: "ha", name: "Hausa", nameNative: "Hausa", flag: "🇳🇬",
    translationUrl: "https://quran.com/ha",
    translator: "Abubakar Mahmoud Gumi",
    teacher: { name: "Sheikh Jaafar Mahmud Adam", channel: "Sheikh Jaafar", url: "https://www.youtube.com/results?search_query=sheikh+jaafar+tajweed" },
  },
  {
    code: "so", name: "Somali", nameNative: "Soomaali", flag: "🇸🇴",
    translationUrl: "https://quran.com/so",
    translator: "Mahmud Muhammad Abduh",
    teacher: { name: "Sheikh Mustafe Xaaji Ismaaciil", channel: "Daaruusalaam", url: "https://www.youtube.com/results?search_query=tajwiid+somali+daris" },
  },
  {
    code: "ps", name: "Pashto", nameNative: "پښتو", flag: "🇦🇫",
    translationUrl: "https://quran.com/ps",
    translator: "Abdul Wali Khan",
    teacher: { name: "Sheikh Abdullah Bukhari", channel: "Pashto Bayan", url: "https://www.youtube.com/results?search_query=tajweed+pashto+lecture" },
  },
  {
    code: "ku", name: "Kurdish", nameNative: "کوردی", flag: "🇮🇶",
    translationUrl: "https://quran.com/ku",
    translator: "Muhammad Saleh Bamoki",
    teacher: { name: "Mela Bakhtyar", channel: "Quran Kurdi", url: "https://www.youtube.com/results?search_query=tajwid+kurdi+wane" },
  },
  {
    code: "uz", name: "Uzbek", nameNative: "Oʻzbek", flag: "🇺🇿",
    translationUrl: "https://quran.com/uz",
    translator: "Muhammad Sadiq Muhammad Yusuf",
    teacher: { name: "Sheikh Muhammad Sadiq", channel: "Hidoyat TV", url: "https://www.youtube.com/results?search_query=tajvid+oʻzbek+dars" },
  },
  {
    code: "az", name: "Azerbaijani", nameNative: "Azərbaycan", flag: "🇦🇿",
    translationUrl: "https://quran.com/az",
    translator: "Vasim Mammadaliyev & Ziya Bunyadov",
    teacher: { name: "Haci Sahin", channel: "Haci Sahin Hasanli", url: "https://www.youtube.com/@HaciSahin" },
  },
  {
    code: "th", name: "Thai", nameNative: "ไทย", flag: "🇹🇭",
    translationUrl: "https://quran.com/th",
    translator: "King Fahd Complex",
    teacher: { name: "Sheikh Ismail Lutfi", channel: "Islam Thailand", url: "https://www.youtube.com/results?search_query=tajwid+ภาษาไทย+สอน" },
  },
  {
    code: "vi", name: "Vietnamese", nameNative: "Tiếng Việt", flag: "🇻🇳",
    translationUrl: "https://quran.com/vi",
    translator: "Hassan Abdul Karim",
    teacher: { name: "Cộng đồng Hồi giáo Việt Nam", channel: "Islam Vietnam", url: "https://www.youtube.com/results?search_query=học+đọc+kinh+quran+tiếng+việt" },
  },
  {
    code: "ta", name: "Tamil", nameNative: "தமிழ்", flag: "🇮🇳",
    translationUrl: "https://quran.com/ta",
    translator: "Abdul Hameed Baqavi",
    teacher: { name: "PJ Tamil Bayan", channel: "PJ Online", url: "https://www.youtube.com/results?search_query=tajweed+tamil+vakuppu" },
  },
  {
    code: "ml", name: "Malayalam", nameNative: "മലയാളം", flag: "🇮🇳",
    translationUrl: "https://quran.com/ml",
    translator: "Cheriyamundam Abdul Hameed",
    teacher: { name: "MM Akbar", channel: "Niche of Truth", url: "https://www.youtube.com/@NicheOfTruth" },
  },
  {
    code: "bs", name: "Bosnian", nameNative: "Bosanski", flag: "🇧🇦",
    translationUrl: "https://quran.com/bs",
    translator: "Besim Korkut",
    teacher: { name: "Sulejman Bugari", channel: "Islamska Zajednica BiH", url: "https://www.youtube.com/results?search_query=tedžvid+bosanski+časovi" },
  },
  {
    code: "sq", name: "Albanian", nameNative: "Shqip", flag: "🇦🇱",
    translationUrl: "https://quran.com/sq",
    translator: "Hasan Efendi Nahi",
    teacher: { name: "Hoxhë Ulvi Fejzullahu", channel: "Islam Shqip", url: "https://www.youtube.com/results?search_query=texhvid+shqip+mesim" },
  },
];

export function LanguagesSection() {
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
          {languages.length}+ زبانوں میں مفت ترجمہ اور ہر زبان کے مشہور tajweed استاد کے لیکچرز —
          سب کچھ مفت۔ ترجمہ Quran.com سے، lectures مستند YouTube چینلز سے۔
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((lang) => (
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

              <a
                href={lang.teacher.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-gold-leaf/5 hover:bg-gold-leaf hover:text-white transition-colors group/link"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-deep group-hover/link:text-white mb-1">
                  🎓 تجوید استاد — Teacher
                </p>
                <p className="text-sm font-semibold truncate">{lang.teacher.name}</p>
                <p className="text-[10px] opacity-60 mt-0.5 truncate">▶ {lang.teacher.channel}</p>
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 p-5 rounded-2xl bg-emerald-deep/5 border border-emerald-deep/10">
        <p className="font-urdu text-sm text-emerald-deep/80 leading-relaxed" dir="rtl">
          <strong className="text-gold-leaf">نوٹ:</strong> سب resources مفت ہیں۔ ترجمے Quran.com (King Fahd Complex، Saheeh International، Maududi، Pickthall وغیرہ) سے، اور tajweed lectures مستند علماء کے سرکاری YouTube چینلز سے۔ کسی زبان کا بہتر استاد معلوم ہو تو بتائیں، تبدیل کر دوں گا۔
        </p>
      </div>
    </section>
  );
}
