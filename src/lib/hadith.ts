// Hadith catalog + fetch helpers.
// Source: fawazahmed0/hadith-api (free CDN, no key required).
// https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/

export type HadithBook = {
  id: string; // slug used by the API
  title: string; // English
  titleAr: string; // Arabic display
  author: string;
  blurb: string; // short Urdu blurb
  hasUrdu: boolean;
};

// All authentic collections currently available on the CDN with Arabic +
// (mostly) Urdu translations. The six canonical Sihah Sittah plus Muwatta
// Malik, Musnad Ahmad (via Sunan-style compilations), and three curated
// forty-hadith works.
export const HADITH_BOOKS: HadithBook[] = [
  { id: "bukhari", title: "Sahih al-Bukhari", titleAr: "صحيح البخاري", author: "Imam Muhammad al-Bukhari", blurb: "سب سے مستند کتاب — تقریباً 7,563 احادیث۔", hasUrdu: true },
  { id: "muslim", title: "Sahih Muslim", titleAr: "صحيح مسلم", author: "Imam Muslim ibn al-Hajjaj", blurb: "دوسری مستند ترین کتاب — 7,500+ احادیث۔", hasUrdu: true },
  { id: "abudawud", title: "Sunan Abi Dawud", titleAr: "سنن أبي داود", author: "Imam Abu Dawud as-Sijistani", blurb: "احکامِ فقہ پر خصوصی توجہ۔", hasUrdu: true },
  { id: "tirmidhi", title: "Jami' at-Tirmidhi", titleAr: "جامع الترمذي", author: "Imam Muhammad at-Tirmidhi", blurb: "ہر باب میں راویوں کے درجات کی وضاحت۔", hasUrdu: true },
  { id: "nasai", title: "Sunan an-Nasa'i", titleAr: "سنن النسائي", author: "Imam Ahmad an-Nasa'i", blurb: "چھ کتب میں سب سے دقیق چھان بین۔", hasUrdu: true },
  { id: "ibnmajah", title: "Sunan Ibn Majah", titleAr: "سنن ابن ماجه", author: "Imam Muhammad ibn Majah", blurb: "کتبِ سِتّہ کی چھٹی کتاب۔", hasUrdu: true },
  { id: "malik", title: "Muwatta Malik", titleAr: "موطأ مالك", author: "Imam Malik ibn Anas", blurb: "اہلِ مدینہ کے عمل پر مبنی قدیم ترین مجموعہ۔", hasUrdu: true },
  { id: "nawawi", title: "40 Hadith of an-Nawawi", titleAr: "الأربعون النووية", author: "Imam Yahya an-Nawawi", blurb: "دین کے اصولوں کو سمیٹتی 42 احادیث۔", hasUrdu: false },
  { id: "qudsi", title: "40 Hadith Qudsi", titleAr: "الأحاديث القدسية", author: "Various", blurb: "اللہ کے وہ ارشادات جو نبی ﷺ نے نقل فرمائے۔", hasUrdu: false },
  { id: "dehlawi", title: "40 Hadith of Shah Waliullah", titleAr: "الأربعون للدهلوي", author: "Shah Waliullah ad-Dehlawi", blurb: "برصغیر کے عظیم محدث کا انتخاب۔", hasUrdu: false },
];

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

export type HadithMeta = {
  name: string;
  sections: Record<string, string>;
  section_details: Record<string, { hadithnumber_first: number; hadithnumber_last: number }>;
};

export type Hadith = {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
  grades?: { name: string; grade: string }[];
  reference?: { book?: number; hadith?: number };
};

export type EditionResponse = { metadata: HadithMeta; hadiths: Hadith[] };

export function editionSlug(bookId: string, lang: "ara" | "urd" | "eng"): string {
  return `${lang}-${bookId}`;
}

export async function fetchBookMeta(bookId: string): Promise<HadithMeta> {
  // Arabic edition always exists and holds section metadata.
  const url = `${CDN}/editions/${editionSlug(bookId, "ara")}/1.json`;
  // The full edition is heavy; we fetch the tiny "section 1" endpoint which
  // still returns the complete metadata block.
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load hadith metadata (${res.status})`);
  const data = (await res.json()) as EditionResponse;
  return data.metadata;
}

export async function fetchSection(
  bookId: string,
  sectionId: string,
  lang: "ara" | "urd" | "eng",
): Promise<EditionResponse> {
  const url = `${CDN}/editions/${editionSlug(bookId, lang)}/sections/${sectionId}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load section (${res.status})`);
  return (await res.json()) as EditionResponse;
}

export function getBook(id: string): HadithBook | undefined {
  return HADITH_BOOKS.find((b) => b.id === id);
}
