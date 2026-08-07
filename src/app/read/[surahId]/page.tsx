"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollButtons } from "@/components/ScrollButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  Pause,
  ChevronLeft,
  BookOpen,
  Volume2,
  Loader2,
  Copy,
  Check,
  AlignRight,
  Info,
  RotateCcw,
  Repeat1,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Word,
  Verse,
  QURAN_STATS,
  POPULAR_SURAHS,
  getTranslationsByLanguage,
} from "@/lib/quran-api";
import { 
  useSurahs,
  useSurahMetadata,
  useVerses,
  useVerseAudios,
  usePriorityAudios,
  useUserReadingProfile 
} from "@/hooks/use-quran-queries";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/AppSidebar";
import { useKhatmah } from "@/contexts/KhatmahContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useReadingTracker } from "@/contexts/ReadingTrackerContext";
import { useAICompanion } from "@/contexts/AICompanionContext";
import { supabase } from "@/lib/supabase";
import { ReadingIndicator } from "@/components/ReadingIndicator";
import { VerseTafsirModal } from "@/components/VerseTafsirModal";
import Fuse from "fuse.js";
import { useToast } from "@/hooks/use-toast";
import { usePrefetch } from "@/hooks/use-prefetch";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";

// Helper to convert English numbers to Arabic numerals
const toArabicNumerals = (num: number | string | undefined | null) => {
  if (num === undefined || num === null) return "";
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
};

// Helper to play word audio
let currentWordAudio: HTMLAudioElement | null = null;

const playWordAudio = (audioUrl: string | null) => {
  if (!audioUrl) return;

  // Prevent playing word audio if the main Quran player is active
  if (typeof window !== 'undefined' && (window as any).isQuranPlaying) {
    return;
  }

  // Stop the previously playing word audio to prevent overlapping sounds
  if (currentWordAudio) {
    currentWordAudio.pause();
    currentWordAudio.currentTime = 0;
  }

  let url = audioUrl;
  if (url.startsWith("//")) {
    url = `https:${url}`;
  } else if (!url.startsWith("http")) {
    url = `https://verses.quran.com/${url}`;
  }
  
  currentWordAudio = new Audio(url);
  currentWordAudio.play().catch(e => {
    if (e.name === 'AbortError') {
      // Expected when play() is interrupted by pause() due to rapid clicking
      return;
    }
    console.error("Error playing word audio:", e);
    console.error("Attempted URL:", url);
  });
};

// Word component with hover tooltip for meaning
const WordWithMeaning = React.memo(({
  word,
  verseNumber,
  showTooltip = true,
  script = "text_uthmani",
  showTransliteration = true,
  className,
  isHighlighted = false
}: {
  word: Word;
  verseNumber?: number;
  showTooltip?: boolean;
  script?: string;
  showTransliteration?: boolean;
  className?: string;
  isHighlighted?: boolean;
}) => {
  // Get Arabic text - dynamic script access with fallback
  let arabicText = (word as any)[script] || word.text_uthmani || (word as any).text || "";
  
  // Clean the text from API artifacts that break rendering:
  // 1. Remove Private Use Area (PUA) characters (often cause □ tofu blocks in Indo-Pak script)
  arabicText = arabicText.replace(/[\uE000-\uF8FF]/g, "");
  // 2. Remove spaces (including zero-width and en-spaces) immediately preceding a Waqf/structural mark
  // This ensures combining marks (like ۗ or ؕ) attach seamlessly to the last letter instead of floating.
  arabicText = arabicText.replace(/[\s\u200B-\u200D]+([\u0615\u06D6-\u06DC\u06DF-\u06ED])/g, "$1");

  if (word.char_type_name === "end") {
    return (
      <span className={cn("inline-flex items-center justify-center relative align-middle select-none mx-0.5", className)}>
        <span className="text-[1.25em] text-muted-foreground/60 font-arabic leading-none">۝</span>
        <span className="absolute inset-0 flex items-center justify-center mt-[0.05em] text-[0.45em] font-bold text-foreground font-sans">
          {toArabicNumerals(verseNumber)}
        </span>
      </span>
    );
  }

  // ── Waqf (pause/stop) signs ──────────────────────────────────────────────
  // These abbreviations appear as small raised annotations in Quran text.
  // Render them as a superscript regardless of char_type_name, because the
  // Quran.com API sometimes tags them as "word" and sometimes as "pause".
  const WAQF_SIGNS = new Set(["ط", "م", "ج", "ز", "ص", "قلى", "قل", "لا", "صلى", "صل", "ق", "س", "ع"]);
  const rawText = arabicText.trim();
  if (WAQF_SIGNS.has(rawText)) {
    return (
      <sup
        className={cn(
          "font-arabic text-[0.52em] text-muted-foreground/60 font-normal select-none tracking-tight",
          className
        )}
        title={`Waqf: ${rawText}`}
      >
        {rawText}
      </sup>
    );
  }

  // ── Combining Waqf marks and Structural signs ─────────────────────────────
  // Unicode marks like ۗ (U+06D7), ؕ (U+0615), ۞ (U+06DE), ۩ (U+06E9).
  // These must NOT have margins or tooltips, so the browser shaping engine
  // can seamlessly attach them to the preceding letter across span boundaries.
  const code = rawText.length > 0 ? rawText.codePointAt(0) ?? 0 : 0;
  const isQuranStructural =
    (code >= 0x0600 && code <= 0x0607) || // Arabic number/sign marks
    (code >= 0x0610 && code <= 0x061F) || // Arabic small high marks (incl. ؕ)
    (code >= 0x06D0 && code <= 0x06FF);   // Arabic extended block (Waqf, ۞, ۩…)

  if (word.char_type_name !== "word" || (rawText.length <= 2 && isQuranStructural)) {
    return (
      <span className={cn("font-arabic text-muted-foreground/80 select-none", className)}>
        {rawText}
      </span>
    );
  }


  const content = (

    <span
      id={isHighlighted ? "active-word" : undefined}
      className={cn(
        "font-arabic cursor-pointer transition-all duration-200 inline-block text-[inherit]",
        !isHighlighted && "text-inherit hover:text-accent",
        isHighlighted && "word-highlight",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        playWordAudio(word.audio_url);
      }}
      dangerouslySetInnerHTML={script === "text_uthmani_tajweed" ? { __html: arabicText } : undefined}
    >
      {script !== "text_uthmani_tajweed" ? arabicText : undefined}
    </span>
  );

  if (!showTooltip || (!word.translation && !word.transliteration)) {
    return content;
  }

  return (
    <span className="group/word relative inline-block">
      {content}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 opacity-0 group-hover/word:opacity-100 transition-all duration-200 bg-card border border-border shadow-xl rounded-md p-1.5 min-w-max max-w-[16rem] scale-95 group-hover/word:scale-100 origin-bottom flex flex-col items-center justify-center">
        {word.translation && (
          <span className="text-sm font-medium text-foreground text-center font-sans block">
            {word.translation.text}
          </span>
        )}
        {showTransliteration && word.transliteration && word.transliteration.text && (
          <span className="text-[10px] md:text-xs text-muted-foreground italic text-center font-sans block mt-0.5">
            {word.transliteration.text}
          </span>
        )}
      </span>
    </span>
  );
}, (prev, next) => {
  return prev.isHighlighted === next.isHighlighted &&
    prev.script === next.script &&
    prev.showTransliteration === next.showTransliteration &&
    prev.word.id === next.word.id;
});

