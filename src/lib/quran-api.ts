// Quran.com API Types and Utilities
import { supabase } from "./supabase";

export interface Surah {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  line_number: number;
  page_number: number;
  text_uthmani: string;
  text_imlaei?: string;
  translation?: {
    text: string;
    language_name: string;
  };
  transliteration?: {
    text: string;
    language_name: string;
  };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  text_uthmani: string;
  text_imlaei?: string;
  words?: Word[];
  translations?: Translation[];
  audio?: {
    url: string;
    segments?: number[][];
  };
}

export interface Translation {
  resource_id: number;
  text: string;
}

export interface Reciter {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name: {
    name: string;
    language_name: string;
  };
}

export interface AudioFile {
  url: string;
  segments?: number[][];
}

const BASE_URL = "https://api.quran.com/api/v4";

// Fetch all surahs
export const fetchSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters`);
    const data = await response.json();
    return data.chapters;
  } catch (error) {
    console.error("Error fetching surahs:", error);
    return [];
  }
};

// Fetch single surah details
export const fetchSurah = async (surahNumber: number): Promise<Surah | null> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters/${surahNumber}`);
    const data = await response.json();
    return data.chapter;
  } catch (error) {
    console.error("Error fetching surah:", error);
    return null;
  }
};

// Fetch surah info (context/summary)
export const fetchSurahInfo = async (surahNumber: number): Promise<any | null> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters/${surahNumber}/info`);
    const data = await response.json();
    return data.chapter_info;
  } catch (error) {
    console.error("Error fetching surah info:", error);
    return null;
  }
};

// Curated list of popular translations available in Quran.com API v4
export const AVAILABLE_TRANSLATIONS = [
  { id: 131, name: "The Clear Quran (Mustafa Khattab)", language: "English" },
  { id: 20, name: "Saheeh International", language: "English" },
  { id: 85, name: "Abdul Haleem", language: "English" },
  { id: 97, name: "Tahir ul Qadri", language: "Urdu" },
  { id: 31, name: "Muhammad Hamidullah", language: "French" },
  { id: 33, name: "Indonesian Islamic affairs ministry", language: "Indonesian" },
  { id: 83, name: "Muhammad Isa García", language: "Spanish" },
  { id: 77, name: "Turkish (Diyanet İşleri)", language: "Turkish" },
  { id: 13, name: "Russian (Abu Adel)", language: "Russian" },
  { id: 111, name: "Hindi (Muhammad Farooq Khan)", language: "Hindi" },
];

// Curated list of popular Word-by-Word languages
export const AVAILABLE_WBW_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ur", name: "Urdu" },
  { code: "id", name: "Indonesian" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "tr", name: "Turkish" },
  { code: "ru", name: "Russian" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "fa", name: "Persian" },
  { code: "zh", name: "Chinese" },
  { code: "ta", name: "Tamil" },
];

// Fetch verses of a surah with translations and word data
export const fetchVerses = async (
  surahNumber: number,
  translationId: number = 20,
  page: number = 1,
  perPage: number = 50,
  script: string = "text_uthmani", // 'text_uthmani' | 'text_indopak' | 'text_imlaei' | 'text_uthmani_tajweed'
  wbwLanguage: string = "en"
): Promise<{ verses: Verse[]; pagination: any }> => {
  try {
    // Fetch verses with word-by-word translation and verse translations
    // Ensure we request the specific script field for both words and verses
    const scriptField = 
      script === "text_indopak" ? "text_indopak" : 
      script === "text_uthmani_tajweed" ? "text_uthmani_tajweed" : 
      script === "text_imlaei" ? "text_imlaei" :
      "text_uthmani";

    const response = await fetch(
      `${BASE_URL}/verses/by_chapter/${surahNumber}?language=${wbwLanguage}&word_translation_language=${wbwLanguage}&words=true&word_fields=${scriptField},audio_url,line_number,page_number&translations=${translationId}&fields=${scriptField}&per_page=${perPage}&page=${page}`
    );
    const data = await response.json();
    return {
      verses: data.verses,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Error fetching verses:", error);
    return { verses: [], pagination: null };
  }
};

// Fetch audio for a specific verse
export const fetchVerseAudio = async (
  verseKey: string,
  reciterId: number = 7 // Default: Mishary Rashid Alafasy
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/recitations/${reciterId}/by_ayah/${verseKey}`
    );
    const data = await response.json();
    if (data.audio_files && data.audio_files.length > 0) {
      return `https://verses.quran.com/${data.audio_files[0].url}`;
    }
    return null;
  } catch (error) {
    console.error("Error fetching verse audio:", error);
    return null;
  }
};

