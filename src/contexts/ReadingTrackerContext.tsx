"use client";

import React, { createContext, useContext, useRef, useCallback } from "react";
import { useBookmarks } from "./BookmarksContext";

interface ReadingTrackerContextType {
  logSignal: (surahId: number, ayahId: number, signalType: "visibility" | "interaction" | "scroll", requiredDuration?: number) => void;
}

const ReadingTrackerContext = createContext<ReadingTrackerContextType | undefined>(undefined);

export const ReadingTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateReadingHistory } = useBookmarks();
  
  // Track accumulated visibility time per verse
  const visibilityTimes = useRef<Map<string, { duration: number, lastUpdated: number }>>(new Map());
  
  // Track which verses have already been logged as read to prevent spam
  const loggedVerses = useRef<Set<string>>(new Set());

  // Contextual Tracking (Sliding Window): Pending queue for retro-active crediting
  // Map of surahId:ayahId -> { surahId, ayahId }
  const pendingVerses = useRef<Map<string, { surahId: number, ayahId: number }>>(new Map());

  const logSignal = useCallback((surahId: number, ayahId: number, type: "visibility" | "interaction" | "scroll", requiredDuration: number = 3000) => {
    const key = `${surahId}:${ayahId}`;
    const now = Date.now();
    
    // If we've already permanently logged this verse during this session, no need to do anything further
    if (loggedVerses.current.has(key)) return;

    let current = visibilityTimes.current.get(key) || { duration: 0, lastUpdated: now };
    let shouldLog = false;

    if (type === "interaction") {
      shouldLog = true;
    } else if (type === "scroll") {
      // Small boost for intentional scroll pauses
      current.duration += 1000;
      if (current.duration >= requiredDuration) shouldLog = true;
    } else if (type === "visibility") {
      const delta = now - current.lastUpdated;
      // Prevent wild deltas if tab was backgrounded
      if (delta < 5000) {
        current.duration += delta;
      }
      if (current.duration >= requiredDuration) shouldLog = true;
    }

    current.lastUpdated = now;
    visibilityTimes.current.set(key, current);

    if (shouldLog) {
      // 1. Log the current verse
      loggedVerses.current.add(key);
      updateReadingHistory(surahId, key);
      
      // Cleanup to save memory
      visibilityTimes.current.delete(key);
      
      // 2. Retroactive Crediting
      if (pendingVerses.current.size > 0) {
        pendingVerses.current.forEach((pendingVerse, pendingKey) => {
          if (pendingVerse.surahId === surahId) {
            loggedVerses.current.add(pendingKey);
            updateReadingHistory(pendingVerse.surahId, pendingKey);
            visibilityTimes.current.delete(pendingKey);
          }
        });
        pendingVerses.current.clear();
      }
    } else {
      // 3. The Pending State & Streak Breaking
      if (current.duration > 100 && !pendingVerses.current.has(key)) {
        pendingVerses.current.set(key, { surahId, ayahId });
        
        // If they scroll past 4 verses without properly reading them, they are skimming.
        // We flush the queue and they lose credit for the fast-scrolled block.
        if (pendingVerses.current.size > 4) {
          pendingVerses.current.clear();
        }
      }
    }
  }, [updateReadingHistory]);

  return (
    <ReadingTrackerContext.Provider value={{ logSignal }}>
      {children}
    </ReadingTrackerContext.Provider>
  );
};

export const useReadingTracker = () => {
  const context = useContext(ReadingTrackerContext);
  if (context === undefined) {
    throw new Error("useReadingTracker must be used within a ReadingTrackerProvider");
  }
  return context;
};