// Verse Audio Player
const VerseAudioButton = React.memo(({
  audioUrl,
  isPlaying,
  isLoading,
  onPlay,
  onPause
}: {
  audioUrl: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
}) => {
  if (!audioUrl) return null;

  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={isPlaying ? onPause : onPlay}
      className={cn(
        "text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
        isPlaying && "text-primary bg-primary/5"
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </Button>
  );
});

// Verse Row Component
const VerseRow = React.memo(({
  verse,
  surahId,
  verseAudios,
  quranScript,
  isReadMode,
  isLoading,
  handleCopyVerse,
  isCurrentVerse,
  isVersePlayingNow,
  currentWordPosition,
  marked,
  onPlayVerse,
  onPlayFromVerse,
  onTogglePlay,
  onToggleMark,
  onSetLoopMode,
  onPreheat,
  loopMode,
  showTransliteration,
  onOpenTafsir,
  index = 0,
}: {
  verse: Verse,
  surahId: number,
  verseAudios: Map<string, any>,
  quranScript: string,
  isReadMode: boolean,
  isLoading: boolean,
  handleCopyVerse: (v: Verse) => void,
  isCurrentVerse: boolean,
  isVersePlayingNow: boolean,
  currentWordPosition: number | null,
  marked: boolean,
  onPlayVerse: (v: Verse) => void,
  onPlayFromVerse: (vk: string) => void,
  onTogglePlay: () => void,
  onToggleMark: (s: number, v: number, t: 'ayah' | 'surah') => void,
  onSetLoopMode: (m: 'NONE' | 'AYAH' | 'SURAH') => void,
  onPreheat: (v: Verse) => void,
  loopMode: 'NONE' | 'AYAH' | 'SURAH',
  showTransliteration: boolean,
  onOpenTafsir: (verseKey: string, textUthmani: string) => void,
  index?: number,
}) => {
  const verseKey = verse.verse_key;
  const verseAudioData = verseAudios.get(verseKey);
  const [copied, setCopied] = useState(false);

  const handleLocalCopy = () => {
    handleCopyVerse(verse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLocalPlayVerse = (v: Verse) => {
    onPlayVerse(v);
  };

  const handleLocalPlayFromVerse = (vk: string) => {
    onPlayFromVerse(vk);
  };

  const handlePreheat = () => {
    const audioInfo = verseAudios.get(verse.verse_key);
    if (audioInfo) {
      onPreheat({ ...verse, audio: { url: audioInfo.url, segments: audioInfo.segments } });
    }
  };

  if (isReadMode) {
    const isFatihaBismillah = surahId === 1 && verse.verse_number === 1;
    const Container = isFatihaBismillah ? "div" : "span";
    return (
      <Container
        key={verse.id}
        data-ayah-id={verse.verse_number}
        className={cn(
          isFatihaBismillah 
            ? "relative block mb-12 px-4 text-center w-full" 
            : "relative inline px-0.5 transition-colors duration-500"
        )}
        id={`verse-${surahId}:${verse.verse_number}`}
      >
        {verse.words?.filter(w => w.char_type_name !== "end").map((w, i, arr) => {
          const isNextWaqf = arr[i + 1]?.char_type_name === "pause";
          return (
            <React.Fragment key={w.id}>
              <WordWithMeaning
                word={w}
                verseNumber={verse.verse_number}
                showTooltip={false}
                script={quranScript}
                showTransliteration={showTransliteration}
                className={cn(isFatihaBismillah ? "text-3xl md:text-5xl" : "")}
                isHighlighted={isCurrentVerse && currentWordPosition === w.position}
              />
              {!isNextWaqf && " "}
            </React.Fragment>
          );
        })}
        <span 
          className="relative inline-flex items-center justify-center mx-1.5 md:mx-3 align-middle select-none cursor-pointer group/symbol hover:scale-110 transition-transform duration-200" 
          onClick={(e) => { e.stopPropagation(); handleLocalPlayFromVerse(verse.verse_key); }}
        >
          <span className="text-foreground/20 text-[1.4em] md:text-[1.8em] group-hover/symbol:text-primary transition-colors duration-200 font-arabic leading-none">۝</span>
          <span className="absolute inset-0 flex items-center justify-center text-[0.45em] md:text-[0.6em] font-sans font-bold text-primary/80 mt-[0.1em]">
            {toArabicNumerals(verse.verse_number)}
          </span>
        </span>
      </Container>
    );
  }

  return (
    <div 
      key={verse.id} 
      id={`verse-${surahId}:${verse.verse_number}`} 
      data-ayah-id={verse.verse_number} 
      className={cn(
        "w-auto md:w-full opacity-0 animate-fade-in group transition-all duration-500 virtual-row",
        "-mx-4 px-4 md:px-6 md:mx-0 border-b border-white/5 py-5 rounded-none",
        index % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]",
        "md:glass-card md:border md:border-white/10 md:rounded-[2rem] md:p-6 md:mb-4 md:shadow-lg",
        isCurrentVerse && [
          "bg-primary/[0.03] border-b-primary/40",
          "md:border-primary/50 md:bg-primary/5 md:shadow-[0_0_20px_rgba(var(--primary),0.1)] md:ring-1 md:ring-primary/20 md:scale-[1.01]"
        ]
      )} 
      style={{ animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onToggleMark(surahId, verse.verse_number, 'ayah')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border backdrop-blur-sm mx-1 shrink-0",
                marked
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/40"
              )}
              title={marked ? "Unmark Ayah" : "Mark Ayah"}
            >
              {marked ? 'Marked' : 'Mark'}
            </button>
            <VerseAudioButton audioUrl={verseAudioData?.url || null} isPlaying={isVersePlayingNow} isLoading={isLoading && isCurrentVerse} onPlay={() => handleLocalPlayVerse(verse)} onPause={onTogglePlay} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleLocalPlayFromVerse(verse.verse_key)} 
              onMouseEnter={handlePreheat} 
              className="h-auto py-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-md transition-all duration-300" 
              title="Play from here"
            >
              Play Here
            </Button>
            <Button variant="ghost" size="iconSm" onClick={() => { handleLocalPlayVerse(verse); onSetLoopMode(loopMode === 'AYAH' ? 'NONE' : 'AYAH'); }} onMouseEnter={handlePreheat} className={cn("hover:bg-primary/10", (loopMode === 'AYAH' && isCurrentVerse) ? "text-primary" : "text-muted-foreground")} title="Repeat Ayah"><Repeat1 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="iconSm" onClick={handleLocalCopy} className={cn("hover:bg-primary/10", copied ? "text-emerald-500" : "text-muted-foreground")} title="Copy Ayah">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="iconSm" onClick={() => onOpenTafsir(verse.verse_key, verse.text_uthmani)} className="text-muted-foreground hover:text-primary hover:bg-primary/10" title="Read Tafsir"><BookOpen className="w-4 h-4" /></Button>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="iconSm" className="text-muted-foreground h-7 w-7">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-card border-border shadow-xl">
                <DropdownMenuItem onClick={handleLocalCopy} className="gap-2 focus:bg-primary/10 focus:text-primary">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="font-bold text-[10px] uppercase tracking-wider">{copied ? 'Copied' : 'Copy Ayah'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { handleLocalPlayVerse(verse); onSetLoopMode(loopMode === 'AYAH' ? 'NONE' : 'AYAH'); }} className="gap-2 focus:bg-primary/10 focus:text-primary">
                  <Repeat1 className={cn("w-3.5 h-3.5", (loopMode === 'AYAH' && isCurrentVerse) ? "text-primary" : "")} />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Repeat Ayah</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenTafsir(verse.verse_key, verse.text_uthmani)} className="gap-2 focus:bg-primary/10 focus:text-primary">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Read Tafsir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => onToggleMark(surahId, verse.verse_number, 'ayah')}
              className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tight transition-all duration-300 border backdrop-blur-sm shrink-0",
                marked
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
              )}
            >
              {marked ? 'Marked' : 'Mark'}
            </button>
            <VerseAudioButton audioUrl={verseAudioData?.url || null} isPlaying={isVersePlayingNow} isLoading={isLoading && isCurrentVerse} onPlay={() => handleLocalPlayVerse(verse)} onPause={onTogglePlay} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleLocalPlayFromVerse(verse.verse_key)} 
              className="h-auto py-0.5 px-2 text-[9px] font-bold uppercase tracking-tight text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-md transition-all duration-300"
            >
              Play Here
            </Button>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{verseKey}</span>
      </div>
      <div className={`w-full mb-3 py-6 md:py-8 text-3xl md:text-5xl ${surahId === 1 && verse.verse_number === 1 ? 'text-center' : 'text-right'}`} dir="rtl" style={{ lineHeight: 2.2 }}>
        <div className="inline" style={{ wordSpacing: "normal" }}>
          {(verse.words && verse.words.length > 0) ? verse.words.map((w, i, arr) => {
            const isNextWaqf = arr[i + 1]?.char_type_name === "pause";
            return (
              <React.Fragment key={w.id}>
                <WordWithMeaning 
                  word={w} 
                  verseNumber={verse.verse_number} 
                  showTooltip={true} 
                  script={quranScript} 
                  showTransliteration={showTransliteration}
                  isHighlighted={isCurrentVerse && currentWordPosition === w.position} 
                />
                {!isNextWaqf && " "}
              </React.Fragment>
            );
          }) : <p className="quran-verse">{verse.text_uthmani}</p>}
        </div>
      </div>
      {verse.translations && verse.translations[0] && <div className="border-t border-border/50 pt-4"><p className="text-muted-foreground text-xs md:text-base leading-relaxed text-left">{verse.translations[0].text.replace(/<[^>]*>/g, "")}</p></div>}
    </div>
  );
}, (prev, next) => {
  return (
    prev.verse.id === next.verse.id &&
    prev.isCurrentVerse === next.isCurrentVerse &&
    prev.isVersePlayingNow === next.isVersePlayingNow &&
    prev.currentWordPosition === next.currentWordPosition &&
    prev.marked === next.marked &&
    (prev.isCurrentVerse ? prev.isLoading === next.isLoading : true) &&
    prev.loopMode === next.loopMode &&
    prev.isReadMode === next.isReadMode &&
    prev.quranScript === next.quranScript &&
    prev.showTransliteration === next.showTransliteration
  );
});