// Fetch single verse by key (e.g., "1:1")
export const fetchSingleVerse = async (
  verseKey: string,
  translationId: number = 20
): Promise<Verse | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/verses/by_key/${verseKey}?language=en&words=true&translations=${translationId}&fields=text_uthmani`
    );
    const data = await response.json();
    return data.verse;
  } catch (error) {
    console.error("Error fetching single verse:", error);
    return null;
  }
};

// Fetch all verse audios for a chapter (with word-level timing segments)
export const fetchChapterVerseAudios = async (
  surahNumber: number,
  reciterId: number = 7, // Default to Mishary
  perPage: number = 300
): Promise<Map<string, { url: string; segments: number[][] }>> => {
  const audioMap = new Map<string, { url: string; segments: number[][] }>();
  try {
    // Use the verses endpoint with ?audio= param — this is the ONLY endpoint
    // that returns word-level timing segments for highlighting
    const response = await fetch(
      `${BASE_URL}/verses/by_chapter/${surahNumber}?audio=${reciterId}&per_page=${perPage}&fields=text_uthmani`
    );
    const data = await response.json();
    if (data.verses) {
      data.verses.forEach((verse: { verse_key: string; audio?: { url: string; segments?: number[][] } }) => {
        if (verse.audio) {
          const url = verse.audio.url.startsWith('http') 
            ? verse.audio.url 
            : `https://verses.quran.com/${verse.audio.url}`;
          audioMap.set(verse.verse_key, {
            url,
            segments: verse.audio.segments || []
          });
        }
      });
    }
    console.log(`[AudioFetch] Loaded ${audioMap.size} verses for Surah ${surahNumber}, Reciter ${reciterId}. Segments: ${audioMap.values().next().value?.segments?.length || 0} for first verse.`);
  } catch (error) {
    console.error("Error fetching chapter verse audios:", error);
  }
  return audioMap;
};

// Fetch user's reading profile (last surah/ayah) from profiles table
export const fetchUserReadingProfile = async (userId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('last_read_ayah')
    .eq('id', userId)
    .single();

  if (data && data.last_read_ayah) {
    const [surahStr, ayahStr] = data.last_read_ayah.split(':');
    return {
      last_read_surah: parseInt(surahStr),
      last_read_ayah: parseInt(ayahStr)
    };
  }
  return null;
};

// Fetch chapter audio (full surah)
export const fetchChapterAudio = async (
  surahNumber: number,
  reciterId: number = 7
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/chapter_recitations/${reciterId}/${surahNumber}`
    );
    const data = await response.json();
    return data.audio_file?.audio_url || null;
  } catch (error) {
    console.error("Error fetching chapter audio:", error);
    return null;
  }
};

// Fetch reciters list
export const fetchReciters = async (): Promise<Reciter[]> => {
  try {
    const response = await fetch(`${BASE_URL}/resources/recitations`);
    const data = await response.json();
    return data.recitations;
  } catch (error) {
    console.error("Error fetching reciters:", error);
    return [];
  }
};

// Fetch available translations
export const fetchTranslations = async () => {
  try {
    const response = await fetch(`${BASE_URL}/resources/translations`);
    const data = await response.json();
    return data.translations;
  } catch (error) {
    console.error("Error fetching translations:", error);
    return [];
  }
};

// Search verses
export const searchVerses = async (
  query: string,
  size: number = 10,
  page: number = 1
) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&size=${size}&page=${page}`
    );
    const data = await response.json();
    return data.search;
  } catch (error) {
    console.error("Error searching verses:", error);
    return { results: [], total_results: 0 };
  }
};

