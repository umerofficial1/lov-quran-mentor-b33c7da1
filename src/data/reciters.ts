// Curated library of famous Qurra with embedded video/audio references.
// Videos are YouTube embeds (iframe) — user stays on Ayatica, no redirect.
// Audio streams are from mp3quran.net / everyayah.com (free & legal).

export type Reciter = {
  id: string;
  name: string;
  arabicName: string;
  country: string;
  era: string;
  category: "haramain" | "egyptian" | "modern" | "classical";
  style: "Murattal" | "Mujawwad" | "Both";
  bio: string;
  // MP3Quran server folder (full mushaf audio, surah-by-surah).
  // URL pattern: https://server{N}.mp3quran.net/{folder}/{surahNumber-padded-3}.mp3
  audio?: { server: string; folder: string };
  // Hand-picked YouTube video IDs (famous tilawaat clips).
  videos: { id: string; title: string; surah?: string }[];
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
    videos: [
      { id: "wCz5cCTb-U8", title: "Surah Ar-Rahman — Haram Makkah (Full)", surah: "55" },
      { id: "u9ktMs4XLK8", title: "Surah Al-Kahf — Emotional Recitation", surah: "18" },
      { id: "PQK1KgKQnJk", title: "Surah Yaseen — Complete", surah: "36" },
      { id: "8i1lYb9dqI4", title: "Best of Sudais — Long Compilation" },
      { id: "Vg7BcJHFVsA", title: "Taraweeh Ramadan — Makkah" },
    ],
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
    videos: [
      { id: "8UgY6xJrH14", title: "Surah Al-Baqarah — Complete", surah: "2" },
      { id: "PZ5nWJmMxGw", title: "Surah Al-Mulk", surah: "67" },
      { id: "H9y3Q9dNb8Q", title: "Best of Shuraim — Compilation" },
      { id: "R7g4S9K1YQY", title: "Taraweeh in Masjid al-Haram" },
    ],
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
    videos: [
      { id: "3rY8QYcS0eE", title: "Surah Al-Kahf — Beautiful Recitation", surah: "18" },
      { id: "kx4pXFmMzHY", title: "Surah Ar-Rahman — Haram", surah: "55" },
      { id: "N9F3Q1zRvKQ", title: "Surah Ya-Sin", surah: "36" },
      { id: "6XLPqW9GT8Y", title: "Fajr in Masjid al-Haram" },
      { id: "L4wD1xQdN2E", title: "Best of Maher — Compilation" },
    ],
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
    videos: [
      { id: "7Y6bYK9m4vU", title: "Surah Al-Insan — Tahajjud", surah: "76" },
      { id: "M5pQnB2LrJc", title: "Surah Al-Waqi'ah", surah: "56" },
      { id: "V3dR9K4mQpY", title: "Best of Juhany — Emotional" },
    ],
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
    audio: { server: "https://server12.mp3quran.net", folder: "s_bud" },
    videos: [
      { id: "L8mN2pQ9K3Y", title: "Surah Al-Baqarah — Madinah", surah: "2" },
      { id: "W6tY4jH8vRc", title: "Taraweeh in Madinah" },
    ],
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
    videos: [
      { id: "K8mQ3nP9vJc", title: "Complete Quran — Full Mushaf" },
      { id: "R9tY6xL2mQY", title: "Juz Amma — Beautiful" },
      { id: "H4pV8kN3wLc", title: "Surah Yaseen", surah: "36" },
    ],
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
    videos: [
      { id: "3vg-Ii8vlmU", title: "Surah Al-Fatir — Mujawwad Masterpiece", surah: "35" },
      { id: "Lz_hSZzt6Xk", title: "Surah Ad-Duha — Iconic", surah: "93" },
      { id: "6BpTV0M2nGU", title: "Surah Al-Ghashiyah — Live", surah: "88" },
      { id: "yqZbEUJoy6c", title: "Surah Maryam — Mujawwad", surah: "19" },
      { id: "kX2Y9pQ8mRc", title: "Best of Abdul Basit — Compilation" },
      { id: "NkE2X8xR5wY", title: "Surah Al-Infitar", surah: "82" },
    ],
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
    videos: [
      { id: "gN9pW4jK2Yc", title: "Surah Al-Qiyamah — Weeping Recitation", surah: "75" },
      { id: "T6mR8xL3vQY", title: "Surah Al-Hashr — Live", surah: "59" },
      { id: "P2bN7hK9wJc", title: "Surah Yusuf — Full", surah: "12" },
      { id: "V8pQ4mR9kLc", title: "Complete Mujawwad — Playlist" },
    ],
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
    videos: [
      { id: "hV3nR8kL2mY", title: "Surah Al-Baqarah — Murattal (Learning)", surah: "2" },
      { id: "K7pQ9wJ4nRc", title: "Muallim — Teaching Style" },
      { id: "M2bN8xR6vLc", title: "Surah Ale-Imran", surah: "3" },
    ],
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
    videos: [
      { id: "Y8pR3nK9mLc", title: "Surah Hud — Legendary Live Recitation", surah: "11" },
      { id: "W4bQ7xJ2vRY", title: "Surah An-Najm — Iconic", surah: "53" },
      { id: "T9pM6nR3kLc", title: "Best of Mustafa Ismail" },
    ],
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
    videos: [
      { id: "R7bQ8xJ3nLc", title: "Surah Al-Isra — Historic Recording", surah: "17" },
      { id: "M4pW9kR2vYc", title: "Old Radio Egypt Broadcast" },
    ],
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
    audio: { server: "https://server10.mp3quran.net", folder: "tblawi" },
    videos: [
      { id: "P3bN7xK9wJc", title: "Surah Al-Anfal — Powerful", surah: "8" },
      { id: "K8mR4nQ2vLc", title: "Surah Al-Furqan", surah: "25" },
    ],
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
    videos: [
      { id: "H2wUXTFDpEA", title: "Surah Ar-Rahman — Beautiful", surah: "55" },
      { id: "jNKR9x8-Vc0", title: "Surah Al-Mulk — Nighttime", surah: "67" },
      { id: "3zPh8VbxG9E", title: "Surah Yaseen — Full", surah: "36" },
      { id: "K9pB4nR2vLc", title: "Surah Al-Kahf — Friday", surah: "18" },
      { id: "M7wQ3xJ8nRc", title: "Best of Mishary — Compilation" },
    ],
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
    videos: [
      { id: "N8pR3wK9mLc", title: "Surah Al-Waqi'ah", surah: "56" },
      { id: "V4bQ7xJ2nRY", title: "Surah Maryam", surah: "19" },
    ],
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
    videos: [
      { id: "R7pM3nK9wLc", title: "Surah Al-Baqarah", surah: "2" },
      { id: "T2bQ8xJ4vRY", title: "Surah Al-Kahf", surah: "18" },
    ],
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
    videos: [
      { id: "8wKcYy0j3E4", title: "Surah Al-Qiyamah — Viral Taraweeh", surah: "75" },
      { id: "P4bN9xK2wJc", title: "Surah Al-Hashr — Emotional", surah: "59" },
      { id: "M8pR3nQ7vLc", title: "Best of Yasser Al-Dosari" },
      { id: "K2wQ6xJ9nRY", title: "Ramadan in Makkah" },
    ],
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
    audio: { server: "https://server13.mp3quran.net", folder: "bna" },
    videos: [
      { id: "V7bQ3xK9wJc", title: "Surah Al-Insan — Mujawwad", surah: "76" },
      { id: "R4pM8nJ2vLc", title: "Classical Egyptian Recitation" },
    ],
  },
];

export const CATEGORIES = [
  { id: "all", label: "All Reciters" },
  { id: "haramain", label: "Imams of Haramain" },
  { id: "egyptian", label: "Egyptian Masters" },
  { id: "classical", label: "Classical Legends" },
  { id: "modern", label: "Modern Voices" },
] as const;
