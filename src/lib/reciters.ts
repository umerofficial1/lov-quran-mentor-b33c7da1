// Every-Ayah audio catalog. Folders are the canonical everyayah.com paths.
// URL pattern: https://everyayah.com/data/{folder}/{SSS}{AAA}.mp3
export type Reciter = {
  id: string;
  name: string;
  arabic: string;
  folder: string;
  style: "Murattal" | "Mujawwad";
};

export const RECITERS: Reciter[] = [
  { id: "abdul_basit",   name: "Abdul Basit Abdus-Samad", arabic: "عبد الباسط عبد الصمد", folder: "Abdul_Basit_Murattal_64kbps",    style: "Murattal" },
  { id: "alafasy",       name: "Mishary Rashid Alafasy",  arabic: "مشاري راشد العفاسي",   folder: "Alafasy_64kbps",                 style: "Murattal" },
  { id: "maher",         name: "Maher Al Muaiqly",        arabic: "ماهر المعيقلي",         folder: "MaherAlMuaiqly128kbps",         style: "Murattal" },
  { id: "sudais",        name: "Abdurrahman As-Sudais",   arabic: "عبد الرحمن السديس",     folder: "Abdurrahmaan_As-Sudais_64kbps", style: "Murattal" },
  { id: "minshawi",      name: "Muhammad Al-Minshawi",    arabic: "محمد صديق المنشاوي",     folder: "Minshawy_Murattal_128kbps",     style: "Murattal" },
  { id: "hudhaify",      name: "Ali Al-Hudhaify",         arabic: "علي بن عبدالرحمن الحذيفي", folder: "Hudhaify_64kbps",              style: "Murattal" },
  { id: "ghamdi",        name: "Saad Al-Ghamdi",          arabic: "سعد الغامدي",           folder: "Ghamadi_40kbps",                 style: "Murattal" },
];

export function ayahAudioUrl(reciter: Reciter, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${reciter.folder}/${s}${a}.mp3`;
}

export function getReciter(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[1];
}