// Recommended Tafsir Resource IDs (from Quran.com API v4)
export const TAFSIR_RESOURCES = {
  IBN_KATHIR_EN: 169,
  AL_MUYASSAR_AR: 16,
  AL_JALALAYN_AR: 2,
};

/**
 * Fetch Tafsir for a specific verse
 * @param verseKey format "1:1"
 * @param resourceId defaults to Ibn Kathir (English)
 */
export const fetchTafsir = async (
  verseKey: string,
  resourceId: number = TAFSIR_RESOURCES.IBN_KATHIR_EN
): Promise<{ text: string; resource_name?: string } | null> => {
  try {
    const response = await fetch(`${BASE_URL}/tafsirs/${resourceId}/by_ayah/${verseKey}`);
    const data = await response.json();
    if (!data || !data.tafsir) {
      return null;
    }
    return {
      text: data.tafsir.text,
      resource_name: data.tafsir.resource_name
    };
  } catch (error) {
    console.error("Error fetching tafsir:", verseKey, error);
    return null;
  }
};

/**
 * Fetch overview and metadata for a specific Surah
 * @param surahId 1-114
 */
export const fetchSurahOverview = async (
  surahId: number
): Promise<{ name: string; revelation_place: string; verses_count: number; info_text: string } | null> => {
  try {
    const [chapterRes, infoRes] = await Promise.all([
      fetch(`${BASE_URL}/chapters/${surahId}`),
      fetch(`${BASE_URL}/chapters/${surahId}/info`)
    ]);

    const chapterData = await chapterRes.json();
    const infoData = await infoRes.json();

    if (!chapterData?.chapter) return null;

    // The info text often contains HTML (e.g. <p>, <br>). We can strip it basic tags or let the AI summarize it.
    let cleanText = infoData?.chapter_info?.text || "No detailed info available.";
    cleanText = cleanText.replace(/<[^>]*>?/gm, ''); // Strip HTML tags for cleaner AI ingestion

    return {
      name: chapterData.chapter.name_simple,
      revelation_place: chapterData.chapter.revelation_place,
      verses_count: chapterData.chapter.verses_count,
      info_text: cleanText
    };
  } catch (error) {
    console.error("Error fetching surah info:", surahId, error);
    return null;
  }
};

// Core Reciters with known good segment data
// IDs based on Quran.com API v4
export const AVAILABLE_RECITERS = [
  { id: 7, name: "Mishary Rashid Alafasy (Default)", style: "Murattal" },
  { id: 1, name: "Mahmoud Khalil Al-Husary", style: "Murattal" },
  { id: 2, name: "AbdulBaset AbdulSamad", style: "Murattal" },
  { id: 4, name: "Abu Bakr al-Shatri", style: "Murattal" },
  { id: 3, name: "Abdur-Rahman as-Sudais", style: "Murattal" },
  { id: 5, name: "Hani Ar-Rifai", style: "Murattal" },
  { id: 10, name: "Saud Al-Shuraim", style: "Murattal" },
  { id: 9, name: "Mohamed Siddiq Al-Minshawi", style: "Murattal" },
];

export const getPreferredReciterId = (): number => {
  if (typeof window === "undefined") return 7; // Default for SSR
  const saved = localStorage.getItem("reciterId");
  return saved ? parseInt(saved, 10) : 7; // Default to Mishary Rashid Alafasy (ID 7)
};

// Quran Statistics
export const QURAN_STATS = {
  totalAyahs: 6236,
  totalSurahs: 114,
  totalJuz: 30,
  totalPages: 604,
  totalWords: 77430,
  totalLetters: 323671,
};

// Popular Surahs for quick access
export const POPULAR_SURAHS = [
  { number: 1, name: "Al-Fatihah", arabicName: "الفاتحة", verses: 7 },
  { number: 18, name: "Al-Kahf", arabicName: "الكهف", verses: 110 },
  { number: 36, name: "Ya-Sin", arabicName: "يس", verses: 83 },
  { number: 55, name: "Ar-Rahman", arabicName: "الرحمن", verses: 78 },
  { number: 56, name: "Al-Waqi'ah", arabicName: "الواقعة", verses: 96 },
  { number: 67, name: "Al-Mulk", arabicName: "الملك", verses: 30 },
];

