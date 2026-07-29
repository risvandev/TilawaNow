import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { 
  fetchVerses, 
  fetchChapterVerseAudios, 
  getPreferredReciterId 
} from "@/lib/quran-api";
import { QURAN_KEYS } from "./use-quran-queries";

export function usePrefetch() {
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * Prefetch a specific route using Next.js router
   */
  const prefetchRoute = useCallback((path: string) => {
    router.prefetch(path);
  }, [router]);

  /**
   * Prefetch Quran data (verses and audios) for a specific Surah
   */
  const prefetchSurahData = useCallback(async (
    surahId: number, 
    translationId: number = 20, 
    script: string = "text_uthmani",
    wbwLanguage: string = "en"
  ) => {
    const reciterId = getPreferredReciterId();

    // Prefetch Verses
    queryClient.prefetchQuery({
      queryKey: QURAN_KEYS.verses(surahId, translationId, script, wbwLanguage),
      queryFn: () => fetchVerses(surahId, translationId, 1, 300, script, wbwLanguage),
      staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Prefetch Audios
    queryClient.prefetchQuery({
      queryKey: QURAN_KEYS.audios(surahId, reciterId),
      queryFn: () => fetchChapterVerseAudios(surahId, reciterId),
      staleTime: 1000 * 60 * 60, // 1 hour
    });
  }, [queryClient]);

  return {
    prefetchRoute,
    prefetchSurahData
  };
}
