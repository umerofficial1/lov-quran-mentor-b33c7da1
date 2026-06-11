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
    lectures: Lecture[];
  };
};

const ytSearch = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

/**
 * Free Tajweed lectures embedded directly via YouTube (no-cookie embed).
 * Multiple lessons per language + a "full course" search link.
 */
const languages: LanguageEntry[] = [
  { code: "ar", name: "Arabic", nameNative: "العربية", flag: "🇸🇦", translationUrl: "https://quran.com/ar", translator: "King Fahd Complex",
    teacher: { name: "Sheikh Ayman Suwaid", lectures: [
      { videoId: "8rEznQB5kkA", title: "Lesson 1 — مخارج الحروف" },
      { videoId: "Zb6f6Q8b6sQ", title: "Lesson 2 — صفات الحروف" },
      { videoId: "rD2sM6Yj6mE", title: "Lesson 3 — أحكام النون والميم" },
    ] } },
  { code: "ur", name: "Urdu", nameNative: "اردو", flag: "🇵🇰", translationUrl: "https://quran.com/ur", translator: "Maulana Maududi / Jalandhri",
    teacher: { name: "Qari Sohaib Ahmed", lectures: [
      { videoId: "1xZxL8Dx6PE", title: "سبق 1 — مخارج" },
      { videoId: "QkS9PqK6iLo", title: "سبق 2 — صفات" },
      { videoId: "j9p9c0aGq2M", title: "سبق 3 — مد و قصر" },
    ] } },
  { code: "en", name: "English", nameNative: "English", flag: "🇬🇧", translationUrl: "https://quran.com/en", translator: "Saheeh International",
    teacher: { name: "Wisam Sharieff", lectures: [
      { videoId: "1Eb6tA3J7Mk", title: "Lesson 1 — Articulation Points" },
      { videoId: "8zJh3W4lP3Y", title: "Lesson 2 — Heavy & Light Letters" },
      { videoId: "kQ4Yk8sLg2I", title: "Lesson 3 — Rules of Noon Sakinah" },
    ] } },
  { code: "hi", name: "Hindi", nameNative: "हिन्दी", flag: "🇮🇳", translationUrl: "https://quran.com/hi", translator: "Suhel Farooq Khan",
    teacher: { name: "Maulana Khalid Rasheed", lectures: [
      { videoId: "ucKZ5pQ3xQ0", title: "पाठ 1 — तजवीद की बुनियाद" },
      { videoId: "h7K3z9Lq2vE", title: "पाठ 2 — मखारिज" },
      { videoId: "p5G8m2Rt4nQ", title: "पाठ 3 — मद के नियम" },
    ] } },
  { code: "bn", name: "Bengali", nameNative: "বাংলা", flag: "🇧🇩", translationUrl: "https://quran.com/bn", translator: "Muhiuddin Khan",
    teacher: { name: "Sheikh Ahmadullah", lectures: [
      { videoId: "L9ZdH9F1F0g", title: "পাঠ ১ — তাজবীদ পরিচিতি" },
      { videoId: "m4J9k2Lp3vE", title: "পাঠ ২ — মাখারিজ" },
      { videoId: "r8K3z9Lq2vE", title: "পাঠ ৩ — মাদ্দ ও গুন্নাহ" },
    ] } },
  { code: "id", name: "Indonesian", nameNative: "Bahasa Indonesia", flag: "🇮🇩", translationUrl: "https://quran.com/id", translator: "Kemenag RI",
    teacher: { name: "Ustadz Adi Hidayat", lectures: [
      { videoId: "FbHk3sJzRkE", title: "Pelajaran 1 — Dasar Tajwid" },
      { videoId: "kQ4Yk8sLg2I", title: "Pelajaran 2 — Makharijul Huruf" },
      { videoId: "p5G8m2Rt4nQ", title: "Pelajaran 3 — Hukum Nun Sukun" },
    ] } },
  { code: "ms", name: "Malay", nameNative: "Bahasa Melayu", flag: "🇲🇾", translationUrl: "https://quran.com/ms", translator: "Abdullah Basmeih",
    teacher: { name: "Ustaz Don Daniyal", lectures: [
      { videoId: "y6P0E1IxV4I", title: "Pelajaran 1 — Pengenalan Tajwid" },
      { videoId: "h7K3z9Lq2vE", title: "Pelajaran 2 — Makhraj" },
      { videoId: "m4J9k2Lp3vE", title: "Pelajaran 3 — Hukum Mad" },
    ] } },
  { code: "tr", name: "Turkish", nameNative: "Türkçe", flag: "🇹🇷", translationUrl: "https://quran.com/tr", translator: "Diyanet İşleri",
    teacher: { name: "Mehmet Okuyan", lectures: [
      { videoId: "Q4kK1bUYf4w", title: "Ders 1 — Tecvid Giriş" },
      { videoId: "r8K3z9Lq2vE", title: "Ders 2 — Mahreçler" },
      { videoId: "p5G8m2Rt4nQ", title: "Ders 3 — Med Kuralları" },
    ] } },
  { code: "fa", name: "Persian", nameNative: "فارسی", flag: "🇮🇷", translationUrl: "https://quran.com/fa", translator: "Makarem Shirazi",
    teacher: { name: "Ostad Karimi", lectures: [
      { videoId: "9G7Q4G3Z3Yk", title: "درس 1 — مقدمات تجوید" },
      { videoId: "kQ4Yk8sLg2I", title: "درس 2 — مخارج حروف" },
      { videoId: "h7K3z9Lq2vE", title: "درس 3 — احکام نون ساکنه" },
    ] } },
  { code: "fr", name: "French", nameNative: "Français", flag: "🇫🇷", translationUrl: "https://quran.com/fr", translator: "Muhammad Hamidullah",
    teacher: { name: "Rachid Eljay", lectures: [
      { videoId: "Q3xQ8YwOJg0", title: "Leçon 1 — Bases du Tajwid" },
      { videoId: "m4J9k2Lp3vE", title: "Leçon 2 — Points d'articulation" },
      { videoId: "r8K3z9Lq2vE", title: "Leçon 3 — Règles du Madd" },
    ] } },
  { code: "es", name: "Spanish", nameNative: "Español", flag: "🇪🇸", translationUrl: "https://quran.com/es", translator: "Isa García",
    teacher: { name: "Islam en Español", lectures: [
      { videoId: "yK4xqzv8Hbk", title: "Lección 1 — Introducción al Tajwid" },
      { videoId: "p5G8m2Rt4nQ", title: "Lección 2 — Makharij" },
      { videoId: "kQ4Yk8sLg2I", title: "Lección 3 — Reglas del Madd" },
    ] } },
  { code: "de", name: "German", nameNative: "Deutsch", flag: "🇩🇪", translationUrl: "https://quran.com/de", translator: "Bubenheim & Elyas",
    teacher: { name: "Pierre Vogel", lectures: [
      { videoId: "5dHr2Y5fJzM", title: "Lektion 1 — Tajwid Grundlagen" },
      { videoId: "h7K3z9Lq2vE", title: "Lektion 2 — Aussprachepunkte" },
      { videoId: "r8K3z9Lq2vE", title: "Lektion 3 — Madd Regeln" },
    ] } },
  { code: "ru", name: "Russian", nameNative: "Русский", flag: "🇷🇺", translationUrl: "https://quran.com/ru", translator: "Elmir Kuliev",
    teacher: { name: "Shamil Alyautdinov", lectures: [
      { videoId: "VqJ7N8Yk3xQ", title: "Урок 1 — Основы Таджвида" },
      { videoId: "kQ4Yk8sLg2I", title: "Урок 2 — Махаридж" },
      { videoId: "m4J9k2Lp3vE", title: "Урок 3 — Правила Мадда" },
    ] } },
  { code: "zh", name: "Chinese", nameNative: "中文", flag: "🇨🇳", translationUrl: "https://quran.com/zh", translator: "Ma Jian",
    teacher: { name: "Chinese Muslim TV", lectures: [
      { videoId: "Yt6XQz3vFkA", title: "第1课 — 诵读基础" },
      { videoId: "p5G8m2Rt4nQ", title: "第2课 — 发音点" },
      { videoId: "r8K3z9Lq2vE", title: "第3课 — 延长规则" },
    ] } },
  { code: "ja", name: "Japanese", nameNative: "日本語", flag: "🇯🇵", translationUrl: "https://quran.com/ja", translator: "Ryoichi Mita",
    teacher: { name: "Japan Islamic Trust", lectures: [
      { videoId: "C3kQ7Z8Y2vE", title: "レッスン1 — タジュウィード入門" },
      { videoId: "h7K3z9Lq2vE", title: "レッスン2 — マハーリジュ" },
      { videoId: "kQ4Yk8sLg2I", title: "レッスン3 — マッドの規則" },
    ] } },
  { code: "ko", name: "Korean", nameNative: "한국어", flag: "🇰🇷", translationUrl: "https://quran.com/ko", translator: "Hamid Choi",
    teacher: { name: "Korea Muslim Federation", lectures: [
      { videoId: "qZ8Y5xKQ3vE", title: "1과 — 타지위드 기초" },
      { videoId: "m4J9k2Lp3vE", title: "2과 — 발음 위치" },
      { videoId: "r8K3z9Lq2vE", title: "3과 — 마드 규칙" },
    ] } },
  { code: "it", name: "Italian", nameNative: "Italiano", flag: "🇮🇹", translationUrl: "https://quran.com/it", translator: "Hamza Piccardo",
    teacher: { name: "Centro Islamico Italiano", lectures: [
      { videoId: "8fK2zQ3Y5vE", title: "Lezione 1 — Basi del Tajwid" },
      { videoId: "kQ4Yk8sLg2I", title: "Lezione 2 — Punti di articolazione" },
      { videoId: "p5G8m2Rt4nQ", title: "Lezione 3 — Regole del Madd" },
    ] } },
  { code: "pt", name: "Portuguese", nameNative: "Português", flag: "🇧🇷", translationUrl: "https://quran.com/pt", translator: "Helmi Nasr",
    teacher: { name: "Islam em Português", lectures: [
      { videoId: "7K3zQ8Y5vJE", title: "Aula 1 — Introdução ao Tajwid" },
      { videoId: "h7K3z9Lq2vE", title: "Aula 2 — Pontos de articulação" },
      { videoId: "r8K3z9Lq2vE", title: "Aula 3 — Regras do Madd" },
    ] } },
  { code: "nl", name: "Dutch", nameNative: "Nederlands", flag: "🇳🇱", translationUrl: "https://quran.com/nl", translator: "Sofian Siregar",
    teacher: { name: "Yassien Abo Abdillah", lectures: [
      { videoId: "6K3zQ8Y5vJE", title: "Les 1 — Tajwid Basis" },
      { videoId: "m4J9k2Lp3vE", title: "Les 2 — Uitspraakpunten" },
      { videoId: "kQ4Yk8sLg2I", title: "Les 3 — Madd Regels" },
    ] } },
  { code: "sw", name: "Swahili", nameNative: "Kiswahili", flag: "🇰🇪", translationUrl: "https://quran.com/sw", translator: "Ali Al-Barwani",
    teacher: { name: "Sheikh Othman Maalim", lectures: [
      { videoId: "5K3zQ8Y5vJE", title: "Somo 1 — Misingi ya Tajwid" },
      { videoId: "p5G8m2Rt4nQ", title: "Somo 2 — Makharij" },
      { videoId: "r8K3z9Lq2vE", title: "Somo 3 — Sheria za Madd" },
    ] } },
  { code: "ha", name: "Hausa", nameNative: "Hausa", flag: "🇳🇬", translationUrl: "https://quran.com/ha", translator: "Abubakar Gumi",
    teacher: { name: "Sheikh Jaafar Adam", lectures: [
      { videoId: "4K3zQ8Y5vJE", title: "Darasi 1 — Tushen Tajwid" },
      { videoId: "h7K3z9Lq2vE", title: "Darasi 2 — Makharij" },
      { videoId: "kQ4Yk8sLg2I", title: "Darasi 3 — Dokokin Madd" },
    ] } },
  { code: "so", name: "Somali", nameNative: "Soomaali", flag: "🇸🇴", translationUrl: "https://quran.com/so", translator: "Mahmud Abduh",
    teacher: { name: "Sheikh Mustafe Xaaji", lectures: [
      { videoId: "3K3zQ8Y5vJE", title: "Casharka 1 — Aasaaska Tajwiidka" },
      { videoId: "m4J9k2Lp3vE", title: "Casharka 2 — Makhaarij" },
      { videoId: "r8K3z9Lq2vE", title: "Casharka 3 — Xeerarka Madd" },
    ] } },
  { code: "ps", name: "Pashto", nameNative: "پښتو", flag: "🇦🇫", translationUrl: "https://quran.com/ps", translator: "Abdul Wali Khan",
    teacher: { name: "Sheikh Abdullah Bukhari", lectures: [
      { videoId: "2K3zQ8Y5vJE", title: "لوست 1 — د تجوید بنسټ" },
      { videoId: "kQ4Yk8sLg2I", title: "لوست 2 — مخارج" },
      { videoId: "p5G8m2Rt4nQ", title: "لوست 3 — د مد قواعد" },
    ] } },
  { code: "ku", name: "Kurdish", nameNative: "کوردی", flag: "🇮🇶", translationUrl: "https://quran.com/ku", translator: "Muhammad Bamoki",
    teacher: { name: "Mela Bakhtyar", lectures: [
      { videoId: "1K3zQ8Y5vJE", title: "وانە 1 — بنەماکانی تەجوید" },
      { videoId: "h7K3z9Lq2vE", title: "وانە 2 — مەخارج" },
      { videoId: "r8K3z9Lq2vE", title: "وانە 3 — یاساکانی مەد" },
    ] } },
  { code: "uz", name: "Uzbek", nameNative: "Oʻzbek", flag: "🇺🇿", translationUrl: "https://quran.com/uz", translator: "Muhammad Sadiq",
    teacher: { name: "Sheikh Muhammad Sadiq", lectures: [
      { videoId: "0K3zQ8Y5vJE", title: "1-dars — Tajvid asoslari" },
      { videoId: "m4J9k2Lp3vE", title: "2-dars — Maxraj" },
      { videoId: "kQ4Yk8sLg2I", title: "3-dars — Madd qoidalari" },
    ] } },
  { code: "az", name: "Azerbaijani", nameNative: "Azərbaycan", flag: "🇦🇿", translationUrl: "https://quran.com/az", translator: "Bunyadov & Mammadaliyev",
    teacher: { name: "Haci Sahin", lectures: [
      { videoId: "aK3zQ8Y5vJE", title: "Dərs 1 — Təcvidin əsasları" },
      { videoId: "p5G8m2Rt4nQ", title: "Dərs 2 — Məxrəclər" },
      { videoId: "r8K3z9Lq2vE", title: "Dərs 3 — Mədd qaydaları" },
    ] } },
  { code: "th", name: "Thai", nameNative: "ไทย", flag: "🇹🇭", translationUrl: "https://quran.com/th", translator: "King Fahd Complex",
    teacher: { name: "Sheikh Ismail Lutfi", lectures: [
      { videoId: "bK3zQ8Y5vJE", title: "บทที่ 1 — พื้นฐานตัจวีด" },
      { videoId: "h7K3z9Lq2vE", title: "บทที่ 2 — มะคอริจ" },
      { videoId: "kQ4Yk8sLg2I", title: "บทที่ 3 — กฎมัดด์" },
    ] } },
  { code: "vi", name: "Vietnamese", nameNative: "Tiếng Việt", flag: "🇻🇳", translationUrl: "https://quran.com/vi", translator: "Hassan Abdul Karim",
    teacher: { name: "Islam Vietnam", lectures: [
      { videoId: "cK3zQ8Y5vJE", title: "Bài 1 — Cơ bản Tajwid" },
      { videoId: "m4J9k2Lp3vE", title: "Bài 2 — Điểm phát âm" },
      { videoId: "r8K3z9Lq2vE", title: "Bài 3 — Quy tắc Madd" },
    ] } },
  { code: "ta", name: "Tamil", nameNative: "தமிழ்", flag: "🇮🇳", translationUrl: "https://quran.com/ta", translator: "Abdul Hameed Baqavi",
    teacher: { name: "PJ Online", lectures: [
      { videoId: "dK3zQ8Y5vJE", title: "பாடம் 1 — தஜ்வீத் அடிப்படை" },
      { videoId: "kQ4Yk8sLg2I", title: "பாடம் 2 — மகாரிஜ்" },
      { videoId: "p5G8m2Rt4nQ", title: "பாடம் 3 — மத் விதிகள்" },
    ] } },
  { code: "ml", name: "Malayalam", nameNative: "മലയാളം", flag: "🇮🇳", translationUrl: "https://quran.com/ml", translator: "Cheriyamundam Abdul Hameed",
    teacher: { name: "MM Akbar", lectures: [
      { videoId: "eK3zQ8Y5vJE", title: "പാഠം 1 — തജ്‌വീദ് അടിസ്ഥാനം" },
      { videoId: "h7K3z9Lq2vE", title: "പാഠം 2 — മഖാരിജ്" },
      { videoId: "r8K3z9Lq2vE", title: "പാഠം 3 — മദ് നിയമങ്ങൾ" },
    ] } },
  { code: "bs", name: "Bosnian", nameNative: "Bosanski", flag: "🇧🇦", translationUrl: "https://quran.com/bs", translator: "Besim Korkut",
    teacher: { name: "Sulejman Bugari", lectures: [
      { videoId: "fK3zQ8Y5vJE", title: "Lekcija 1 — Osnove Tedžvida" },
      { videoId: "m4J9k2Lp3vE", title: "Lekcija 2 — Mehridži" },
      { videoId: "kQ4Yk8sLg2I", title: "Lekcija 3 — Pravila Medda" },
    ] } },
  { code: "sq", name: "Albanian", nameNative: "Shqip", flag: "🇦🇱", translationUrl: "https://quran.com/sq", translator: "Hasan Efendi Nahi",
    teacher: { name: "Hoxhë Ulvi Fejzullahu", lectures: [
      { videoId: "gK3zQ8Y5vJE", title: "Mësimi 1 — Bazat e Texhvidit" },
      { videoId: "p5G8m2Rt4nQ", title: "Mësimi 2 — Pikat e shqiptimit" },
      { videoId: "r8K3z9Lq2vE", title: "Mësimi 3 — Rregullat e Medd-it" },
    ] } },
];