// Translation options with languages
export const TRANSLATIONS = [
  // English
  { id: "20", name: "Saheeh International", language: "English" },
  { id: "85", name: "Abdul Haleem", language: "English" },
  { id: "203", name: "Mustafa Khattab (Clear Quran)", language: "English" },
  { id: "84", name: "Mufti Taqi Usmani", language: "English" },
  { id: "95", name: "Dr. Ghali", language: "English" },
  { id: "22", name: "Pickthall", language: "English" },
  { id: "19", name: "Yusuf Ali", language: "English" },

  // Arabic
  { id: "78", name: "Tafsir Al-Muyassar", language: "Arabic" },
  { id: "91", name: "Tafsir Al-Waseet", language: "Arabic" },

  // Urdu
  { id: "97", name: "Fateh Muhammad Jalandhry", language: "Urdu" },
  { id: "234", name: "Abul Ala Maududi", language: "Urdu" },

  // Bengali
  { id: "161", name: "Muhiuddin Khan", language: "Bengali" },
  { id: "163", name: "Taisirul Quran", language: "Bengali" },

  // Indonesian
  { id: "33", name: "Indonesian Ministry of Religious Affairs", language: "Indonesian" },

  // Turkish
  { id: "77", name: "Diyanet İşleri", language: "Turkish" },
  { id: "112", name: "Elmalılı Hamdi Yazır", language: "Turkish" },

  // French
  { id: "31", name: "Muhammad Hamidullah", language: "French" },
  { id: "136", name: "Rashid Maash", language: "French" },

  // German
  { id: "27", name: "Bubenheim & Elyas", language: "German" },

  // Spanish
  { id: "140", name: "Isa Garcia", language: "Spanish" },

  // Russian
  { id: "45", name: "Elmir Kuliev", language: "Russian" },
  { id: "79", name: "Abu Adel", language: "Russian" },

  // Persian/Farsi
  { id: "29", name: "Ayatollah Makarem Shirazi", language: "Persian" },

  // Malay
  { id: "39", name: "Abdullah Muhammad Basmeih", language: "Malay" },

  // Hindi
  { id: "122", name: "Suhel Farooq Khan", language: "Hindi" },

  // Tamil
  { id: "229", name: "Jan Trust Foundation", language: "Tamil" },

  // Chinese
  { id: "109", name: "Ma Jian", language: "Chinese" },

  // Japanese
  { id: "35", name: "Japanese Translation", language: "Japanese" },

  // Korean
  { id: "219", name: "Korean Translation", language: "Korean" },

  // Portuguese
  { id: "43", name: "Samir El-Hayek", language: "Portuguese" },

  // Italian
  { id: "153", name: "Hamza Roberto Piccardo", language: "Italian" },

  // Dutch
  { id: "144", name: "Salomo Keyzer", language: "Dutch" },

  // Somali
  { id: "46", name: "Abdullahi Yusuf Ali", language: "Somali" },

  // Swahili
  { id: "48", name: "Ali Muhsin Al-Barwani", language: "Swahili" },

  // Thai
  { id: "211", name: "Thai Translation", language: "Thai" },

  // Vietnamese
  { id: "220", name: "Hasan Abdul-Karim", language: "Vietnamese" },

  // Malayalam
  { id: "37", name: "Cheriyamundam Abdul Hameed", language: "Malayalam" },
  { id: "80", name: "Muhammed Karakunnu", language: "Malayalam" },
];

// Group translations by language
export const getTranslationsByLanguage = () => {
  const grouped: { [key: string]: typeof TRANSLATIONS } = {};
  TRANSLATIONS.forEach((t) => {
    if (!grouped[t.language]) {
      grouped[t.language] = [];
    }
    grouped[t.language].push(t);
  });
  return grouped;
};
