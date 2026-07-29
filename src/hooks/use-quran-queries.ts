import { useQuery } from "@tanstack/react-query";
import { 
  fetchSurahs, 
  fetchVerses, 
  fetchChapterVerseAudios,
  getPreferredReciterId,
  fetchUserReadingProfile
} from "@/lib/quran-api";

// Cache keys
export const QURAN_KEYS = {
  surahs: ["surahs"] as const,
  surah: (id: number) => ["surah", id] as const,
  verses: (id: number, transId: number, script: string, wbw: string) => ["verses", id, transId, script, wbw] as const,
  audios: (id: number, reciterId: number) => ["audios", id, reciterId] as const,
  profile: (userId: string) => ["profile", userId] as const,
};

/**
 * Hook to fetch and cache the list of all 114 Surahs
 */
export function useSurahs() {
  return useQuery({
    queryKey: QURAN_KEYS.surahs,
    queryFn: fetchSurahs,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - Surah list almost never changes
  });
}

/**
 * Hook to fetch a specific Surah's metadata from the cached list
 */
export function useSurahMetadata(id: number) {
  const { data: surahs } = useSurahs();
  return surahs?.find(s => s.id === id) || null;
}

/**
 * Hook to fetch and cache verses for a Surah
 */
export function useVerses(surahId: number, translationId: number = 20, script: string = "text_uthmani", wbwLanguage: string = "en") {
  return useQuery({
    queryKey: QURAN_KEYS.verses(surahId, translationId, script, wbwLanguage),
    queryFn: () => fetchVerses(surahId, translationId, 1, 300, script, wbwLanguage),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!surahId,
  });
}

/**
 * Hook to fetch and cache verse audios for a Surah
 */
export function useVerseAudios(surahId: number) {
  const reciterId = getPreferredReciterId();
  return useQuery({
    queryKey: QURAN_KEYS.audios(surahId, reciterId),
    queryFn: () => fetchChapterVerseAudios(surahId, reciterId),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!surahId,
  });
}

/**
 * Hook to fetch only the first few verse audios for a Surah (High Priority)
 * Used to enable "Play" and preheating instantly.
 */
export function usePriorityAudios(surahId: number) {
  const reciterId = getPreferredReciterId();
  return useQuery({
    queryKey: ["audios", surahId, reciterId, "priority"],
    queryFn: () => fetchChapterVerseAudios(surahId, reciterId, 5),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!surahId,
  });
}

/**
 * Hook to fetch the user reading profile (last surah/ayah)
 */
export function useUserReadingProfile(userId: string | undefined) {
  return useQuery({
    queryKey: QURAN_KEYS.profile(userId || ""),
    queryFn: () => fetchUserReadingProfile(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}