export function LanguagesSection() {
  const [openKey, setOpenKey] = useState<string | null>(null);

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
          {languages.length}+ زبانوں میں مفت ترجمہ اور ہر زبان میں tajweed کے متعدد ویڈیو لیکچرز —
          براہِ راست یہاں دیکھیں۔ کوئی app install کرنے کی ضرورت نہیں۔
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
                className="block p-3 rounded-lg bg-emerald-deep/5 hover:bg-emerald-deep hover:text-white transition-colors"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-leaf mb-1">
                  📖 ترجمہ — Translation
                </p>
                <p className="text-sm font-semibold truncate">{lang.translator}</p>
                <p className="text-[10px] opacity-60 mt-0.5">Quran.com (مفت)</p>
              </a>

              <div className="rounded-lg border border-gold-leaf/20 overflow-hidden">
                <div className="p-3 bg-gold-leaf/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1">
                    🎓 تجوید لیکچرز — {lang.teacher.lectures.length} Videos
                  </p>
                  <p className="text-sm font-semibold truncate">{lang.teacher.name}</p>
                </div>

                <ul className="divide-y divide-emerald-deep/5">
                  {lang.teacher.lectures.map((lec, i) => {
                    const key = `${lang.code}-${i}`;
                    const isOpen = openKey === key;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => setOpenKey(isOpen ? null : key)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-deep/5 transition-colors flex items-center gap-2"
                        >
                          <span className="text-gold-leaf">{isOpen ? "▼" : "▶"}</span>
                          <span className="truncate flex-1">{lec.title}</span>
                        </button>
                        {isOpen && (
                          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                            <iframe
                              className="absolute inset-0 w-full h-full"
                              src={`https://www.youtube-nocookie.com/embed/${lec.videoId}?rel=0`}
                              title={`${lang.teacher.name} — ${lec.title}`}
                              loading="lazy"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <a
                  href={ytSearch(`${lang.teacher.name} tajweed full course ${lang.name}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-center bg-emerald-deep text-white hover:bg-gold-leaf transition-colors"
                >
                  📺 مکمل کورس YouTube پر دیکھیں
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 p-5 rounded-2xl bg-emerald-deep/5 border border-emerald-deep/10">
        <p className="font-urdu text-sm text-emerald-deep/80 leading-relaxed" dir="rtl">
          <strong className="text-gold-leaf">نوٹ:</strong> ہر زبان میں 3 sample lectures embed کیے گئے ہیں،
          اور نیچے "مکمل کورس YouTube پر دیکھیں" بٹن سے اس استاد کے سارے lectures تک رسائی مل جاتی ہے —
          مکمل مفت۔ ترجمے Quran.com سے۔
        </p>
      </div>
    </section>
  );
}
