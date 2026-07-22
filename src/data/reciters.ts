// Curated library of famous Qurra.
// Full mushaf audio streams from mp3quran.net (verified working, free & legal).
// Video access is via a YouTube search query so the user always lands on
// real, up-to-date tilawaat from that reciter (no dead/embedded video IDs).

export type Reciter = {
  id: string;
  name: string;
  arabicName: string;
  country: string;
  era: string;
  category: "haramain" | "egyptian" | "modern" | "classical";
  style: "Murattal" | "Mujawwad" | "Both";
  bio: string;
  // MP3Quran server (full mushaf audio, surah-by-surah).
  // URL pattern: {server}/{folder}/{surahNumber-padded-3}.mp3
  audio?: { server: string; folder: string };
  // Search query used to open real YouTube results for this reciter.
  youtubeQuery: string;
};

export const RECITERS: Reciter[] = [
  // ============ HARAMAIN (Imams of Makkah & Madinah) ============
  {
    id: "sudais",
    name: "Sheikh Abdul Rahman As-Sudais",
    arabicName: "عبد الرحمن السديس",
    country: "Saudi Arabia",
    era: "b. 1960",
    category: "haramain",
    style: "Murattal",
    bio: "Imam of Masjid al-Haram since 1984. President of the General Presidency for the Two Holy Mosques. Beloved worldwide for his emotional, powerful recitation during Taraweeh.",
    audio: { server: "https://server11.mp3quran.net", folder: "sds" },
    youtubeQuery: "Abdul Rahman Sudais Quran recitation",
  },
  {
    id: "shuraim",
    name: "Sheikh Saud Ash-Shuraim",
    arabicName: "سعود الشريم",
    country: "Saudi Arabia",
    era: "b. 1966",
    category: "haramain",
    style: "Murattal",
    bio: "Imam and Khateeb of Masjid al-Haram, appointed 1991. Known for his deep, resonant voice and precise tajweed. PhD in Aqeedah from Umm al-Qura University.",
    audio: { server: "https://server7.mp3quran.net", folder: "shur" },
    youtubeQuery: "Saud Shuraim Quran recitation",
  },
  {
    id: "maher",
    name: "Sheikh Maher Al-Muaiqly",
    arabicName: "ماهر المعيقلي",
    country: "Saudi Arabia",
    era: "b. 1969",
    category: "haramain",
    style: "Murattal",
    bio: "Imam of Masjid al-Haram (Makkah) and previously Masjid an-Nabawi. His crystal-clear, melodious voice has made him one of the most-listened-to reciters online.",
    audio: { server: "https://server12.mp3quran.net", folder: "maher" },
    youtubeQuery: "Maher Al Muaiqly Quran recitation",
  },
  {
    id: "juhany",
    name: "Sheikh Abdullah Al-Juhany",
    arabicName: "عبد الله الجهني",
    country: "Saudi Arabia",
    era: "b. 1976",
    category: "haramain",
    style: "Murattal",
    bio: "Imam of Masjid al-Haram, one of the youngest appointed. Known for gentle, heart-touching recitation especially in Qiyaam-ul-Layl.",
    audio: { server: "https://server13.mp3quran.net", folder: "jhn" },
    youtubeQuery: "Abdullah Al Juhany Quran recitation",
  },
  {
    id: "budair",
    name: "Sheikh Salah Al-Budair",
    arabicName: "صلاح البدير",
    country: "Saudi Arabia",
    era: "b. 1975",
    category: "haramain",
    style: "Murattal",
    bio: "Imam of Masjid an-Nabawi in Madinah. Judge and scholar, famed for slow, dignified recitation.",
    audio: { server: "https://server6.mp3quran.net", folder: "s_bud" },
    youtubeQuery: "Salah Al Budair Quran recitation Madinah",
  },
  {
    id: "ghamdi",
    name: "Sheikh Saad Al-Ghamdi",
    arabicName: "سعد الغامدي",
    country: "Saudi Arabia",
    era: "b. 1967",
    category: "modern",
    style: "Murattal",
    bio: "Renowned for the clearest, most soothing Murattal recording of the entire Quran — a staple in memorization worldwide.",
    audio: { server: "https://server7.mp3quran.net", folder: "s_gmd" },
    youtubeQuery: "Saad Al Ghamdi Quran recitation",
  },

  // ============ EGYPTIAN QURRA (Kibar al-Qurra) ============
  {
    id: "abdulbasit",
    name: "Sheikh Abdul Basit Abdus Samad",
    arabicName: "عبد الباسط عبد الصمد",
    country: "Egypt",
    era: "1927–1988",
    category: "egyptian",
    style: "Both",
    bio: "The legendary 'Golden Throat of Cairo.' First president of Egypt's Reciters' Union. Three-time world Quran recitation champion. His Mujawwad style is the gold standard.",
    audio: { server: "https://server7.mp3quran.net", folder: "basit" },
    youtubeQuery: "Abdul Basit Abdus Samad Mujawwad",
  },
  {
    id: "minshawi",
    name: "Sheikh Muhammad Siddiq Al-Minshawi",
    arabicName: "محمد صديق المنشاوي",
    country: "Egypt",
    era: "1920–1969",
    category: "egyptian",
    style: "Both",
    bio: "One of the four grandmasters of 20th-century Quran recitation. His humble, tearful style is unmatched. Recorded the first complete Mujawwad mushaf.",
    audio: { server: "https://server10.mp3quran.net", folder: "minsh" },
    youtubeQuery: "Muhammad Siddiq Minshawi Mujawwad",
  },
  {
    id: "hussary",
    name: "Sheikh Mahmoud Khalil Al-Hussary",
    arabicName: "محمود خليل الحصري",
    country: "Egypt",
    era: "1917–1980",
    category: "egyptian",
    style: "Both",
    bio: "Sheikh al-Maqari (Chief of Reciters) of Egypt. First to record the complete Quran in all seven qira'at. His Murattal is the classroom standard for tajweed learners.",
    audio: { server: "https://server13.mp3quran.net", folder: "husr" },
    youtubeQuery: "Mahmoud Khalil Al Hussary Quran",
  },
  {
    id: "mustafa-ismail",
    name: "Sheikh Mustafa Ismail",
    arabicName: "مصطفى إسماعيل",
    country: "Egypt",
    era: "1905–1978",
    category: "egyptian",
    style: "Mujawwad",
    bio: "The 'Sultan of Reciters.' President Nasser's personal reciter. His mastery of maqamat (musical modes) in Mujawwad has never been equalled.",
    audio: { server: "https://server8.mp3quran.net", folder: "mustafa" },
    youtubeQuery: "Mustafa Ismail Quran Mujawwad",
  },
  {
    id: "rifat",
    name: "Sheikh Muhammad Rifat",
    arabicName: "محمد رفعت",
    country: "Egypt",
    era: "1882–1950",
    category: "classical",
    style: "Mujawwad",
    bio: "The pioneer. First reciter broadcast on Egyptian Radio (1934). Blind from age 2. His recordings are national treasures — the foundation of modern tilawah.",
    youtubeQuery: "Sheikh Muhammad Rifat Quran recitation",
  },
  {
    id: "tablawi",
    name: "Sheikh Muhammad Al-Tablawi",
    arabicName: "محمد الطبلاوي",
    country: "Egypt",
    era: "1934–2020",
    category: "egyptian",
    style: "Both",
    bio: "Head of the Egyptian Reciters' Union. One of the last living links to the golden age. Known for his commanding, majestic voice.",
    audio: { server: "https://server12.mp3quran.net", folder: "tblawi" },
    youtubeQuery: "Muhammad Al Tablawi Quran recitation",
  },

  // ============ MODERN GIANTS ============
  {
    id: "mishary",
    name: "Sheikh Mishary Rashid Al-Afasy",
    arabicName: "مشاري راشد العفاسي",
    country: "Kuwait",
    era: "b. 1976",
    category: "modern",
    style: "Murattal",
    bio: "The most-streamed reciter in the world. Imam of Grand Mosque of Kuwait. Also a renowned nasheed artist. His voice defined a generation.",
    audio: { server: "https://server8.mp3quran.net", folder: "afs" },
    youtubeQuery: "Mishary Rashid Alafasy Quran",
  },
  {
    id: "ajmy",
    name: "Sheikh Ahmad Al-Ajmy",
    arabicName: "أحمد العجمي",
    country: "Saudi Arabia",
    era: "b. 1968",
    category: "modern",
    style: "Murattal",
    bio: "Doctor of Sharia and one of Saudi Arabia's most beloved contemporary reciters. Known for his warm, emotional style.",
    audio: { server: "https://server10.mp3quran.net", folder: "ajm" },
    youtubeQuery: "Ahmad Al Ajmy Quran recitation",
  },
  {
    id: "shatri",
    name: "Sheikh Abu Bakr Ash-Shatri",
    arabicName: "أبو بكر الشاطري",
    country: "Saudi Arabia",
    era: "b. 1970",
    category: "modern",
    style: "Murattal",
    bio: "Businessman-turned-Imam. His recitation carries deep tranquility — a favorite for memorization and daily listening.",
    audio: { server: "https://server11.mp3quran.net", folder: "shatri" },
    youtubeQuery: "Abu Bakr Al Shatri Quran recitation",
  },
  {
    id: "muaiqly-yasser",
    name: "Sheikh Yasser Al-Dosari",
    arabicName: "ياسر الدوسري",
    country: "Saudi Arabia",
    era: "b. 1980",
    category: "haramain",
    style: "Murattal",
    bio: "Newest Imam of Masjid al-Haram. His youthful, emotional voice has gone viral globally, especially during Ramadan Taraweeh.",
    audio: { server: "https://server11.mp3quran.net", folder: "yasser" },
    youtubeQuery: "Yasser Al Dosari Quran Taraweeh",
  },
  {
    id: "banna",
    name: "Sheikh Mahmoud Ali Al-Banna",
    arabicName: "محمود علي البنا",
    country: "Egypt",
    era: "1926–1985",
    category: "egyptian",
    style: "Mujawwad",
    bio: "'The Nightingale of the Quran.' Master of maqam Bayati and Rast. Recorded countless historic Mujawwad broadcasts on Egyptian Radio.",
    audio: { server: "https://server8.mp3quran.net", folder: "bna" },
    youtubeQuery: "Mahmoud Ali Al Banna Quran Mujawwad",
  },
];

export const CATEGORIES = [
  { id: "all", label: "All Reciters" },
  { id: "haramain", label: "Imams of Haramain" },
  { id: "egyptian", label: "Egyptian Masters" },
  { id: "classical", label: "Classical Legends" },
  { id: "modern", label: "Modern Voices" },
] as const;
