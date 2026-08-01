import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Verse, Surah } from '@/lib/quran-api';

// --- Persisted State Shape ---
interface PersistedPlaybackState {
    surahId: number;
    surahData: Surah;
    verseKey: string;
    currentIndex: number;
    currentTime: number;
    wasPlaying: boolean;
    playbackRate: number;
    loopMode: 'NONE' | 'SURAH' | 'AYAH';
    volume: number;
    timestamp: number;
}

const STORAGE_KEY = 'tilawa_playback_state';
const PERSIST_THROTTLE_MS = 1000;
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AudioPlayerContextType {
    isPlaying: boolean;
    currentVerseKey: string | null;
    currentSurah: Surah | null;
    currentVerse: Verse | null;
    currentWordPosition: number;
    isLoading: boolean;
    currentTime: number;
    duration: number;
    playlist: Verse[];
    currentIndex: number;
    isPlayerVisible: boolean;
    isFullPlayerOpen: boolean;
    setFullPlayerOpen: (open: boolean) => void;
    playSurah: (surah: Surah, verses: Verse[], startVerseKey?: string) => void;
    playVerse: (verse: Verse, surah: Surah) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrev: () => void;
    closePlayer: () => void;
    seek: (time: number) => void;
    setOnPlaylistEnd: (callback: () => void) => void;
    playbackRate: number;
    setPlaybackRate: (rate: number) => void;
    loopMode: 'NONE' | 'SURAH' | 'AYAH';
    setLoopMode: (mode: 'NONE' | 'SURAH' | 'AYAH') => void;
    jumpToIndex: (index: number) => void;
    preheatAudio: (verse: Verse, target?: 'ACTIVE' | 'INACTIVE' | 'PRIMARY' | 'SECONDARY') => void;
    volume: number;
    setVolume: (v: number) => void;
    isFocusMode: boolean;
    setFocusMode: (open: boolean) => void;
    surahCurrentTime: number;
    surahDuration: number;
    seekSurah: (time: number) => void;
    unlockAudio: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
    }
    return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVerseKey, setCurrentVerseKey] = useState<string | null>(null);
    const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
    const [currentWordPosition, setCurrentWordPosition] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullPlayerOpen, setFullPlayerOpen] = useState(false);
    const [isFocusMode, setFocusMode] = useState(false);

    const [playlist, setPlaylist] = useState<Verse[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isContinuous, setIsContinuous] = useState(false);
    const [playbackRate, setPlaybackRateState] = useState(1);
    const [loopMode, setLoopMode] = useState<'NONE' | 'SURAH' | 'AYAH'>('NONE');
    const [volume, setVolumeState] = useState(1.0);
    const verseDurationsRef = useRef<Record<string, number>>({});
    const [surahCurrentTime, setSurahCurrentTime] = useState(0);
    const [surahDuration, setSurahDuration] = useState(0);

    // Dual-Buffer Audio Strategy for Industry-Level Gapless Playback
    const primaryAudio = useRef<HTMLAudioElement | null>(null);
    const secondaryAudio = useRef<HTMLAudioElement | null>(null);
    const activeBuffer = useRef<'PRIMARY' | 'SECONDARY'>('PRIMARY');
    const isTransitioning = useRef(false); // Guard to prevent double-transitions
    const transitionRef = useRef<string | null>(null); // Tracks which verse just triggered a transition
    const rafRef = useRef<number | null>(null);
    const lastTimeUpdateRef = useRef(0); // Throttle time state updates
    const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tabIdRef = useRef(`tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const broadcastRef = useRef<BroadcastChannel | null>(null);
    const restoredRef = useRef(false);

    // Derived state
    const currentVerse = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
    const isPlayerVisible = currentVerseKey !== null && currentSurah !== null && (isLoading || (duration > 0 && (isPlaying || currentTime > 0)));

    useEffect(() => {
        primaryAudio.current = new Audio();
        secondaryAudio.current = new Audio();
        
        // Ensure high-quality audio pre-loading
        [primaryAudio.current, secondaryAudio.current].forEach(audio => {
            if (audio) {
                audio.preload = "auto";
                audio.volume = volume;
            }
        });
        
        return () => {
            primaryAudio.current?.pause();
            secondaryAudio.current?.pause();
            primaryAudio.current = null;
            secondaryAudio.current = null;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Sync volume changes to actual audio elements
    useEffect(() => {
        if (primaryAudio.current) primaryAudio.current.volume = volume;
        if (secondaryAudio.current) secondaryAudio.current.volume = volume;
    }, [volume]);

    const getActiveAudio = () => activeBuffer.current === 'PRIMARY' ? primaryAudio.current : secondaryAudio.current;
    const getInactiveAudio = () => activeBuffer.current === 'PRIMARY' ? secondaryAudio.current : primaryAudio.current;

    // Helper for safe audio playback to prevent unhandled AbortError in console
    const safePlay = useCallback(async (audioEl: HTMLAudioElement | null): Promise<boolean> => {
        if (!audioEl) return false;
        try {
            await audioEl.play();
            return true;
        } catch (err: any) {
            // AbortError is expected when playback is quickly interrupted — ignore it
            if (err?.name !== 'AbortError') {
                console.error("Playback failed", err);
            }
            return false;
        }
    }, []);

    // Unlock audio elements during a user interaction to allow future programmatic playback
    const unlockAudio = useCallback(() => {
        const p = primaryAudio.current;
        const s = secondaryAudio.current;
        if (p) {
            p.play().then(() => p.pause()).catch(() => {});
        }
        if (s) {
            s.play().then(() => s.pause()).catch(() => {});
        }
    }, []);

    // --- Playback Rate Setter (also updates active audio) ---
    const setPlaybackRate = useCallback((rate: number) => {
        setPlaybackRateState(rate);
        const audio = getActiveAudio();
        if (audio) audio.playbackRate = rate;
    }, []);

    const setVolume = useCallback((v: number) => {
        const newVolume = Math.max(0, Math.min(1, v));
        setVolumeState(newVolume);
    }, []);

    // --- localStorage Persistence (throttled) ---
    const persistState = useCallback(() => {
        if (persistTimerRef.current) return; // Already scheduled
        persistTimerRef.current = setTimeout(() => {
            persistTimerRef.current = null;
            try {
                const audio = getActiveAudio();
                const state: PersistedPlaybackState = {
                    surahId: currentSurah?.id || 0,
                    surahData: currentSurah!,
                    verseKey: currentVerseKey || '',
                    currentIndex,
                    currentTime: audio?.currentTime || 0,
                    wasPlaying: isPlaying,
                    playbackRate: playbackRate,
                    loopMode,
                    volume,
                    timestamp: Date.now(),
                };
                if (state.surahId && state.verseKey) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                }
            } catch { /* localStorage full or unavailable */ }
        }, PERSIST_THROTTLE_MS);
    }, [currentSurah, currentVerseKey, currentIndex, isPlaying, playbackRate, loopMode]);

    // Persist on meaningful state changes
    useEffect(() => {
        if (currentVerseKey && currentSurah) {
            persistState();
        }
    }, [currentVerseKey, currentSurah, isPlaying, currentIndex, loopMode, playbackRate, volume, persistState]);

    // --- BroadcastChannel Cross-Tab Sync ---
    useEffect(() => {
        try {
            broadcastRef.current = new BroadcastChannel('tilawa_audio_sync');
            broadcastRef.current.onmessage = (event) => {
                const { type, payload, tabId } = event.data;
                if (tabId === tabIdRef.current) return; // Ignore own messages

                switch (type) {
                    case 'PLAY':
                        // Another tab started playing, pause this one
                        const audio = getActiveAudio();
                        if (audio && !audio.paused) {
                            audio.pause();
                            setIsPlaying(false);
                        }
                        break;
                    case 'TRACK_CHANGE':
                        // Update display info from the active tab
                        if (payload.surah) setCurrentSurah(payload.surah);
                        if (payload.verseKey) setCurrentVerseKey(payload.verseKey);
                        break;
                    case 'CLOSE':
                        setIsPlaying(false);
                        setCurrentVerseKey(null);
                        setCurrentSurah(null);
                        setPlaylist([]);
                        break;
                }
            };
        } catch { /* BroadcastChannel not supported */ }

        // Local window listener to pause audio instantly from outside the context (e.g., when clicking a word)
        const handleGlobalPause = () => {
            const audio = getActiveAudio();
            if (audio && !audio.paused) {
                audio.pause();
                setIsPlaying(false);
            }
        };
        window.addEventListener('pause-global-audio', handleGlobalPause);

        return () => {
            broadcastRef.current?.close();
            window.removeEventListener('pause-global-audio', handleGlobalPause);
        };
    }, []);

    // Sync isPlaying to a global window variable to allow non-reactive checks
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).isQuranPlaying = isPlaying;
        }
    }, [isPlaying]);

    const broadcast = useCallback((type: string, payload: any = {}) => {
        try {
            broadcastRef.current?.postMessage({ type, payload, tabId: tabIdRef.current });
        } catch { /* ignore */ }
    }, []);

    // --- Media Session API ---
    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentVerse || !currentSurah) return;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `Ayah ${currentVerseKey?.split(':')[1] || ''}`,
                artist: currentSurah.name_simple,
                album: 'TilawaNow — Quran',
                artwork: [
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        } catch { /* Media Session not supported */ }
    }, [currentVerseKey, currentSurah, currentVerse, isPlaying]);

    // --- Seek ---
    const seek = useCallback((time: number) => {
        const audio = getActiveAudio();
        if (audio && isFinite(time)) {
            audio.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const preheatAudio = useCallback((verse: Verse, target: 'ACTIVE' | 'INACTIVE' | 'PRIMARY' | 'SECONDARY' = 'INACTIVE') => {
        let audio: HTMLAudioElement | null = null;
        
        if (target === 'ACTIVE') audio = getActiveAudio();
        else if (target === 'INACTIVE') audio = getInactiveAudio();
        else if (target === 'PRIMARY') audio = primaryAudio.current;
        else if (target === 'SECONDARY') audio = secondaryAudio.current;

        if (!audio || !verse?.audio?.url) return;

        const url = verse.audio.url;
        const fullUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url.startsWith('https://') ? url : url.startsWith('//') ? `https:${url}` : `https://verses.quran.com/${url}`;

        if (audio.src !== fullUrl) {
            console.log(`[AudioEngine] Preheating ${target}: ${verse.verse_key}`);
            audio.src = fullUrl;
            audio.preload = 'auto';
            audio.load();
        }
    }, []);

    const prefetchNext = useCallback((nextIndex: number) => {
        const nextVerse = playlist[nextIndex];
        if (nextVerse) preheatAudio(nextVerse);
    }, [playlist, preheatAudio]);

    const playWithBuffer = useCallback(async (verse: Verse, seekToTime?: number) => {
        const audio = getActiveAudio();
        if (!audio) return;

        const url = verse.audio?.url;
        if (!url) return;

        const fullUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url.startsWith('https://') ? url : url.startsWith('//') ? `https:${url}` : `https://verses.quran.com/${url}`;
        
        if (audio.src === fullUrl && audio.readyState >= 2) {
            console.log(`[AudioEngine] Active Buffer Match for ${verse.verse_key}`);
            setCurrentVerseKey(verse.verse_key);
            setCurrentWordPosition(-1);
            audio.playbackRate = playbackRate;
            const success = await safePlay(audio);
            if (success) {
                setIsPlaying(true);
                setIsLoading(false);
                
                // Preload next into inactive
                const currentIdx = playlist.findIndex(v => v.verse_key === verse.verse_key);
                if (currentIdx >= 0 && currentIdx < playlist.length - 1) {
                    prefetchNext(currentIdx + 1);
                }
            } else {
                setIsLoading(false);
                setIsPlaying(false);
            }
            return;
        }

        // 2. SWAP-PATH: Check if the inactive buffer ALREADY has this track preloaded
        const inactiveAudio = getInactiveAudio();
        if (inactiveAudio && inactiveAudio.src === fullUrl && inactiveAudio.readyState >= 2) {
            console.log(`[AudioEngine] Instant Swap for ${verse.verse_key}`);
            
            // Pause current active if any (unlikely to be playing the same thing but safe)
            if (audio && !audio.paused) audio.pause();
            
            // Swap buffers
            activeBuffer.current = activeBuffer.current === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
            
            setCurrentVerseKey(verse.verse_key);
            setCurrentWordPosition(-1);
            
            const newActive = getActiveAudio();
            if (newActive) {
                newActive.playbackRate = playbackRate;
                const success = await safePlay(newActive);
                if (success) {
                    setIsPlaying(true);
                    setIsLoading(false);
                    broadcast('PLAY', { surah: currentSurah, verseKey: verse.verse_key });
                    
                    // Preload next
                    const nextIdx = playlist.findIndex(v => v.verse_key === verse.verse_key) + 1;
                    if (nextIdx > 0 && nextIdx < playlist.length) {
                        prefetchNext(nextIdx);
                    }
                } else {
                    setIsLoading(false);
                    setIsPlaying(false);
                }
                return;
            }
        }

        // 2. Standard loading path if not preloaded
        if (!audio) return;

        // Pause any currently playing audio on the OTHER buffer
        const otherAudio = getInactiveAudio();
        if (otherAudio && !otherAudio.paused) {
            otherAudio.pause();
        }

        if (audio.src !== fullUrl) {
            setIsLoading(true);
            audio.src = fullUrl;
            audio.preload = 'auto';
            audio.load();
        } else if (audio.readyState < 2) {
            setIsLoading(true);
        }

        setCurrentVerseKey(verse.verse_key);
        setCurrentWordPosition(-1);
        audio.playbackRate = playbackRate;

        // If seeking to a specific time, wait for metadata to be loaded
        if (seekToTime && seekToTime > 0) {
            const onCanPlay = () => {
                audio.currentTime = seekToTime;
                audio.removeEventListener('canplay', onCanPlay);
            };
            if (audio.readyState >= 3) {
                audio.currentTime = seekToTime;
            } else {
                audio.addEventListener('canplay', onCanPlay);
            }
        }

        const success = await safePlay(audio);
        if (success) {
            setIsPlaying(true);
            setIsLoading(false);
            broadcast('PLAY', { surah: currentSurah, verseKey: verse.verse_key });

            // Eagerly preload the next ayah into the inactive buffer while this one plays
            const nextIdx = playlist.findIndex(v => v.verse_key === verse.verse_key) + 1;
            if (nextIdx > 0 && nextIdx < playlist.length) {
                prefetchNext(nextIdx);
            }
        } else {
            setIsLoading(false);
            setIsPlaying(false);
        }
    }, [playbackRate, playlist, prefetchNext, broadcast, currentSurah]);

    const seekSurah = useCallback((surahTime: number) => {
        if (!playlist.length) return;
        let elapsed = 0;
        for (let i = 0; i < playlist.length; i++) {
            const v = playlist[i];
            const m = verseDurationsRef.current[v.verse_key];
            const segs = v.audio?.segments;
            const d = (m && m > 0) ? m : (segs && segs.length > 0) ? segs[segs.length - 1][3] / 1000 : 30;
            if (elapsed + d >= surahTime || i === playlist.length - 1) {
                const withinVerse = Math.max(0, surahTime - elapsed);
                if (i !== currentIndex) {
                    transitionRef.current = null;
                    setCurrentIndex(i);
                    setCurrentVerseKey(v.verse_key);
                    playWithBuffer(v, withinVerse);
                } else {
                    seek(withinVerse);
                }
                break;
            }
            elapsed += d;
        }
    }, [playlist, currentIndex, playWithBuffer, seek]);

    const playNext = useCallback((isProactive = false) => {
        if (isTransitioning.current) return;
        isTransitioning.current = true;

        let nextIndex = -1;
        if (currentIndex + 1 < playlist.length) {
            nextIndex = currentIndex + 1;
        } else if (loopMode === 'SURAH') {
            nextIndex = 0;
        }

        if (nextIndex !== -1) {
            const nextVerse = playlist[nextIndex];
            const nextUrl = nextVerse?.audio?.url;
            const fullNextUrl = nextUrl
                ? (nextUrl.startsWith('http://') ? nextUrl.replace('http://', 'https://') : nextUrl.startsWith('https://') ? nextUrl : nextUrl.startsWith('//') ? `https:${nextUrl}` : `https://verses.quran.com/${nextUrl}`)
                : null;

            // Stop the current buffer immediately
            const currentAudio = getActiveAudio();
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
            }

            // Swap to the inactive buffer (which was being preloaded)
            activeBuffer.current = activeBuffer.current === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
            const nextAudio = getActiveAudio(); // Now points to the preloaded buffer

            // Verify the preloaded buffer has the right track; if not, load it now
            if (nextAudio && fullNextUrl && nextAudio.src !== fullNextUrl) {
                nextAudio.src = fullNextUrl;
                nextAudio.load();
            }

            setCurrentIndex(nextIndex);
            setCurrentVerseKey(nextVerse.verse_key);
            setCurrentWordPosition(-1);

            if (nextAudio) {
                nextAudio.playbackRate = playbackRate;
                safePlay(nextAudio).then(() => {
                    setIsPlaying(true);
                    broadcast('TRACK_CHANGE', { surah: currentSurah, verseKey: nextVerse.verse_key });

                    // Preload the one after next into the now-idle buffer
                    if (nextIndex + 1 < playlist.length) {
                        prefetchNext(nextIndex + 1);
                    }
                });
            }

            // Release the transition guard quickly
            setTimeout(() => { isTransitioning.current = false; }, 50);
        } else if (!isProactive) {
            setIsPlaying(false);
            onPlaylistEndRef.current?.();
            isTransitioning.current = false;
        }
    }, [currentIndex, playlist, loopMode, playbackRate, prefetchNext, broadcast, currentSurah]);

    // High-Precision Industry-Level Continuous Audio Monitoring
    useEffect(() => {
        const monitorPlayback = () => {
            const audio = getActiveAudio();
            if (!audio || audio.paused || !isPlaying) {
                rafRef.current = requestAnimationFrame(monitorPlayback);
                return;
            }

            const verse = playlist[currentIndex];
            if (!verse) {
                rafRef.current = requestAnimationFrame(monitorPlayback);
                return;
            }

            // 1. High-Performance Word Highlighting (Sync with RAF)
            const currentTimeMs = Math.floor(audio.currentTime * 1000);
            const segments = verse.audio?.segments;
            
            if (segments && segments.length > 0) {
                // Find the word that contains the current playback timestamp
                // Quran.com API Format: [index, word_position, start_ms, end_ms]
                const activeSegment = segments.find(seg => 
                    currentTimeMs >= seg[2] && currentTimeMs <= seg[3]
                );

                if (activeSegment) {
                    if (currentWordPosition !== activeSegment[1]) {
                        setCurrentWordPosition(activeSegment[1]);
                    }
                } else {
                    // If we are between segments or at the very end of the ayah
                    // but before the proactive transition triggers
                    if (currentWordPosition !== -1) {
                        // Check if we passed the last word
                        const lastSegment = segments[segments.length - 1];
                        if (currentTimeMs > lastSegment[3]) {
                            setCurrentWordPosition(-1);
                        }
                    }
                }
            } else if (currentWordPosition !== -1) {
                // No segments available for this verse, reset highlight
                setCurrentWordPosition(-1);
            }

            // 2. Throttled Time/Duration Updates (4 updates/sec max)
            const now = performance.now();
            if (now - lastTimeUpdateRef.current > 250) {
                lastTimeUpdateRef.current = now;
                setCurrentTime(audio.currentTime);
                if (audio.duration && isFinite(audio.duration)) {
                    setDuration(audio.duration);

                    // Store actual measured duration for this verse
                    const cv = playlist[currentIndex];
                    if (cv) verseDurationsRef.current[cv.verse_key] = audio.duration;

                    // Helper: best estimate of a verse's duration
                    const getEstDur = (v: Verse): number => {
                        const m = verseDurationsRef.current[v.verse_key];
                        if (m && m > 0) return m;
                        const segs = v.audio?.segments;
                        if (segs && segs.length > 0) return segs[segs.length - 1][3] / 1000;
                        const vals = Object.values(verseDurationsRef.current).filter(d => d > 0);
                        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 30;
                    };

                    // Compute surah-wide current position and total duration
                    let offset = 0;
                    for (let i = 0; i < currentIndex; i++) {
                        if (playlist[i]) offset += getEstDur(playlist[i]);
                    }
                    let total = offset + audio.duration;
                    for (let i = currentIndex + 1; i < playlist.length; i++) {
                        if (playlist[i]) total += getEstDur(playlist[i]);
                    }
                    setSurahCurrentTime(offset + audio.currentTime);
                    setSurahDuration(total);
                }
            }



            rafRef.current = requestAnimationFrame(monitorPlayback);
        };

        rafRef.current = requestAnimationFrame(monitorPlayback);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [currentIndex, playlist, currentWordPosition, isPlaying, isContinuous, loopMode, playNext]);

    // Fallback handlers for browser events
    useEffect(() => {
        const audio = primaryAudio.current;
        const audio2 = secondaryAudio.current;
        if (!audio || !audio2) return;

        const handleEnded = (e: Event) => {
            const endedPlayer = e.target as HTMLAudioElement;
            const currentAudio = getActiveAudio();
            
            // Only handle 'ended' if we haven't already transitioned proactively
            // or if we are in 'AYAH' loop mode (where proactive is disabled)
            if (endedPlayer === currentAudio) {
                if (loopMode === 'AYAH') {
                    playWithBuffer(playlist[currentIndex]);
                } else if (isContinuous) {
                    playNext();
                } else {
                    setIsPlaying(false);
                }
            }
        };

        audio.addEventListener('ended', handleEnded);
        audio2.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio2.removeEventListener('ended', handleEnded);
        };
    }, [currentIndex, playlist, loopMode, isContinuous, playWithBuffer]);

    // --- Media Session Action Handlers ---
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
            ['play', () => { const a = getActiveAudio(); if (a) { safePlay(a); setIsPlaying(true); } }],
            ['pause', () => { const a = getActiveAudio(); if (a) { a.pause(); setIsPlaying(false); } }],
            ['nexttrack', () => playNext()],
            ['previoustrack', () => playPrev()],
            ['seekto', (details) => { if (details.seekTime != null) seek(details.seekTime); }],
        ];

        for (const [action, handler] of actionHandlers) {
            try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
        }

        return () => {
            for (const [action] of actionHandlers) {
                try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
            }
        };
    }, [playNext, seek]);

    // --- Restore Persisted State on Mount ---
    useEffect(() => {
        if (restoredRef.current) return;
        restoredRef.current = true;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const saved: PersistedPlaybackState = JSON.parse(raw);
            
            // Validate age
            if (Date.now() - saved.timestamp > STATE_MAX_AGE_MS) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }

            // Validate data
            if (!saved.surahId || !saved.verseKey || !saved.surahData) return;

            // Restore state (but don't auto-play — always resume paused)
            setCurrentSurah(saved.surahData);
            setCurrentVerseKey(saved.verseKey);
            setCurrentIndex(saved.currentIndex);
            setPlaybackRateState(saved.playbackRate || 1);
            setLoopMode(saved.loopMode || 'NONE');
            if (saved.volume !== undefined) {
                setVolumeState(saved.volume);
            }

            console.log(`[AudioEngine] Restored session: ${saved.surahData.name_simple} - Verse ${saved.verseKey}`);
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const playSurah = useCallback((surah: Surah, verses: Verse[], startVerseKey?: string) => {
        let finalVerses = [...verses];
        
        // Inject Bismillah for Surahs that start with it (excluding Al-Fatihah since it's already Verse 1, and At-Tawbah which doesn't have it)
        if (surah.bismillah_pre && surah.id !== 1 && surah.id !== 9) {
            let bismillahUrl = "Alafasy/mp3/001001.mp3";
            if (verses[0]?.audio?.url) {
                const parts = verses[0].audio.url.split('/');
                parts[parts.length - 1] = "001001.mp3";
                bismillahUrl = parts.join('/');
            }

            const bismillahVerse: Verse = {
                id: 0,
                verse_number: 0,
                verse_key: `${surah.id}:0`,
                hizb_number: verses[0]?.hizb_number || 0,
                rub_el_hizb_number: verses[0]?.rub_el_hizb_number || 0,
                ruku_number: verses[0]?.ruku_number || 0,
                manzil_number: verses[0]?.manzil_number || 0,
                sajdah_number: null,
                text_uthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
                page_number: verses[0]?.page_number || 0,
                juz_number: verses[0]?.juz_number || 0,
                audio: {
                    url: bismillahUrl,
                    segments: []
                }
            };
            
            if (finalVerses[0]?.verse_key !== `${surah.id}:0`) {
                finalVerses.unshift(bismillahVerse);
            }
        }

        verseDurationsRef.current = {};
        setSurahCurrentTime(0);
        setSurahDuration(0);
        setPlaylist(finalVerses);
        setCurrentSurah(surah);
        setIsContinuous(true);
        const idx = startVerseKey ? finalVerses.findIndex(v => v.verse_key === startVerseKey) : 0;
        const startIndex = idx === -1 ? 0 : idx;
        
        // Reset transition tracking for new surah
        transitionRef.current = null;
        setCurrentIndex(startIndex);
        
        // Clear secondary buffer to prevent legacy audio bleed
        const inactive = getInactiveAudio();
        if (inactive) { inactive.removeAttribute('src'); }
        
        // Proactively preheat the first verse to eliminate transition lag
        preheatAudio(finalVerses[startIndex]);
        
        playWithBuffer(finalVerses[startIndex]);
        broadcast('TRACK_CHANGE', { surah, verseKey: finalVerses[startIndex].verse_key });
    }, [preheatAudio, playWithBuffer, broadcast]);

    const playVerse = useCallback((verse: Verse, surah: Surah) => {
        setPlaylist([verse]);
        setCurrentSurah(surah);
        setIsContinuous(false);
        setCurrentIndex(0);
        transitionRef.current = null;
        playWithBuffer(verse);
        broadcast('TRACK_CHANGE', { surah, verseKey: verse.verse_key });
    }, [playWithBuffer, broadcast]);

    const togglePlay = useCallback(() => {
        const audio = getActiveAudio();
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            safePlay(audio);
            setIsPlaying(true);
            broadcast('PLAY', { surah: currentSurah, verseKey: currentVerseKey });
        }
    }, [isPlaying, currentSurah, currentVerseKey, broadcast]);

    const onPlaylistEndRef = useRef<(() => void) | null>(null);
    const setOnPlaylistEnd = (cb: () => void) => { onPlaylistEndRef.current = cb; };

    const playPrev = useCallback(() => {
        if (currentIndex - 1 >= 0) {
            const nextIdx = currentIndex - 1;
            transitionRef.current = null; // Allow re-transitioning
            setCurrentIndex(nextIdx);
            playWithBuffer(playlist[nextIdx]);
            broadcast('TRACK_CHANGE', { surah: currentSurah, verseKey: playlist[nextIdx].verse_key });
        }
    }, [currentIndex, playlist, playWithBuffer, broadcast, currentSurah]);

    const jumpToIndex = useCallback((index: number) => {
        if (index >= 0 && index < playlist.length) {
            transitionRef.current = null;
            setCurrentIndex(index);
            playWithBuffer(playlist[index]);
            broadcast('TRACK_CHANGE', { surah: currentSurah, verseKey: playlist[index].verse_key });
        }
    }, [playlist, playWithBuffer, broadcast, currentSurah]);

    const closePlayer = useCallback(() => {
        primaryAudio.current?.pause();
        secondaryAudio.current?.pause();
        setIsPlaying(false);
        setCurrentVerseKey(null);
        setCurrentSurah(null);
        setPlaylist([]);
        setCurrentTime(0);
        setDuration(0);
        setSurahCurrentTime(0);
        setSurahDuration(0);
        verseDurationsRef.current = {};
        setFullPlayerOpen(false);
        transitionRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        localStorage.removeItem(STORAGE_KEY);
        broadcast('CLOSE');
    }, [broadcast]);

    return (
        <AudioPlayerContext.Provider value={{
            isPlaying, currentVerseKey, currentSurah, currentVerse, currentWordPosition, isLoading,
            currentTime, duration, playlist, currentIndex,
            isPlayerVisible, isFullPlayerOpen, setFullPlayerOpen,
            playSurah, playVerse, togglePlay, playNext, playPrev, closePlayer, seek, jumpToIndex,
            setOnPlaylistEnd, playbackRate, setPlaybackRate, loopMode, setLoopMode, preheatAudio,
            volume, setVolume, isFocusMode, setFocusMode,
            surahCurrentTime, surahDuration, seekSurah, unlockAudio
        }}>
            {children}
        </AudioPlayerContext.Provider>
    );
};
