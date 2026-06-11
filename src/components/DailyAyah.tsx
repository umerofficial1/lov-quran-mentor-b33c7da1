import { useMemo, useState } from "react";

type Tafseer = { imam: string; text: string };
type Ayah = {
  surah: string;
  ref: string;
  arabic: string;
  urdu: string;
  english: string;
  tarjumaFahmulQuran?: string;
  tafaseer: Tafseer[];
};

const AYAHS: Ayah[] = [
  {
    surah: "البقرة",
    ref: "2:152",
    arabic: "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ",
    urdu: "پس تم مجھے یاد کرو، میں تمہیں یاد کروں گا، اور میرا شکر ادا کرو اور ناشکری نہ کرو۔",
    english:
      "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
    tarjumaFahmulQuran:
      "(مولانا اشرف علی تھانوی) سو تم مجھے یاد رکھو میں تمہیں یاد رکھوں گا اور میرا شکر بجا لاؤ اور میری ناشکری نہ کرو۔",
    tafaseer: [
      {
        imam: "ابن کثیرؒ",
        text: "اللہ تعالیٰ کا بندے کو یاد کرنا اس کے یاد کرنے سے کہیں بڑھ کر ہے۔ حدیث قدسی میں ہے: جو بندہ مجھے اپنے دل میں یاد کرتا ہے میں اسے اپنے پاس یاد کرتا ہوں۔",
      },
      {
        imam: "امام طبریؒ",
        text: "یعنی میری اطاعت اور عبادت کے ذریعے مجھے یاد کرو، میں اپنی رحمت اور مغفرت کے ساتھ تمہیں یاد کروں گا۔",
      },
      {
        imam: "امام قرطبیؒ",
        text: "ذکر کی تین قسمیں ہیں: زبان سے، دل سے، اور اعضاء سے اطاعت کے ذریعے۔ بہترین ذکر دل اور زبان دونوں سے ہو۔",
      },
      {
        imam: "امام رازیؒ",
        text: "شکر نعمت کے بڑھنے کا سبب ہے اور کفرانِ نعمت زوال کا۔ آیت میں شکر کا حکم اور کفر سے سختی سے روکا گیا ہے۔",
      },
      {
        imam: "مفتی شفیع عثمانیؒ (معارف القرآن)",
        text: "ذکرِ الٰہی کا اصل مقصد دل کا اللہ کی طرف متوجہ ہونا ہے، اور شکر کا تعلق قلب، لسان اور اعضاء تینوں سے ہے۔",
      },
    ],
  },
  {
    surah: "الطلاق",
    ref: "65:2-3",
    arabic:
      "وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًۭا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    urdu:
      "اور جو شخص اللہ سے ڈرتا ہے، اللہ اس کے لیے (مشکلات سے) نکلنے کی راہ بنا دیتا ہے، اور اسے ایسی جگہ سے رزق دیتا ہے جہاں سے اس کا گمان بھی نہ ہو۔",
    english:
      "And whoever fears Allah, He will make for him a way out, and provide for him from where he does not expect.",
    tafaseer: [
      {
        imam: "ابن کثیرؒ",
        text: "تقویٰ ہر مشکل کا حل اور ہر تنگی کے بعد آسانی کا سبب ہے۔ صحابہؓ کے واقعات اس کی واضح گواہی ہیں۔",
      },
      {
        imam: "امام طبریؒ",
        text: "جو اللہ کے احکام پر عمل کرے اور حرام سے بچے، اللہ اس کے لیے دنیا و آخرت میں راستہ کھول دیتا ہے۔",
      },
      {
        imam: "امام بغویؒ",
        text: "آیت کا شانِ نزول عوف بن مالک اشجعیؓ کا واقعہ ہے جن کے بیٹے کو دشمن نے قید کر لیا، تقویٰ اختیار کرنے پر اللہ نے غیب سے رزق اور رہائی عطا فرمائی۔",
      },
      {
        imam: "امام قرطبیؒ",
        text: "مخرج سے مراد ہر شرعی، مالی اور نفسیاتی الجھن سے نجات ہے۔ متقی کبھی مایوس نہیں ہوتا۔",
      },
    ],
  },
  {
    surah: "الانشراح",
    ref: "94:5-6",
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    urdu: "پس بے شک تنگی کے ساتھ آسانی ہے، یقیناً تنگی کے ساتھ آسانی ہے۔",
    english:
      "For indeed, with hardship will be ease. Indeed, with hardship will be ease.",
    tafaseer: [
      {
        imam: "ابن کثیرؒ",
        text: "ایک تنگی دو آسانیوں پر کبھی غالب نہیں آ سکتی، کیونکہ عربی میں عسر معرفہ اور یسر نکرہ ہے۔",
      },
      {
        imam: "امام طبریؒ",
        text: "اللہ نے نبی ﷺ اور امت کو خوش خبری دی کہ ہر مشکل کے ساتھ آسانی لگی ہوئی ہے، تاخیر صرف صبر کی آزمائش کے لیے ہے۔",
      },
      {
        imam: "امام رازیؒ",
        text: "آیت کے بار بار آنے میں تاکید ہے، تاکہ مومن کسی حال میں ناامید نہ ہو۔",
      },
      {
        imam: "مولانا مودودیؒ (تفہیم القرآن)",
        text: "یہ صرف نبی ﷺ کے لیے تسلی نہیں بلکہ ہر اُس مومن کے لیے بشارت ہے جو اللہ کی راہ میں مشکلات اٹھاتا ہے۔",
      },
    ],
  },
  {
    surah: "آل عمران",
    ref: "3:159",
    arabic:
      "فَبِمَا رَحْمَةٍۢ مِّنَ ٱللَّهِ لِنتَ لَهُمْ ۖ وَلَوْ كُنتَ فَظًّا غَلِيظَ ٱلْقَلْبِ لَٱنفَضُّوا۟ مِنْ حَوْلِكَ",
    urdu:
      "پس (اے نبیؐ) یہ اللہ کی رحمت ہے کہ آپ ان کے لیے نرم خو ہیں، اور اگر آپ تندخو اور سخت دل ہوتے تو یہ سب آپ کے گرد سے منتشر ہو جاتے۔",
    english:
      "So by mercy from Allah, you were lenient with them. And if you had been rude and harsh in heart, they would have disbanded from about you.",
    tafaseer: [
      {
        imam: "ابن کثیرؒ",
        text: "اللہ نے نبی ﷺ کے اخلاقِ کریمانہ کو اپنی رحمت قرار دیا، یہی نرمی دلوں کو جوڑنے کا ذریعہ بنی۔",
      },
      {
        imam: "امام قرطبیؒ",
        text: "داعی کے لیے نرمی، عفو اور مشورہ تین بنیادی صفات ہیں جو اسی آیت میں مذکور ہیں۔",
      },
      {
        imam: "امام رازیؒ",
        text: "نرمی اخلاق کی روح ہے، اور سختی دلوں کو متنفر کرنے کا سب سے بڑا سبب۔",
      },
    ],
  },
];