// Surah List Component
const SurahList = () => {
  const { prefetchSurahData } = usePrefetch();
  const { data: surahs = [], isLoading: isSurahsLoading } = useSurahs();
  const { toggleMark, isMarked } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState("");
  const { isKhatmahActive, currentProgress, isLoading: isKhatmahLoading, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const router = useRouter();
  const { isExpanded } = useSidebar();
  const isSidebarOpen = isExpanded; // Ignore hover to prevent layout thrashing on heavy pages

  const fuse = new Fuse(surahs, {
    keys: ["name_simple", "name_arabic", "translated_name.name", "id", "revelation_place"],
    threshold: 0.4,
    distance: 100,
  });

  const filteredSurahs = !searchQuery 
    ? surahs 
    : fuse.search(searchQuery).map(result => result.item);

  if (isSurahsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative container mx-auto px-4 md:px-6 py-8 transition-all duration-300",
      !isSidebarOpen ? "max-w-7xl" : "max-w-5xl"
    )}>
      {/* Ambient Mac-like Glows */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vh] rounded-full bg-primary/10 blur-[120px] pointer-events-none opacity-60 mix-blend-screen z-0" />
      <div className="absolute top-[30vh] right-0 w-[40vw] h-[40vh] rounded-full bg-premium-accent/10 blur-[120px] pointer-events-none opacity-50 mix-blend-screen z-0" />
      
      <div className="relative z-10">
        <div className="mb-6 md:mb-8 flex items-center justify-between gap-2 md:gap-4 p-4 md:p-0 bg-secondary/30 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-[2rem] md:rounded-none border border-white/10 md:border-transparent shadow-lg shadow-black/20 md:shadow-none animate-fade-in-up mt-2 md:mt-0">
          <div className="flex-1 min-w-0 shrink-0">
            <p className="md:hidden text-[10px] text-muted-foreground/80 font-bold tracking-wider uppercase mb-0.5">
              {QURAN_STATS.totalSurahs} Surahs
            </p>
            <h1 className="text-xl md:text-3xl font-extrabold text-foreground mb-0 md:mb-2 whitespace-nowrap">
              Read Quran
            </h1>
            <p className="hidden md:block text-sm md:text-base text-muted-foreground whitespace-nowrap">
              {QURAN_STATS.totalSurahs} Surahs • {QURAN_STATS.totalAyahs.toLocaleString()} Ayahs
            </p>
          </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {currentProgress && (
            <Button
              variant="outline"
              size="icon"
              className="text-destructive border-white/10 bg-secondary/40 backdrop-blur-xl hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 h-10 w-10 md:h-10 md:w-10 rounded-full md:rounded-xl shrink-0 shadow-lg"
              onClick={async () => {
                if (confirm("Are you sure you want to restart your Khatmah from the beginning?")) {
                  await restartKhatmah();
                }
              }}
              disabled={isKhatmahLoading}
              title="Restart Khatmah"
            >
              <RotateCcw className="w-4 h-4 md:w-4 md:h-4" />
            </Button>
          )}

          <Button
            variant="hero"
            className="gap-1.5 md:gap-2 shadow-lg shadow-primary/20 h-10 px-3 md:h-10 md:px-4 text-xs md:text-sm shrink-0 rounded-full md:rounded-xl"
            onClick={async () => {
              if (isKhatmahActive) {
                stopKhatmah();
              } else {
                await startKhatmah();
                const targetSurah = currentProgress?.surah_id || 1;
                router.push(`/read/${targetSurah}`);
              }
            }}
            disabled={isKhatmahLoading}
          >
            {isKhatmahLoading ? (
              <Loader2 className="w-4 h-4 md:w-4 md:h-4 animate-spin" />
            ) : isKhatmahActive ? (
              <>
                <Pause className="w-4 h-4 md:w-4 md:h-4" />
                <span className="md:hidden font-bold tracking-wide">Stop</span>
                <span className="hidden md:inline font-bold">Stop Khatmah</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 md:w-4 md:h-4" />
                <span className="md:hidden font-bold tracking-wide">{currentProgress ? "Resume" : "Khatmah"}</span>
                <span className="hidden md:inline font-bold">{currentProgress ? "Resume Khatmah" : "Start Khatmah"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="relative mb-12 max-w-2xl mx-auto group/search">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-premium-accent/20 to-primary/20 rounded-full blur-xl opacity-0 group-hover/search:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-center bg-black/80 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all duration-300">
          <Search className="absolute left-5 w-5 h-5 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Search Surahs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 pr-6 h-14 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-base"
          />
        </div>
      </div>

      <VirtuosoGrid
        useWindowScroll
        data={filteredSurahs}
        listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        itemContent={(index, surah) => {
          const marked = isMarked(surah.id, null, 'surah');
          return (
            <Link
              key={surah.id}
              href={`/read/${surah.id}`}
              onMouseEnter={() => prefetchSurahData(surah.id)}
              className="group relative flex flex-row md:flex-col items-center md:items-stretch bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:scale-[1.02] transition-all duration-500 opacity-0 animate-fade-in p-4 md:p-0 h-full"
              style={{ animationDelay: `${(index % 20) * 30}ms`, animationFillMode: "forwards" }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleMark(surah.id, null, 'surah');
                }}
                className={cn(
                  "absolute top-4 right-4 z-10 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border backdrop-blur-sm hidden md:block",
                  marked
                    ? "bg-premium-accent border-premium-accent text-white shadow-lg shadow-premium-accent/25"
                    : "bg-background/40 border-white/20 text-white/70 hover:bg-background/60 hover:border-white/40"
                )}
              >
                {marked ? 'Marked' : 'Mark'}
              </button>
 
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleMark(surah.id, null, 'surah');
                }}
                className={cn(
                  "md:hidden w-12 h-12 shrink-0 rounded-[1rem] flex items-center justify-center font-bold text-sm mr-4 transition-all duration-500 cursor-pointer active:scale-90",
                  marked 
                    ? "bg-premium-accent text-white shadow-lg shadow-premium-accent/20" 
                    : "bg-white/[0.03] text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:shadow-lg"
                )}
              >
                {surah.id}
              </div>
 
              <div className="hidden md:flex aspect-video md:aspect-[3/2] w-full bg-gradient-to-b from-primary/5 to-transparent items-center justify-center p-4 relative group-hover:from-primary/10 transition-colors duration-300">
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMark(surah.id, null, 'surah');
                  }}
                  className={cn(
                    "absolute top-4 left-4 w-10 h-10 rounded-lg backdrop-blur-sm border flex items-center justify-center font-bold shadow-sm transition-all duration-300 cursor-pointer active:scale-95 z-20",
                    marked
                      ? "bg-premium-accent border-premium-accent text-white shadow-lg shadow-premium-accent/25"
                      : "bg-background/50 border-border text-foreground hover:bg-background/80"
                  )}
                  title={marked ? "Unmark Surah" : "Mark Surah"}
                >
                  {surah.id}
                </div>
                <p className="font-arabic text-4xl md:text-5xl text-foreground/90 group-hover:text-primary transition-colors duration-300 drop-shadow-sm text-center leading-relaxed py-4 translate-y-4">
                  {surah.name_arabic}
                </p>
              </div>

              <div className="flex-1 min-w-0 flex flex-row md:flex-col items-center md:items-stretch justify-between md:p-5 md:pt-2">
                <div className="min-w-0 pr-2">
                  <h3 className="font-extrabold text-base md:text-xl text-foreground tracking-tight group-hover:text-primary transition-colors duration-500 truncate mb-0.5">
                    {surah.name_simple}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate font-medium opacity-80">
                    {surah.translated_name.name}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0 md:hidden">
                  <span className="font-arabic text-2xl text-foreground/90 group-hover:text-primary transition-colors duration-500 mb-1 drop-shadow-sm">
                    {surah.name_arabic}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.2em] font-bold">
                    {surah.verses_count} Ayahs
                  </span>
                </div>

                <div className="hidden md:flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    {surah.verses_count} Ayahs
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-60">
                    {surah.revelation_place}
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-opacity duration-500" />
            </Link>
          );
        }}
      />
      </div>
    </div>
  );
};

