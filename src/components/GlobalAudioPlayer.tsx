"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";


import {
    Play, Pause, SkipForward, SkipBack, X,
    Loader2, Repeat, Repeat1, Gauge, PictureInPicture2,
    Maximize2, Volume2, Volume1, VolumeX, MoreVertical
} from "lucide-react";
import * as Slider from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
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
import ProgressBar from "@/components/player/ProgressBar";
import FullPlayer from "@/components/player/FullPlayer";
import { usePipPlayer } from "@/hooks/usePipPlayer";

const GlobalAudioPlayer = () => {
    const {
        currentVerseKey,
        currentSurah,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        isPlayerVisible,
        togglePlay,
        playNext,
        playPrev,
        closePlayer,
        seek,
        isFullPlayerOpen,
        playbackRate,

        setPlaybackRate,
        loopMode,
        setLoopMode,
        volume,
        setVolume,
        isFocusMode,
        setFocusMode,
        surahCurrentTime,
        surahDuration,
        seekSurah
    } = useAudioPlayer();
    const [isSpeedOpen, setIsSpeedOpen] = useState(false);
    const [isDesktopVolOpen, setIsDesktopVolOpen] = useState(false);
    const [isMobileVolOpen, setIsMobileVolOpen] = useState(false);
    const volTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleVolumeClick = (e: React.MouseEvent, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        e.preventDefault();
        if (volTimeout.current) {
            clearTimeout(volTimeout.current);
            volTimeout.current = null;
            setVolume(volume === 0 ? 1 : 0);
            setter(false);
        } else {
            volTimeout.current = setTimeout(() => {
                setter(prev => !prev);
                volTimeout.current = null;
            }, 250);
        }
    };

    const pathname = usePathname();
    const router = useRouter();
    const hiddenPaths = ["/", "/contact", "/help", "/about", "/settings", "/ai", "/account"];

    const isHidden = hiddenPaths.includes(pathname);
    const isAuthPath = ["/account"].includes(pathname);

    // Auto-pause audio when entering login or signup pages
    useEffect(() => {
        if (isAuthPath && isPlaying) {
            togglePlay();
        }
    }, [isAuthPath, isPlaying, togglePlay]);


    const { openPip, closePip, isPipOpen } = usePipPlayer();

    if (isHidden || isFullPlayerOpen) {
        return (
            <>
                <FullPlayer />
            </>
        );
    }
    
    if (!isPlayerVisible) return <FullPlayer />;



    return (
        <>
            {/* Mini Player */}
            <div className="fixed bottom-[68px] md:bottom-6 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[101] animate-in slide-in-from-bottom-full duration-500 md:w-full md:max-w-[800px]">
                {/* Desktop Pill Layout */}
                <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-background/60 backdrop-blur-2xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 ring-1 ring-white/5">
                    
                    {/* Track Info */}
                    <div
                        className="flex items-center gap-3 shrink-0 cursor-pointer group hover:bg-white/5 p-1 pr-3 rounded-full transition-colors"
                        onClick={() => {
                            if (pathname === `/read/${currentSurah!.id}`) {
                                window.dispatchEvent(new CustomEvent('scroll-to-ayah', { detail: { verseKey: currentVerseKey } }));
                            } else {
                                router.push(`/read/${currentSurah!.id}#verse-${currentVerseKey}`);
                            }
                        }}
                    >
                        <div className="flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center font-bold text-primary text-sm ring-1 ring-primary/20 group-hover:bg-primary/20 transition-all shadow-sm">
                            {currentSurah!.id}
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-semibold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                                {currentSurah!.name_simple}
                            </h4>
                            <span className="text-[10px] text-muted-foreground">
                                Verse {currentVerseKey!.split(':')[1]}
                            </span>
                        </div>
                    </div>

                    {/* Transport Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={playPrev} className="h-9 w-9 rounded-full text-foreground/70 hover:text-foreground hover:bg-white/10">
                            <SkipBack className="w-4 h-4 fill-current opacity-80" />
                        </Button>
                        <Button
                            size="icon"
                            className="h-11 w-11 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.25)] hover:shadow-[0_0_24px_rgba(var(--primary),0.4)] hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground border border-primary/50"
                            onClick={togglePlay}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-1" />
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => playNext()} className="h-9 w-9 rounded-full text-foreground/70 hover:text-foreground hover:bg-white/10">
                            <SkipForward className="w-4 h-4 fill-current opacity-80" />
                        </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 flex items-center min-w-0 pr-4 border-r border-white/10">
                        <ProgressBar
                            currentTime={surahCurrentTime}
                            duration={surahDuration}
                            onSeek={seekSurah}
                            className="w-full"
                        />
                    </div>

                    {/* Secondary Controls */}
                    <div className="flex items-center gap-1 shrink-0 pl-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                            if (loopMode === 'NONE') setLoopMode('SURAH');
                            else if (loopMode === 'SURAH') setLoopMode('AYAH');
                            else setLoopMode('NONE');
                        }} className={cn("h-8 w-8 rounded-full transition-colors", loopMode !== 'NONE' ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")}>
                            {loopMode === 'AYAH' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                        </Button>

                        <div className="relative group/speed">
                            <Button variant="ghost" size="sm" onClick={() => setIsSpeedOpen(!isSpeedOpen)} className={cn("h-8 px-2 rounded-full gap-1 transition-colors font-bold text-xs", isSpeedOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")}>
                                {playbackRate}x
                            </Button>
                            <div className={cn("flex flex-col gap-1 absolute bottom-full mb-3 right-1/2 translate-x-1/2 bg-background/90 backdrop-blur-md rounded-xl border border-border/50 shadow-2xl z-[110] p-1.5 transition-all duration-300 origin-bottom", isSpeedOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-2 pointer-events-none")}>
                                {[2, 1.5, 1.25, 1, 0.75, 0.5].map(rate => (
                                    <button key={rate} onClick={() => { setPlaybackRate(rate); setIsSpeedOpen(false); }} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-primary/20 text-center", playbackRate === rate ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Popover open={isDesktopVolOpen} onOpenChange={setIsDesktopVolOpen}>
                            <PopoverTrigger asChild>
                                <Button 
                                    onPointerDown={(e) => e.preventDefault()} 
                                    onClick={(e) => handleVolumeClick(e, setIsDesktopVolOpen)} 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn("h-8 w-8 rounded-full transition-colors", isDesktopVolOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")}
                                >
                                    {volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="center" className="w-10 p-3 bg-background/95 backdrop-blur-md border-border/50 shadow-2xl rounded-2xl mb-2 z-[110]">
                                <div className="h-24 flex flex-col items-center">
                                    <Slider.Root className="relative flex flex-col items-center select-none touch-none w-4 h-full" value={[volume * 100]} max={100} step={1} orientation="vertical" onValueChange={(vals) => setVolume(vals[0] / 100)}>
                                        <Slider.Track className="bg-muted-foreground/20 relative grow rounded-full w-1.5">
                                            <Slider.Range className="absolute bg-primary rounded-full w-full bottom-0" />
                                        </Slider.Track>
                                        <Slider.Thumb className="block w-3 h-3 bg-white border border-primary rounded-full hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer" aria-label="Volume" />
                                    </Slider.Root>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button variant="ghost" size="icon" onClick={isPipOpen ? closePip : openPip} className={cn("h-8 w-8 rounded-full transition-colors hidden lg:flex", isPipOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")} title="Picture-in-Picture">
                            <PictureInPicture2 className="w-4 h-4" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => {
                            const nextFocusMode = !isFocusMode;
                            setFocusMode(nextFocusMode);
                            if (nextFocusMode) {
                                if (!document.fullscreenElement) {
                                    document.documentElement.requestFullscreen().catch(e => console.error(e));
                                }
                            } else {
                                if (document.fullscreenElement) {
                                    document.exitFullscreen().catch(() => {});
                                }
                            }
                        }} className={cn("h-8 w-8 rounded-full transition-colors hidden lg:flex", isFocusMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")} title="Focus Mode">
                            <Maximize2 className="w-4 h-4" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={closePlayer} className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1 border-l border-white/5 pl-1 rounded-l-none">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden flex flex-col gap-2 p-2.5 bg-background rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
                    <div className="flex items-center gap-2.5">
                        {/* Play Button */}
                        <Button
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] bg-primary text-primary-foreground border border-primary/50"
                            onClick={togglePlay}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                            ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                        </Button>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/read/${currentSurah!.id}#verse-${currentVerseKey}`)}>
                            <h4 className="font-semibold text-xs truncate text-foreground/90">{currentSurah!.name_simple}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">Verse {currentVerseKey!.split(':')[1]}</p>
                        </div>

                        {/* Extra Controls & Prev/Next */}
                        <div className="flex items-center gap-0.5 shrink-0">
                            <Popover open={isMobileVolOpen} onOpenChange={setIsMobileVolOpen}>
                                <PopoverTrigger asChild>
                                    <Button 
                                        onPointerDown={(e) => e.preventDefault()} 
                                        onClick={(e) => handleVolumeClick(e, setIsMobileVolOpen)} 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn("h-7 w-7 rounded-full transition-colors flex shrink-0 touch-manipulation", isMobileVolOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")}
                                    >
                                        {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : volume < 0.5 ? <Volume1 className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="center" className="w-10 p-3 bg-background/95 backdrop-blur-md border-border/50 shadow-2xl rounded-2xl mb-2 z-[110]">
                                    <div className="h-24 flex flex-col items-center">
                                        <Slider.Root className="relative flex flex-col items-center select-none touch-none w-4 h-full" value={[volume * 100]} max={100} step={1} orientation="vertical" onValueChange={(vals) => setVolume(vals[0] / 100)}>
                                            <Slider.Track className="bg-muted-foreground/20 relative grow rounded-full w-1.5">
                                                <Slider.Range className="absolute bg-primary rounded-full w-full bottom-0" />
                                            </Slider.Track>
                                            <Slider.Thumb className="block w-3 h-3 bg-white border border-primary rounded-full hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer" aria-label="Volume" />
                                        </Slider.Root>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="relative group/speed-mobile-top">
                                <Button variant="ghost" size="sm" onClick={() => setIsSpeedOpen(!isSpeedOpen)} className={cn("h-7 px-1.5 rounded-full gap-0.5 transition-colors font-bold text-[10px]", isSpeedOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")}>
                                    {playbackRate}x
                                </Button>
                                <div className={cn("flex flex-col gap-1 absolute bottom-full mb-3 right-1/2 translate-x-1/2 bg-background/90 backdrop-blur-md rounded-xl border border-border/50 shadow-2xl z-[110] p-1.5 transition-all duration-300 origin-bottom", isSpeedOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-2 pointer-events-none")}>
                                    {[2, 1.5, 1.25, 1, 0.75, 0.5].map(rate => (
                                        <button key={rate} onClick={() => { setPlaybackRate(rate); setIsSpeedOpen(false); }} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-primary/20 text-center", playbackRate === rate ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button variant="ghost" size="icon" onClick={() => {
                                if (loopMode === 'NONE') setLoopMode('SURAH');
                                else if (loopMode === 'SURAH') setLoopMode('AYAH');
                                else setLoopMode('NONE');
                            }} className={cn("h-7 w-7 rounded-full transition-colors mr-1", loopMode !== 'NONE' ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/10")}>
                                {loopMode === 'AYAH' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                            </Button>

                            <div className="flex items-center gap-0.5 border-l border-white/10 pl-1">
                                <Button variant="ghost" size="icon" onClick={playPrev} className="h-7 w-7 rounded-full text-foreground/80 hover:bg-white/10">
                                    <SkipBack className="w-3.5 h-3.5 fill-current opacity-80" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => playNext()} className="h-7 w-7 rounded-full text-foreground/80 hover:bg-white/10">
                                    <SkipForward className="w-3.5 h-3.5 fill-current opacity-80" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar & Options */}
                    <div className="flex items-center gap-1.5 px-1">
                        <div className="flex-1 mr-1">
                            <ProgressBar
                                currentTime={surahCurrentTime}
                                duration={surahDuration}
                                onSeek={seekSurah}
                                compact
                            />
                        </div>
                        
                        <Button variant="ghost" size="icon" onClick={closePlayer} className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <X className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:bg-white/10">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-56 bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl p-1.5 z-[110] rounded-2xl">
                                <DropdownMenuItem onClick={isPipOpen ? closePip : openPip} className="gap-3 py-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer">
                                    <PictureInPicture2 className="w-4 h-4" />
                                    <div>
                                        <p className="text-sm font-bold">Picture-in-Picture</p>
                                        <p className="text-[10px] text-muted-foreground">Floating video player</p>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                    onClick={() => {
                                        const elem = document.documentElement;
                                        if (!document.fullscreenElement) {
                                            elem.requestFullscreen().catch(e => console.error(e));
                                            if (!isPipOpen) openPip();
                                        } else {
                                            if (document.fullscreenElement) {
                                                document.exitFullscreen().catch(() => {});
                                            }
                                            if (isPipOpen) closePip();
                                        }
                                    }}
                                    className="gap-3 py-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer"
                                >
                                    <Maximize2 className={cn("w-4 h-4", (document.fullscreenElement || isPipOpen) && "text-primary")} />
                                    <div>
                                        <p className="text-sm font-bold">Focus Mode</p>
                                        <p className="text-[10px] text-muted-foreground">Fullscreen + Focus window</p>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Full Player Drawer */}
            <FullPlayer />
        </>
    );
};

export default GlobalAudioPlayer;