function todayIndex(len: number) {
  const start = new Date(Date.UTC(2024, 0, 1));
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return ((days % len) + len) % len;
}

export function DailyAyah() {
  const [index, setIndex] = useState(() => todayIndex(AYAHS.length));
  const [tab, setTab] = useState<"translation" | "tafseer">("translation");
  const ayah = useMemo(() => AYAHS[index], [index]);

  return (
    <section
      id="quran"
      className="relative overflow-hidden rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl p-8 md:p-12"
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-6">
        <span className="inline-block px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
          آج کی آیت
        </span>
        <span className="text-xs font-bold text-emerald-300/80 tracking-widest">
          سورۃ {ayah.surah} • {ayah.ref}
        </span>
      </div>

      <p
        className="relative font-arabic text-3xl md:text-5xl leading-[1.9] text-white mb-8 text-center drop-shadow-sm"
        dir="rtl"
      >
        {ayah.arabic}
      </p>

      {/* Tabs */}
      <div className="relative flex justify-center gap-2 mb-6">
        {[
          { key: "translation", label: "ترجمہ" },
          { key: "tafseer", label: "تفسیر — اقوالِ ائمہ" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "translation" | "tafseer")}
            className={
              tab === t.key
                ? "px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold tracking-widest"
                : "px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold tracking-widest"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "translation" ? (
        <div className="relative space-y-4 max-w-3xl mx-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">اردو ترجمہ</p>
            <p className="font-urdu text-lg text-slate-200 leading-loose" dir="rtl">
              {ayah.urdu}
            </p>
          </div>
          {ayah.tarjumaFahmulQuran && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">
                تفہیم / فہم القرآن
              </p>
              <p className="font-urdu text-base text-slate-300 leading-loose" dir="rtl">
                {ayah.tarjumaFahmulQuran}
              </p>
            </div>
          )}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">English</p>
            <p className="text-base text-slate-300 leading-relaxed italic">{ayah.english}</p>
          </div>
        </div>
      ) : (
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {ayah.tafaseer.map((t) => (
            <div
              key={t.imam}
              className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-400/20 p-5"
            >
              <p className="text-amber-300 text-sm font-bold mb-2 tracking-wide" dir="rtl">
                {t.imam}
              </p>
              <p className="font-urdu text-sm text-slate-200 leading-loose" dir="rtl">
                {t.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="relative flex flex-wrap justify-center gap-3 mt-8">
        <button
          onClick={() => setIndex((i) => (i - 1 + AYAHS.length) % AYAHS.length)}
          className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold tracking-widest text-slate-200"
        >
          ◀ سابقہ
        </button>
        <button className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(5,150,105,0.4)] border border-emerald-400/30">
          LISTEN
        </button>
        <button
          onClick={() => {
            const text = `${ayah.arabic}\n\n${ayah.urdu}\n\n— سورۃ ${ayah.surah} ${ayah.ref}`;
            if (navigator.share) navigator.share({ text }).catch(() => {});
            else navigator.clipboard?.writeText(text);
          }}
          className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold tracking-widest text-slate-200"
        >
          SHARE
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % AYAHS.length)}
          className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold tracking-widest text-slate-200"
        >
          اگلی ▶
        </button>
      </div>
    </section>
  );
}
