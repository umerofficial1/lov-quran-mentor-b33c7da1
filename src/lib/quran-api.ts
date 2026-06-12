// Client for alquran.cloud API
// Docs: https://alquran.cloud/api

export type Ayah = {
  number: number;            // global ayah number
  numberInSurah: number;
  text: string;
  audio: string;             // mp3 URL
  audioSecondary?: string[];
};

export type SurahDetail = {
  number: number;
  name: string;              // Arabic
  englishName: string;
  englishNameTranslation: string;
  revelationType: "Meccan" | "Medinan";
  numberOfAyahs: number;
  ayahs: Ayah[];
};

export type SurahWithTranslations = {
  arabic: SurahDetail;
  urdu: SurahDetail;
  english: SurahDetail;
};

const BASE = "https://api.alquran.cloud/v1";

// Reciter editions (identifiers from alquran.cloud)
export const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
  { id: "ar.minshawi", name: "Mohamed Siddiq al-Minshawi" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahmaan As-Sudais" },
  { id: "ar.mahermuaiqly", name: "Maher Al Muaiqly" },
  { id: "ar.hanirifai", name: "Hani ar-Rifai" },
] as const;

export type ReciterId = (typeof RECITERS)[number]["id"];

export async function fetchSurah(
  surahNumber: number,
  reciter: ReciterId = "ar.alafasy",
): Promise<SurahWithTranslations> {
  const editions = `${reciter},ur.jalandhry,en.sahih`;
  const res = await fetch(`${BASE}/surah/${surahNumber}/editions/${editions}`);
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);
  const json = await res.json();
  const data = json.data as SurahDetail[];
  return {
    arabic: data[0],
    urdu: data[1],
    english: data[2],
  };
}

// Bookmarks & last read in localStorage
export type Bookmark = {
  surah: number;
  ayah: number;
  surahName: string;
  savedAt: number;
};

const LS_BOOKMARKS = "loveqran.bookmarks";
const LS_LAST_READ = "loveqran.lastRead";

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_BOOKMARKS) || "[]");
  } catch {
    return [];
  }
}

export function toggleBookmark(b: Bookmark): Bookmark[] {
  const all = getBookmarks();
  const idx = all.findIndex((x) => x.surah === b.surah && x.ayah === b.ayah);
  const next = idx >= 0 ? all.filter((_, i) => i !== idx) : [b, ...all].slice(0, 50);
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify(next));
  return next;
}

export function isBookmarked(surah: number, ayah: number): boolean {
  return getBookmarks().some((b) => b.surah === surah && b.ayah === ayah);
}

export function setLastRead(surah: number, ayah: number, surahName: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_LAST_READ, JSON.stringify({ surah, ayah, surahName, savedAt: Date.now() }));
}

export function getLastRead(): Bookmark | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_LAST_READ);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
