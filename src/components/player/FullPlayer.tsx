"use client";

import React from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
    Play, Pause, SkipForward, SkipBack, X,
    Loader2, Repeat, Repeat1, Gauge, ChevronDown,
    ListMusic, Volume2, Volume1, VolumeX, PictureInPicture2
} from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ProgressBar from "./ProgressBar";
import PlayerQueue from "./PlayerQueue";
import { usePipPlayer } from "@/hooks/usePipPlayer";

const FullPlayer: React.FC = () => {
    const {
        isPlaying,
        currentVerseKey,
        currentSurah,
        currentVerse,
        currentWordPosition,
        isLoading,
        currentTime,
        duration,
        isFullPlayerOpen,
        setFullPlayerOpen,
        togglePlay,
        playNext,
        playPrev,
        seek,
        closePlayer,
        playbackRate,
        setPlaybackRate,
        loopMode,
        setLoopMode,
        volume,
        setVolume,
        surahCurrentTime,
        surahDuration,
        seekSurah,
    } = useAudioPlayer();

    const { openPip, closePip, isPipOpen } = usePipPlayer();
    const [showQueue, setShowQueue] = React.useState(false);

    // Scroll lock and Fullscreen cleanup logic
    React.useEffect(() => {
        if (isFullPlayerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            if (document.fullscreenElement) {
                try {
                    document.exitFullscreen();
                } catch (err) {
                    console.error("Fullscreen exit failed", err);
                }
            }
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullPlayerOpen]);


    if (!currentVerseKey || !currentSurah) return null;


    return (
        <Dialog open={isFullPlayerOpen} onOpenChange={setFullPlayerOpen}>
            <DialogContent
                className="fixed inset-0 h-screen w-screen z-[200] bg-background/100 backdrop-blur-3xl border-none outline-none rounded-none p-0 flex flex-col translate-x-0 translate-y-0 left-0 top-0 max-w-none duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 [&>button]:hidden"
                aria-describedby={undefined}
            >

                <DialogTitle className="sr-only">Now Playing — {currentSurah.name_simple}</DialogTitle>
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Handle / Collapse */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-border/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFullPlayerOpen(false)}
                            className="gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ChevronDown className="w-4 h-4" />
                            <span className="text-xs">Collapse</span>
                        </Button>
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">
                            Now Playing
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closePlayer}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col items-center">
                        {/* Surah Header - Click to scroll to ayah */}
                        <div 
                            className="text-center mb-6 cursor-pointer group"
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('scroll-to-ayah', { 
                                    detail: { verseKey: currentVerseKey } 
                                }));
                                setFullPlayerOpen(false); // Collapse to show the verse
                            }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl mx-auto mb-3 ring-1 ring-primary/20 shadow-lg shadow-primary/10 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-all">
                                {currentSurah.id}
                            </div>
                            <h2 className="font-arabic text-2xl md:text-3xl text-foreground mb-1 group-hover:text-primary transition-colors">
                                سورة {currentSurah.name_arabic}
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium">
                                {currentSurah.name_simple} • {currentSurah.translated_name.name}
                            </p>
                            <p className="text-xs text-primary/70 font-semibold mt-1">
                                Verse {currentVerseKey.split(":")[1]}
                            </p>
                        </div>

                        {/* Current Ayah Display */}
                        <div className="w-full max-w-3xl mx-auto mb-8">

                            <div className="glass-card p-6 md:p-8 relative overflow-hidden">
                                {/* Subtle gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />

                                {/* Arabic Text */}
                                <div className="text-center mb-4 relative z-10" dir="rtl">
                                    {currentVerse?.words && currentVerse.words.length > 0 ? (
                                        <div className="font-arabic text-xl md:text-3xl text-foreground flex flex-wrap justify-center gap-x-2 gap-y-8 md:gap-y-12">


                                            {currentVerse.words
                                                .filter(w => w.char_type_name !== "end")
                                                .map((w, i) => {
                                                    const text = w.text_uthmani || (w as any).text || "";
                                                    const isHighlighted = currentWordPosition === w.position;
                                                    return (
                                                        <span
                                                            key={w.id || i}
                                                            className={cn(
                                                                "inline-block mx-1 transition-all duration-200",

                                                                isHighlighted && "word-highlight"
                                                            )}
                                                        >
                                                            {text}
                                                        </span>
                                                    );
                                                })}
                                        </div>

                                    ) : (
                                        <p className="font-arabic text-xl md:text-3xl text-foreground leading-[2.5]">
                                            {currentVerse?.text_uthmani || ""}
                                        </p>
                                    )}
                                </div>

                                {/* Translation */}
                                {currentVerse?.translations?.[0] && (
                                    <div className="border-t border-border/30 pt-4 mt-4 relative z-10">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-center italic">
                                            {currentVerse.translations[0].text.replace(/<[^>]*>/g, "")}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-lg mx-auto mb-6">
                            <ProgressBar
                                currentTime={surahCurrentTime}
                                duration={surahDuration}
                                onSeek={seekSurah}
                            />
                        </div>

                        {/* Transport Controls */}
                        <div className="flex items-center justify-center gap-6 mb-6">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={playPrev}
                                className="h-12 w-12 text-foreground/70 hover:text-foreground rounded-full"
                            >
                                <SkipBack className="w-5 h-5" />
                            </Button>

                            <Button
                                size="icon"
                                className="h-16 w-16 rounded-full shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground"
                                onClick={togglePlay}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-7 h-7 animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="w-7 h-7 fill-current" />
                                ) : (
                                    <Play className="w-7 h-7 fill-current ml-1" />
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => playNext()}
                                className="h-12 w-12 text-foreground/70 hover:text-foreground rounded-full"
                            >
                                <SkipForward className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Secondary Controls */}
                        <div className="flex items-center justify-center gap-3 mb-6">
                            {/* Loop Toggle */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (loopMode === 'NONE') setLoopMode('SURAH');
                                    else if (loopMode === 'SURAH') setLoopMode('AYAH');
                                    else setLoopMode('NONE');
                                }}
                                className={cn(
                                    "gap-2 rounded-lg h-9 px-3",
                                    loopMode !== 'NONE'
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:bg-secondary"
                                )}
                            >
                                {loopMode === 'AYAH' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                                <span className="text-xs font-medium">
                                    {loopMode === 'NONE' ? 'Loop Off' : loopMode === 'SURAH' ? 'Loop Surah' : 'Loop Ayah'}
                                </span>
                            </Button>

                            {/* Speed */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 rounded-lg h-9 px-3 text-muted-foreground hover:text-foreground"
                                    >
                                        <Gauge className="w-4 h-4" />
                                        <span className="text-xs font-medium">{playbackRate}x</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="center" sideOffset={12} className="w-24 min-w-[5rem]">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                        <DropdownMenuItem
                                            key={rate}
                                            onClick={() => setPlaybackRate(rate)}
                                            className={cn("justify-center", playbackRate === rate && "bg-primary/10 text-primary font-bold")}
                                        >
                                            {rate}x
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* PiP Toggle */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={isPipOpen ? closePip : openPip}
                                className={cn(
                                    "gap-2 rounded-lg h-9 px-3",
                                    isPipOpen
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:bg-secondary"
                                )}
                                title={isPipOpen ? "Close floating player" : "Pop out player"}
                            >
                                <PictureInPicture2 className="w-4 h-4" />
                                <span className="text-xs font-medium hidden sm:inline">PiP</span>
                            </Button>

                            {/* Queue Toggle */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowQueue(!showQueue)}
                                className={cn(
                                    "gap-2 rounded-lg h-9 px-3",
                                    showQueue
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:bg-secondary"
                                )}
                            >
                                <ListMusic className="w-4 h-4" />
                                <span className="text-xs font-medium">Queue</span>
                            </Button>
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center justify-center gap-4 max-w-xs mx-auto mb-6">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-muted-foreground hover:text-primary transition-colors rounded-lg flex-shrink-0"
                                    >
                                        {volume === 0 ? <VolumeX className="w-5 h-5" /> : 
                                         volume < 0.5 ? <Volume1 className="w-5 h-5" /> : 
                                         <Volume2 className="w-5 h-5" />}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="center" className="w-12 p-3 bg-background/95 backdrop-blur-md border-border/50 shadow-2xl rounded-2xl mb-2">
                                    <div className="h-32 flex flex-col items-center">
                                        <Slider.Root
                                            className="relative flex flex-col items-center select-none touch-none w-5 h-full"
                                            value={[volume * 100]}
                                            max={100}
                                            step={1}
                                            orientation="vertical"
                                            onValueChange={(vals) => setVolume(vals[0] / 100)}
                                        >
                                            <Slider.Track className="bg-muted-foreground/20 relative grow rounded-full w-[4px]">
                                                <Slider.Range className="absolute bg-primary rounded-full w-full bottom-0" />
                                            </Slider.Track>
                                            <Slider.Thumb
                                                className="block w-3.5 h-3.5 bg-white border-2 border-primary rounded-full hover:scale-110 active:scale-95 transition-all focus:outline-none shadow-lg cursor-pointer"
                                                aria-label="Volume"
                                            />
                                        </Slider.Root>
                                        <span className="text-[10px] font-bold mt-2 text-primary">{Math.round(volume * 100)}%</span>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Queue Panel */}
                        {showQueue && (
                            <div className="w-full max-w-lg mx-auto glass-card overflow-hidden animate-fade-in">
                                <PlayerQueue />
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default React.memo(FullPlayer);
