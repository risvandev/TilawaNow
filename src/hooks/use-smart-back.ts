"use client";

import { useRouter } from "next/navigation";

/**
 * Smart back navigation hook.
 * Navigates back if previous history exists within the same site,
 * otherwise falls back directly to the provided path (defaults to '/home').
 */
export function useSmartBack(fallbackPath: string = "/home") {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const isInternalNavigation = 
        document.referrer && 
        document.referrer.includes(window.location.host) &&
        window.history.length > 1;

      if (isInternalNavigation) {
        router.back();
      } else {
        router.push(fallbackPath);
      }
    } else {
      router.push(fallbackPath);
    }
  };

  return handleBack;
}
