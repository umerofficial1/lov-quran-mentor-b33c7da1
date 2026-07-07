// Authentic tafsir sources via api.quran.com v4
// IDs verified against https://api.quran.com/api/v4/resources/tafsirs
export type TafsirSource = {
  id: number;
  name: string;
  author: string;
  lang: "en" | "ur" | "ar";
  short: string;
};

export const TAFSIRS: TafsirSource[] = [
  { id: 169, name: "Ibn Kathir", author: "Hafiz Ibn Kathir", lang: "en", short: "Ibn Kathir" },
  { id: 168, name: "Maarif-ul-Quran", author: "Mufti Muhammad Shafi", lang: "en", short: "Maariful" },
  { id: 157, name: "Tafheem-ul-Quran", author: "Abul A'la Maududi", lang: "en", short: "Tafheem" },
  { id: 74,  name: "Tafsir al-Jalalayn", author: "Jalal ad-Din al-Mahalli & al-Suyuti", lang: "en", short: "Jalalayn" },
  { id: 73,  name: "Tanwîr al-Miqbâs — Ibn 'Abbas", author: "Ibn Abbas (attrib.)", lang: "en", short: "Ibn Abbas" },
  { id: 164, name: "Fi Zilal al-Quran (Urdu)", author: "Sayyid Qutb", lang: "ur", short: "Fi Zilal" },
];

export type TafsirText = {
  id: number;
  text: string;
  verse_key: string;
  resource_id: number;
  resource_name: string;
};

export async function fetchTafsir(tafsirId: number, verseKey: string): Promise<TafsirText | null> {
  const res = await fetch(
    `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${verseKey}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.tafsir ?? null;
}