// Surah Reader Component
const SurahReader = ({ surahId }: { surahId: number }) => {
  const { toast } = useToast();
  const { prefetchSurahData } = usePrefetch();
  const [translationId] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem("quranTranslation") || "20" : "20";
  });
  const [wbwLanguage] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem("wbwLanguage") || "en" : "en";
  });
  const [showTransliteration] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem("showTransliteration") !== "false" : true;
  });
  const [tafsirId] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem("tafsirId") || "169" : "169";
  });
  const [tafsirModalState, setTafsirModalState] = useState({
    isOpen: false,
    verseKey: "",
    verseTextUthmani: "",
  });
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const modeParam = searchParams.get('mode');
  const ayahParam = searchParams.get('verse') || searchParams.get('ayah');
  const playParam = searchParams.get('play');
  const isReadMode = modeParam === 'reading';

  const setIsReadMode = useCallback((reading: boolean) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (reading) {
      newParams.set('mode', 'reading');
    } else {
      newParams.set('mode', 'translation');
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);
  const [quranScript] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem("quranScript") || "text_uthmani" : "text_uthmani";
  });

  const { user } = useAuth();
  const surah = useSurahMetadata(surahId);
  const { data: userReadingProfile } = useUserReadingProfile(user?.id);
  const { data: priorityAudios } = usePriorityAudios(surahId);
  const { data: versesData, isLoading: isVersesLoading } = useVerses(surahId, parseInt(translationId), quranScript, wbwLanguage);
  const verses = versesData?.verses || [];
  const { data: verseAudios = new Map(), isLoading: isAudiosLoading } = useVerseAudios(surahId);

  const loading = isVersesLoading || isAudiosLoading;

  const combinedAudios = useMemo(() => {
    const map = new Map(verseAudios);
    if (priorityAudios) {
      priorityAudios.forEach((v, k) => map.set(k, v));
    }
    return map;
  }, [verseAudios, priorityAudios]);

  const handleOpenTafsir = useCallback((verseKey: string, verseTextUthmani: string) => {
    setTafsirModalState({
      isOpen: true,
      verseKey,
      verseTextUthmani,
    });
  }, []);

  const versesByPage = useMemo(() => {
    return verses.reduce((acc: Record<number, Verse[]>, v) => {
      const p = v.page_number;
      if (!acc[p]) acc[p] = [];
      acc[p].push(v);
      return acc;
    }, {});
  }, [verses]);

  const pages = useMemo(() => Object.entries(versesByPage), [versesByPage]);

  const { 
    preheatAudio, 
    currentVerseKey, 
    currentWordPosition, 
    isPlaying, 
    togglePlay, 
    playSurah,
    playVerse: playVerseGlobal,
    currentSurah: activeSurah,
    isLoading,
    loopMode,
    setLoopMode,
    isPlayerVisible,
  } = useAudioPlayer();


  const { updateReadingHistory, isMarked, toggleMark } = useBookmarks();
  const { updateCurrentContext } = useAICompanion();
  const { logSignal } = useReadingTracker();
  const currentTrackingSurahIdRef = useRef<number | null>(null);
  const lastLoggedVerseRef = useRef<string | null>(null);
  const visibleAyahsRef = useRef<Set<number>>(new Set());
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const virtuosoRef = useRef<any>(null);
  const readVirtuosoRef = useRef<any>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isJumping, setIsJumping] = useState(false);

  const cinematicJump = useCallback((direction: 'top' | 'bottom') => {
    setIsJumping(true);
    
    setTimeout(() => {
      if (direction === 'top') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        if (isReadMode && readVirtuosoRef.current) {
          readVirtuosoRef.current.scrollToIndex({ index: pages.length - 1, align: 'end' });
        } else if (!isReadMode && virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({ index: verses.length - 1, align: 'end' });
        }
        setTimeout(() => {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
        }, 50);
      }
      
      setTimeout(() => {
        setIsJumping(false);
      }, 50);
      
    }, 200);
  }, [isReadMode, verses.length, pages.length]);

  const logVerseReading = useCallback((sId: number, vKey: string) => {
    if (lastLoggedVerseRef.current === vKey) return;
    updateReadingHistory(sId, vKey);
    lastLoggedVerseRef.current = vKey;

    const ayahNum = parseInt(vKey.split(":")[1]);
    if (!isNaN(ayahNum)) {
      updateCurrentContext(sId, ayahNum, vKey);
    }
  }, [updateReadingHistory, updateCurrentContext]);

  useEffect(() => {
    const currentAudioMap = (priorityAudios?.size ? priorityAudios : verseAudios) as Map<string, any>;
    
    if (!isVersesLoading && verses.length > 0 && currentAudioMap?.size > 0 && !isPlaying && activeSurah?.id !== surahId) {
      const firstVerse = verses[0];
      const info1 = currentAudioMap.get(firstVerse.verse_key);
      if (info1) {
        preheatAudio({ ...firstVerse, audio: { url: info1.url, segments: info1.segments } }, 'ACTIVE');
      }

      if (verses.length > 1) {
        const secondVerse = verses[1];
        const info2 = currentAudioMap.get(secondVerse.verse_key);
        if (info2) {
          preheatAudio({ ...secondVerse, audio: { url: info2.url, segments: info2.segments } }, 'INACTIVE');
        }
      }
    }
  }, [isVersesLoading, verses, priorityAudios, verseAudios, preheatAudio, isPlaying, activeSurah, surahId]);

  useEffect(() => {
    const currentAudioMap = (priorityAudios?.size ? priorityAudios : verseAudios) as Map<string, any>;

    if (!isVersesLoading && verses.length > 0 && userReadingProfile?.last_read_surah === surahId && currentAudioMap?.size > 0 && !isPlaying) {
      const lastVerseNumber = userReadingProfile.last_read_ayah;
      const lastVerse = verses.find(v => v.verse_number === lastVerseNumber);
      if (lastVerse) {
        const info = currentAudioMap.get(lastVerse.verse_key);
        if (info) {
          const verseWithAudio = { ...lastVerse, audio: { url: info.url, segments: info.segments } };
          preheatAudio(verseWithAudio, 'ACTIVE');
          
          const nextIdx = verses.findIndex(v => v.verse_number === lastVerseNumber) + 1;
          if (nextIdx < verses.length) {
            const nextVerse = verses[nextIdx];
            const nextInfo = currentAudioMap.get(nextVerse.verse_key);
            if (nextInfo) {
               preheatAudio({ ...nextVerse, audio: { url: nextInfo.url, segments: nextInfo.segments } }, 'INACTIVE');
            }
          }
        }
      }
    }
  }, [isVersesLoading, verses, userReadingProfile, surahId, preheatAudio, priorityAudios, verseAudios, isPlaying]);

  const handleToggleMark = useCallback((s: number, v: number, t: 'ayah' | 'surah') => {
    toggleMark(s, v, t);
  }, [toggleMark]);

  const handleSetLoopMode = useCallback((m: 'NONE' | 'AYAH' | 'SURAH') => {
    setLoopMode(m);
  }, [setLoopMode]);

  const handlePlayVerseCallback = useCallback((verse: Verse) => {
    const key = verse.verse_key;
    const audioInfo = combinedAudios.get(key);
    if (!audioInfo) return;
    const verseWithAudio = { ...verse, audio: { url: audioInfo.url, segments: audioInfo.segments } };
    if (isPlaying && currentVerseKey !== key.toString()) {
      setPendingAction(() => () => { if (surah) playVerseGlobal(verseWithAudio, surah); });
      setShowConfirmDialog(true);
    } else if (currentVerseKey === key.toString()) {
      togglePlay();
    } else {
      if (surah) playVerseGlobal(verseWithAudio, surah);
    }
  }, [combinedAudios, isPlaying, currentVerseKey, togglePlay, playVerseGlobal, surah]);

  const handlePlayFromVerseCallback = useCallback((verseKey: string, forcePlay: boolean = false) => {
    if (!surah) return;
    const playlist = verses.map(v => {
      const audioInfo = combinedAudios.get(v.verse_key);
      return {
        ...v,
        audio: {
          url: audioInfo?.url || v.audio?.url || "",
          segments: audioInfo?.segments
        }
      };
    });
    const resumeVerse = verseKey;
    if (isPlaying && !forcePlay) {
      setPendingAction(() => () => playSurah(surah, playlist, resumeVerse));
      setShowConfirmDialog(true);
    } else {
      playSurah(surah, playlist, resumeVerse);
    }
  }, [verses, combinedAudios, isPlaying, playSurah, surah]);

  const handleCopyVerseCallback = useCallback((verse: Verse) => {
    let arabicText = "";
    if (verse.words) {
      const filteredWords = verse.words.filter(w => w.char_type_name !== "end");
      filteredWords.forEach((w, idx) => {
        const txt = ((w as any)[quranScript] || w.text_uthmani || "").replace(/<[^>]*>/g, "").trim();
        if (txt) {
          const isNextWaqf = filteredWords[idx + 1]?.char_type_name === "pause";
          arabicText += txt + (isNextWaqf ? "" : " ");
        }
      });
      arabicText = arabicText.trim();
    } else {
      arabicText = verse.text_imlaei && quranScript === "text_imlaei" ? verse.text_imlaei : verse.text_uthmani;
    }

    navigator.clipboard.writeText(arabicText);
    logSignal(surahId, verse.verse_number, "interaction");
  }, [surahId, quranScript, toast, logSignal]);

  // Detect manual scrolling to pause auto-scroll
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      
      // If playing, set a timer to resume auto-scroll after 3 seconds of inactivity
      if (isPlaying) {
        inactivityTimerRef.current = setTimeout(() => {
          setIsAutoScrollEnabled(true);
        }, 3000);
      }
    };

    const handleUserScroll = () => {
      if (userScrollingRef.current) return;
      
      // If we detect a scroll that wasn't triggered by our code
      setIsAutoScrollEnabled(false);
      resetInactivityTimer();
    };

    const handleTouchStart = () => { 
      userScrollingRef.current = true; 
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };

    const handleTouchEnd = () => { 
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 1000);
      resetInactivityTimer();
    };

    window.addEventListener('wheel', handleUserScroll, { passive: true });
    window.addEventListener('touchmove', handleUserScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('mousedown', resetInactivityTimer, { passive: true });
    window.addEventListener('keydown', resetInactivityTimer, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isPlaying]);
  
  // Handle manual scroll to current ayah request
  useEffect(() => {
    const handleScrollToAyah = (e: any) => {
      const verseKey = e.detail?.verseKey;
      if (!verseKey) return;
      
      const verseIndex = verses.findIndex(v => v.verse_key === verseKey);
      if (verseIndex >= 0) {
        // When user explicitly clicks "scroll to ayah", re-enable auto-scroll
        setIsAutoScrollEnabled(true);
        userScrollingRef.current = true;

        if (virtuosoRef.current) {
          const isFar = Math.abs((lastScrolledVerseIndexRef.current || 0) - verseIndex) > 5;
          virtuosoRef.current.scrollToIndex({
            index: verseIndex,
            align: 'center',
            behavior: isFar ? 'auto' : 'smooth'
          });
          lastScrolledVerseIndexRef.current = verseIndex;
        } else {
          // Fallback for non-virtualized mode (e.g. Reading Mode)
          const element = document.getElementById(`verse-${verseKey}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }

        // Reset userScrolling after animation
        setTimeout(() => {
          userScrollingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('scroll-to-ayah', handleScrollToAyah);
    return () => window.removeEventListener('scroll-to-ayah', handleScrollToAyah);
  }, [verses]);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const translationsByLanguage = getTranslationsByLanguage();
  useEffect(() => {
    if (loading || !surah) return;

    if (currentTrackingSurahIdRef.current !== surahId) {
      // 3. Update tracking ref and log initial verse
      currentTrackingSurahIdRef.current = surahId;
      logVerseReading(surahId, `${surahId}:1`);

      // 5. Prefetch next surah
      if (surahId < 114) {
        prefetchSurahData(surahId + 1, parseInt(translationId), quranScript);
      }
    }
  }, [surahId, loading, surah, logVerseReading, prefetchSurahData, translationId, quranScript]);
  

  const lastScrolledVerseRef = useRef<string | null>(null);
  const lastScrolledVerseIndexRef = useRef<number>(0);

  useEffect(() => {
    if (!loading && currentVerseKey && currentVerseKey.startsWith(`${surahId}:`)) {
      const verseIndex = verses.findIndex(v => v.verse_key === currentVerseKey);
      
      if (verseIndex >= 0 && isPlaying && isAutoScrollEnabled) {
        // Prevent redundant scrolling to the exact same verse in a short span
        if (lastScrolledVerseRef.current !== currentVerseKey) {
          userScrollingRef.current = true;
          
          if (isReadMode && readVirtuosoRef.current) {
            const targetVerse = verses[verseIndex];
            const pageIndex = pages.findIndex(([pageStr]) => parseInt(pageStr) === targetVerse.page_number);
            if (pageIndex >= 0) {
              const isFar = Math.abs((lastScrolledVerseIndexRef.current || 0) - pageIndex) > 2;
              readVirtuosoRef.current.scrollToIndex({
                index: pageIndex,
                align: 'start',
                behavior: isFar ? 'auto' : 'smooth'
              });
              lastScrolledVerseIndexRef.current = pageIndex;
            }
          } else if (!isReadMode && virtuosoRef.current) {
            // Fix bounce by using instant scroll if the target is far away
            const isFar = Math.abs((lastScrolledVerseIndexRef.current || 0) - verseIndex) > 3;
            virtuosoRef.current.scrollToIndex({
              index: verseIndex,
              align: 'center',
              behavior: isFar ? 'auto' : 'smooth'
            });
            lastScrolledVerseIndexRef.current = verseIndex;
          } else {
            const element = document.getElementById(`verse-${currentVerseKey}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
          
          lastScrolledVerseRef.current = currentVerseKey;
          
          // Reset userScrolling after animation
          setTimeout(() => {
            userScrollingRef.current = false;
          }, 1000);
        }
      }

      logVerseReading(surahId, currentVerseKey);
      const ayahId = parseInt(currentVerseKey.split(":")[1]);
      if (!isNaN(ayahId)) {
        logSignal(surahId, ayahId, "interaction");
      }
    }
  }, [currentVerseKey, surahId, logVerseReading, loading, logSignal, verses, isPlaying, isAutoScrollEnabled, isReadMode, pages]);

  // Handle initial scroll to ayah from query parameter
  const hasPlayedInitialRef = useRef(false);
  useEffect(() => {
    if (!loading && verses.length > 0 && ayahParam) {
      const ayahNumber = parseInt(ayahParam);
      if (!isNaN(ayahNumber)) {
        const verseKey = `${surahId}:${ayahNumber}`;
        
        // Add a small delay to ensure DOM / Virtuoso are fully rendered
        const timer = setTimeout(() => {
          if (isReadMode) {
            // Find which page this verse belongs to
            const targetVerse = verses.find(v => v.verse_key === verseKey);
            if (targetVerse && readVirtuosoRef.current) {
              const pageIndex = pages.findIndex(([pageStr]) => parseInt(pageStr) === targetVerse.page_number);
              if (pageIndex >= 0) {
                readVirtuosoRef.current.scrollToIndex({
                  index: pageIndex,
                  align: 'start',
                  behavior: 'auto'
                });
              }
            }
          } else {
            const verseIndex = verses.findIndex(v => v.verse_key === verseKey);
            if (verseIndex >= 0 && virtuosoRef.current) {
              virtuosoRef.current.scrollToIndex({
                index: verseIndex,
                align: 'center',
                behavior: 'auto'
              });
            }
          }
          if (playParam === 'true' && !hasPlayedInitialRef.current) {
            hasPlayedInitialRef.current = true;
            handlePlayFromVerseCallback(verseKey, true);
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, verses, ayahParam, surahId, isReadMode, pages, playParam, handlePlayFromVerseCallback]);

  const confirmPlaybackSwitch = () => {
    if (pendingAction) pendingAction();
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const cancelPlaybackSwitch = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const { isExpanded } = useSidebar();
  const isSidebarOpen = isExpanded; // Ignore hover to prevent layout thrashing on heavy pages

  const handleItemsRendered = useCallback((items: any[]) => {
    visibleAyahsRef.current.clear();
    items.forEach(item => {
      if (item.data?.verse_number) {
        visibleAyahsRef.current.add(item.data.verse_number);
      }
    });
  }, []);

  // Ghost Prevention (Idle Detection) listeners
  useEffect(() => {
    const handleInteraction = () => {
      lastInteractionTimeRef.current = Date.now();
    };

    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const heartbeat = setInterval(() => {
      if (isPlaying) return; // Optimize: pause manual tracking when audio is playing
      
      // Ghost Prevention: 60 seconds idle timeout
      if (Date.now() - lastInteractionTimeRef.current > 60000) return;

      visibleAyahsRef.current.forEach((ayahId) => {
        const verse = verses.find(v => v.verse_number === ayahId);
        const wordCount = verse?.words ? verse.words.filter(w => w.char_type_name !== "end").length : 10;
        // Dynamic threshold: (words / 150 wpm) * 60s, with a 2-second minimum
        const requiredTimeMs = Math.max(2000, (wordCount / 150) * 60 * 1000);
        
        logSignal(surahId, ayahId, "visibility", requiredTimeMs);
      });
    }, 1500);

    return () => clearInterval(heartbeat);
  }, [surahId, loading, logSignal, isPlaying, verses]);

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;
    const handleScroll = () => {
      if (isPlaying) return; // Optimize: pause manual tracking when audio is playing
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        // Ghost Prevention: 60 seconds idle timeout
        if (Date.now() - lastInteractionTimeRef.current > 60000) return;

        visibleAyahsRef.current.forEach((ayahId) => {
          const verse = verses.find(v => v.verse_number === ayahId);
          const wordCount = verse?.words ? verse.words.filter(w => w.char_type_name !== "end").length : 10;
          const requiredTimeMs = Math.max(2000, (wordCount / 150) * 60 * 1000);
          
          logSignal(surahId, ayahId, "scroll", requiredTimeMs);
        });
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [surahId, logSignal, isPlaying, verses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="container mx-auto px-6 py-8 text-center">
        <p className="text-muted-foreground">Surah not found.</p>
        <Button asChild variant="hero" className="mt-4">
          <Link href="/read">Back to Surahs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "container mx-auto px-4 md:px-6 py-8 transition-all duration-300",
      !isSidebarOpen ? "max-w-7xl" : "max-w-5xl"
    )}>
      <div className="mb-6 md:mb-8 px-4 md:px-0">
        {/* Navigation & Actions Bar */}
        <div className="flex items-center justify-between mb-6 md:mb-8 bg-secondary/30 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-[2rem] md:rounded-none p-2 md:p-0 border border-white/10 md:border-transparent shadow-lg shadow-black/20 md:shadow-none animate-fade-in-up mt-2 md:mt-0">
          <Link href="/read" className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/explained/${surahId}`}>
              <Button variant="ghost" size="sm" className="h-10 px-3 gap-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-full bg-secondary/40 border border-white/5 hover:border-amber-500/20 transition-all" title="Surah Explained">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Explained</span>
              </Button>
            </Link>

            <Link href={`/info/${surahId}`}>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground bg-secondary/40 border border-white/5 hover:bg-white/10 rounded-full transition-all" title="Surah Info">
                <Info className="w-4 h-4" />
              </Button>
            </Link>

            {(combinedAudios.size > 0) && (
              <>
                {activeSurah?.id === surahId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 w-10 p-0 rounded-full border border-white/5 bg-secondary/40 hover:bg-white/10 hover:text-foreground text-muted-foreground shrink-0 transition-all"
                    title="Restart Surah"
                    onClick={() => {
                      const playlist = verses.map(v => {
                        const audioInfo = combinedAudios.get(v.verse_key);
                        return { 
                          ...v, 
                          audio: { 
                            url: audioInfo?.url || "", 
                            segments: audioInfo?.segments 
                          } 
                        };
                      });
                      playSurah(surah, playlist);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  variant="hero" 
                  size="sm" 
                  className="h-10 px-4 rounded-full gap-2 font-bold shadow-lg shadow-primary/20 shrink-0 ml-1" 
                  onClick={() => {
                    if (activeSurah?.id === surahId) {
                      togglePlay();
                    } else {
                      const playlist = verses.map(v => {
                        const audioInfo = combinedAudios.get(v.verse_key);
                        return { 
                          ...v, 
                          audio: { 
                            url: audioInfo?.url || "", 
                            segments: audioInfo?.segments 
                          } 
                        };
                      });
                      playSurah(surah, playlist);
                    }
                  }}
                >
                  {activeSurah?.id === surahId && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs uppercase tracking-wider">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-0.5" />
                      <span className="hidden sm:inline text-xs uppercase tracking-wider">{activeSurah?.id === surahId && !isPlaying ? "Resume" : "Play"}</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title Area */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="font-arabic text-4xl md:text-7xl text-foreground mb-1 md:mb-3 leading-tight drop-shadow-sm">
            سورة {surah.name_arabic}
          </h1>
          <p className="text-sm md:text-xl text-muted-foreground font-semibold tracking-widest uppercase opacity-80">
            {surah.name_simple}
          </p>
        </div>

        {/* Controls Area (Mode & Translation) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 border-b border-white/5 pb-6">
          <div className="w-full md:w-auto bg-secondary/40 p-1 rounded-xl flex items-center backdrop-blur-sm border border-white/[0.05]">
            <button onClick={() => setIsReadMode(false)} className={cn("flex-1 md:flex-none px-4 py-2 rounded-[0.5rem] text-xs md:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2", !isReadMode ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <AlignRight className="w-4 h-4" />
              Translation
            </button>
            <button onClick={() => setIsReadMode(true)} className={cn("flex-1 md:flex-none px-4 py-2 rounded-[0.5rem] text-xs md:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2", isReadMode ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <BookOpen className="w-4 h-4" />
              Reading
            </button>
          </div>

          {!isReadMode && (
            <div className="flex flex-row items-center gap-2 md:gap-3 text-xs md:text-sm w-full md:w-auto justify-center md:justify-end">
              <span className="text-muted-foreground font-medium">Translation by</span>
              <span className="font-bold text-primary/90 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10 truncate max-w-[200px] md:max-w-none text-center">
                {Object.values(translationsByLanguage).flat().find(t => t.id.toString() === translationId)?.name || "Sahih International"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={cn("transition-all duration-300 ease-out", isJumping ? "opacity-0 scale-[0.98] blur-[2px]" : "opacity-100 scale-100 blur-0")}>
        {surah.id !== 1 && surah.id !== 9 && (
          <div className="text-center mb-10 py-8 cursor-pointer group transition-all duration-300 hover:bg-primary/5 rounded-xl" onClick={() => (new Audio("https://verses.quran.com/Alafasy/mp3/001001.mp3")).play()} title="Tap to listen">
            <p className="font-arabic text-2xl md:text-3xl lg:text-4xl text-foreground leading-relaxed group-hover:text-primary transition-colors duration-300">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        )}

        {isReadMode ? (
        <div key="read-mode" className="min-h-[80vh] optimize-gpu">
          <Virtuoso
            ref={readVirtuosoRef}
            useWindowScroll
            data={pages}
            increaseViewportBy={400}
            defaultItemHeight={800}
            itemContent={(_index, [pageNumber, pageVerses]) => {
              // Extract all words from this page's verses
              const allWords = pageVerses.flatMap(verse => {
                const words = verse.words || [];
                return words.map(w => ({ ...w, verse }));
              });

              // Group by line_number
              const linesMap = new Map<number, typeof allWords>();
              allWords.forEach(w => {
                const ln = w.line_number || 1;
                if (!linesMap.has(ln)) linesMap.set(ln, []);
                linesMap.get(ln)!.push(w);
              });
              const lineNumbers = Array.from(linesMap.keys()).sort((a, b) => a - b);

              return (
                <div key={pageNumber} className="max-w-4xl mx-auto py-8 md:py-12 mushaf-layout text-foreground relative" dir="rtl">
                  <div className="flex flex-col w-full">
                    {lineNumbers.map((lineNum, lineIdx) => {
                      const words = linesMap.get(lineNum)!;
                      const isLastLine = lineIdx === lineNumbers.length - 1;
                      const isFatihaBismillahLine = surahId === 1 && lineIdx === 0;
                      // Some lines naturally don't stretch fully (e.g., end of surah)
                      const isCenter = isFatihaBismillahLine;

                      return (
                        <div 
                          key={lineNum} 
                          className={cn(
                            "flex flex-wrap w-full items-center mb-4 md:mb-6", 
                            "justify-center gap-x-1.5 md:gap-x-2 lg:gap-x-3"
                          )}
                        >
                          {words.map((w, i) => {
                            const isFatihaBismillah = surahId === 1 && w.verse.verse_number === 1;
                            
                            if (w.char_type_name === "end") {
                              return (
                                <span 
                                  key={w.id}
                                  className="relative flex items-center justify-center mx-1 md:mx-2 align-middle select-none cursor-pointer group/symbol hover:scale-110 transition-transform duration-200 shrink-0" 
                                  onClick={(e) => { e.stopPropagation(); handlePlayFromVerseCallback(w.verse.verse_key); }}
                                >
                                  <span className="text-foreground/20 text-[1.4em] md:text-[1.8em] group-hover/symbol:text-primary transition-colors duration-200 font-arabic leading-none">۝</span>
                                  <span className="absolute inset-0 flex items-center justify-center text-[0.45em] md:text-[0.6em] font-sans font-bold text-primary/80 mt-[0.1em]">
                                    {toArabicNumerals(w.verse.verse_number)}
                                  </span>
                                </span>
                              );
                            }
                            
                            // It's a word or pause
                            return (
                              <React.Fragment key={w.id}>
                                <WordWithMeaning
                                  word={w}
                                  verseNumber={w.verse.verse_number}
                                  showTooltip={false}
                                  script={quranScript}
                                  showTransliteration={showTransliteration}
                                  className={cn(
                                    "shrink-0",
                                    isFatihaBismillah ? "text-3xl md:text-5xl" : "text-3xl md:text-[2rem] lg:text-[2.25rem] leading-[2.2]"
                                  )}
                                  isHighlighted={currentVerseKey === w.verse.verse_key && currentWordPosition === w.position}
                                />
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-8 pt-4 border-t border-border w-full flex justify-center text-sm font-sans text-muted-foreground select-none">Page {pageNumber}</div>
                </div>
              );
            }}
          />
        </div>
      ) : (
        <div key="translate-mode" className="min-h-[80vh] optimize-gpu">
          <Virtuoso
            ref={virtuosoRef}
            useWindowScroll
            data={verses}
            defaultItemHeight={200}
            increaseViewportBy={400}
            itemsRendered={handleItemsRendered}
            itemContent={(index, verse) => (
              <div className="pb-0 md:pb-4 md:px-1">
                <VerseRow
                  verse={verse}
                  surahId={surahId}
                  verseAudios={verseAudios}
                  quranScript={quranScript}
                  isReadMode={false}
                  isLoading={isLoading}
                  handleCopyVerse={handleCopyVerseCallback}
                  isCurrentVerse={currentVerseKey === verse.verse_key}
                  isVersePlayingNow={currentVerseKey === verse.verse_key && isPlaying}
                  currentWordPosition={currentVerseKey === verse.verse_key ? currentWordPosition : null}
                  marked={isMarked(surahId, verse.verse_number, 'ayah')}
                  onPlayVerse={handlePlayVerseCallback}
                  onPlayFromVerse={handlePlayFromVerseCallback}
                  onTogglePlay={togglePlay}
                  onToggleMark={handleToggleMark}
                  onSetLoopMode={handleSetLoopMode}
                  onPreheat={preheatAudio}
                  loopMode={loopMode}
                  showTransliteration={showTransliteration}
                  onOpenTafsir={handleOpenTafsir}
                  index={index}
                />
              </div>
            )}
          />
        </div>
      )}
      </div>

      <ScrollButtons 
        className={isPlayerVisible ? "bottom-[160px] md:bottom-28" : "bottom-20 md:bottom-10"}
        onScrollToTop={() => cinematicJump('top')}
        onScrollToBottom={() => cinematicJump('bottom')}
      />

      <VerseTafsirModal
        isOpen={tafsirModalState.isOpen}
        onClose={() => setTafsirModalState(prev => ({ ...prev, isOpen: false }))}
        verseKey={tafsirModalState.verseKey}
        verseTextUthmani={tafsirModalState.verseTextUthmani}
        tafsirId={tafsirId}
      />

      <div className={cn("text-center pt-12", isPlayerVisible ? "pb-48 md:pb-32" : "pb-12")}>
        <p className="text-muted-foreground">End of {surah.name_simple}</p>
        {surahId < 114 && <Button asChild variant="hero" className="mt-4"><Link href={`/read/${surahId + 1}`}>Next Surah</Link></Button>}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Interrupt current playback?</AlertDialogTitle><AlertDialogDescription>Another audio is currently playing. Do you want to stop it and play this instead?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={cancelPlaybackSwitch}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmPlaybackSwitch}>Play New</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ReadQuran = () => {
  const { surahId } = useParams();
  if (surahId) {
    const sIdStr = Array.isArray(surahId) ? surahId[0] : surahId;
    const sId = parseInt(sIdStr);
    return <SurahReader key={sId} surahId={sId} />;
  }
  return <SurahList />;
};

export default ReadQuran;
// trigger recompile
