"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

const PIP_WIDTH = 380;
const PIP_HEIGHT = 220;

// Formats seconds -> M:SS
function fmt(s: number): string {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function usePipPlayer() {
    const pipWindowRef = useRef<DocumentPictureInPictureWindow | null>(null);
    const rafRef = useRef<number | null>(null);
    const isOpenRef = useRef(false);

    const {
        isPlaying,
        isLoading,
        currentSurah,
        currentVerseKey,
        currentVerse,
        currentWordPosition,
        surahCurrentTime,
        surahDuration,
        togglePlay,
        playNext,
        playPrev,
        seekSurah,
    } = useAudioPlayer();

    // Use refs to avoid stale closures in PiP event listeners
    const togglePlayRef = useRef(togglePlay);
    const playNextRef = useRef(playNext);
    const playPrevRef = useRef(playPrev);
    const seekSurahRef = useRef(seekSurah);
    const surahDurationRef = useRef(surahDuration);

    useEffect(() => {
        togglePlayRef.current = togglePlay;
        playNextRef.current = playNext;
        playPrevRef.current = playPrev;
        seekSurahRef.current = seekSurah;
        surahDurationRef.current = surahDuration;
    }, [togglePlay, playNext, playPrev, seekSurah, surahDuration]);

    // Inject self-contained CSS into the PiP window document
    const injectStyles = useCallback((doc: Document) => {
        // Copy all stylesheets from the main page
        Array.from(document.styleSheets).forEach((sheet) => {
            try {
                if (sheet.href) {
                    // External stylesheet — add a link tag
                    const link = doc.createElement("link");
                    link.rel = "stylesheet";
                    link.href = sheet.href;
                    doc.head.appendChild(link);
                } else {
                    // Inline stylesheet — copy rules
                    const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
                    const style = doc.createElement("style");
                    style.textContent = rules;
                    doc.head.appendChild(style);
                }
            } catch {
                // Cross-origin sheets — skip safely
            }
        });

        // Force dark mode and reset body
        const baseStyle = doc.createElement("style");
        baseStyle.textContent = `
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
            body {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                color: #f1f5f9;
                background: transparent;
            }
            :root {
                --primary: 0 0% 100%;
                --primary-foreground: 0 0% 10%;
                color-scheme: dark;
            }
            .pip-root {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: rgba(10, 12, 18, 0.97);
                border-radius: 0;
                overflow: hidden;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.07);
                box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            }
            
            .pip-top { padding: 12px 16px 4px; flex-shrink: 0; text-align: center; }
            .pip-meta { display: flex; align-items: center; justify-content: center; gap: 8px; text-align: center; }
            .pip-titles { flex: 0 1 auto; min-width: 0; display: flex; align-items: center; gap: 8px; justify-content: center; }
            .pip-surah { font-size: 14px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
            .pip-verse { font-size: 12px; color: #94a3b8; font-weight: 500; }
            
            .pip-content-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                overflow-x: hidden;
                scroll-behavior: smooth;
            }
            
            .pip-arabic {
                padding: 12px 20px 12px;
                direction: rtl; text-align: center;
                font-size: 24px; line-height: 1.5;
                color: #e2e8f0;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: center;
                gap: 4px;
                margin: auto 0;
                scroll-behavior: smooth;
            }
            .pip-word {
                display: inline-block;
                padding: 0 4px;
                border-radius: 6px;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .pip-word-highlight {
                color: #ffffff;
                background: rgba(255, 255, 255, 0.15);
                box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(255, 255, 255, 0.05);
                transform: scale(1.08) translateY(-2px);
                position: relative;
                z-index: 1;
            }
            
            .pip-bottom {
                background: linear-gradient(180deg, rgba(10,12,18,0) 0%, rgba(10,12,18,0.8) 100%);
                padding-top: 8px;
            }
            
            .pip-progress-wrap { padding: 0 16px 2px; }
            .pip-track {
                width: 100%; height: 4px; border-radius: 99px;
                background: rgba(255,255,255,0.1); cursor: pointer; position: relative;
                transition: height 0.15s;
            }
            .pip-track:hover { height: 6px; }
            .pip-fill {
                height: 100%; border-radius: 99px;
                background: hsl(0 0% 100%);
                pointer-events: none;
                box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
            }
            .pip-times { display: flex; justify-content: space-between; margin-top: 4px; }
            .pip-times span { font-size: 9px; font-weight: 600; color: #64748b; font-variant-numeric: tabular-nums; }
            
            .pip-controls {
                padding: 4px 16px 12px;
                display: flex; align-items: center; justify-content: center; gap: 12px;
            }
            .pip-btn {
                width: 32px; height: 32px; border-radius: 50%;
                background: transparent; border: none; cursor: pointer;
                color: #94a3b8; display: flex; align-items: center; justify-content: center;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .pip-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }
            .pip-btn:active { transform: scale(0.9); }
            .pip-btn-play {
                width: 44px; height: 44px;
                background: hsl(0 0% 100%);
                color: hsl(0 0% 10%);
                box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.8);
            }
            .pip-btn-play:hover { background: hsl(0 0% 90%); color: hsl(0 0% 10%); transform: scale(1.05); }
            .pip-btn-play:active { transform: scale(0.95); }
            .pip-spinner {
                width: 18px; height: 18px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: pip-spin 0.8s linear infinite;
            }
            @keyframes pip-spin { to { transform: rotate(360deg); } }
            svg { display: block; }
        `;
        doc.head.appendChild(baseStyle);
    }, []);

    const buildDOM = useCallback((doc: Document) => {
        const root = doc.createElement("div");
        root.className = "pip-root";
        root.innerHTML = `
            <div class="pip-top">
                <div class="pip-meta">
                    <div class="pip-titles">
                        <div class="pip-surah" id="pip-surah-name">Loading...</div>
                        <div class="pip-verse" id="pip-verse-num">—</div>
                    </div>
                </div>
            </div>
            <div class="pip-content-area">
                <div class="pip-arabic" id="pip-arabic"></div>
            </div>
            <div class="pip-bottom">
                <div class="pip-progress-wrap">
                    <div class="pip-track" id="pip-track">
                        <div class="pip-fill" id="pip-fill" style="width:0%"></div>
                    </div>
                    <div class="pip-times">
                        <span id="pip-time-cur">0:00</span>
                        <span id="pip-time-dur">0:00</span>
                    </div>
                </div>
                <div class="pip-controls">
                    <button class="pip-btn" id="pip-prev-btn" title="Previous ayah">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="19 20 9 12 19 4 19 20"/><rect x="5" y="4" width="3" height="16"/>
                        </svg>
                    </button>
                    <button class="pip-btn pip-btn-play" id="pip-play-btn" title="Play / Pause">
                        <svg id="pip-icon-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="margin-left: 2px;">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        <svg id="pip-icon-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:none">
                            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                        </svg>
                        <div class="pip-spinner" id="pip-spinner" style="display:none"></div>
                    </button>
                    <button class="pip-btn" id="pip-next-btn" title="Next ayah">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="5 4 15 12 5 20 5 4"/><rect x="16" y="4" width="3" height="16"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        doc.body.appendChild(root);
    }, []);

    // Wire event listeners to controls
    const wireEvents = useCallback((doc: Document) => {
        doc.getElementById("pip-play-btn")?.addEventListener("click", () => togglePlayRef.current());
        doc.getElementById("pip-next-btn")?.addEventListener("click", () => playNextRef.current());
        doc.getElementById("pip-prev-btn")?.addEventListener("click", () => playPrevRef.current());

        // Seekable progress bar
        const track = doc.getElementById("pip-track");
        if (track) {
            track.addEventListener("click", (e) => {
                const rect = track.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                if (surahDurationRef.current > 0) seekSurahRef.current(ratio * surahDurationRef.current);
            });
        }
    }, []);

    // Live update loop — syncs state from the React context to the PiP DOM
    const startUpdateLoop = useCallback((doc: Document) => {
        const tick = () => {
            if (!isOpenRef.current) return;

            const surahName = doc.getElementById("pip-surah-name");
            const verseNum = doc.getElementById("pip-verse-num");
            const arabicEl = doc.getElementById("pip-arabic");
            const fill = doc.getElementById("pip-fill");
            const timeCur = doc.getElementById("pip-time-cur");
            const timeDur = doc.getElementById("pip-time-dur");
            const iconPlay = doc.getElementById("pip-icon-play") as HTMLElement | null;
            const iconPause = doc.getElementById("pip-icon-pause") as HTMLElement | null;
            const spinner = doc.getElementById("pip-spinner") as HTMLElement | null;

            // These are closures over React state — they read the latest values
            // because we cancel & restart the loop on context changes.
            if (surahName) surahName.textContent = currentSurah?.name_simple ?? "—";
            if (verseNum) {
                const v = currentVerseKey?.split(":")?.[1];
                verseNum.textContent = v ? v : "—";
            }

            if (arabicEl) {
                const words = currentVerse?.words?.filter(w => w.char_type_name !== "end") || [];
                const currentVerseKeyStr = currentVerseKey ?? "";

                // Only rebuild spans if the verse has changed
                if ((arabicEl as any)._lastVerseKey !== currentVerseKeyStr) {
                    (arabicEl as any)._lastVerseKey = currentVerseKeyStr;
                    arabicEl.innerHTML = "";

                    if (words.length > 0) {
                        words.forEach(w => {
                            const span = doc.createElement("span");
                            span.className = "pip-word";
                            span.id = `pip-word-${w.position}`;
                            span.textContent = w.text_uthmani ?? (w as any).text ?? "";
                            arabicEl.appendChild(span);
                            arabicEl.appendChild(doc.createTextNode(" "));
                        });
                    } else {
                        arabicEl.textContent = currentVerse?.text_uthmani ?? "";
                    }
                }

                // Update word highlights and auto-scroll
                if (words.length > 0) {
                    words.forEach(w => {
                        const span = doc.getElementById(`pip-word-${w.position}`);
                        if (span) {
                            if (w.position === currentWordPosition) {
                                span.classList.add("pip-word-highlight");
                                
                                // Auto-scroll to keep the highlighted word visible
                                if ((arabicEl as any)._lastHighlightedWord !== currentWordPosition) {
                                    (arabicEl as any)._lastHighlightedWord = currentWordPosition;
                                    span.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center',
                                        inline: 'nearest' 
                                    });
                                }
                            } else {
                                span.classList.remove("pip-word-highlight");
                            }
                        }
                    });
                }
            }
            const progress = surahDuration > 0 ? (surahCurrentTime / surahDuration) * 100 : 0;
            if (fill) fill.style.width = `${progress}%`;
            if (timeCur) timeCur.textContent = fmt(surahCurrentTime);
            if (timeDur) timeDur.textContent = fmt(surahDuration);

            if (isLoading) {
                if (iconPlay) iconPlay.style.display = "none";
                if (iconPause) iconPause.style.display = "none";
                if (spinner) spinner.style.display = "block";
            } else if (isPlaying) {
                if (iconPlay) iconPlay.style.display = "none";
                if (iconPause) iconPause.style.display = "block";
                if (spinner) spinner.style.display = "none";
            } else {
                if (iconPlay) iconPlay.style.display = "block";
                if (iconPause) iconPause.style.display = "none";
                if (spinner) spinner.style.display = "none";
            }

            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [currentSurah, currentVerseKey, currentVerse, currentWordPosition, surahCurrentTime, surahDuration, isPlaying, isLoading]);

    // Stop the RAF loop & close window
    const closePip = useCallback(() => {
        isOpenRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        try { pipWindowRef.current?.close(); } catch { /* already closed */ }
        pipWindowRef.current = null;
    }, []);

    // Open the PiP window
    const openPip = useCallback(async () => {
        if (!("documentPictureInPicture" in window)) {
            alert("Your browser does not support the Picture-in-Picture feature.\nPlease use Chrome or Edge 111+.");
            return;
        }

        // If already open, close and reopen to bring focus
        if (pipWindowRef.current) {
            closePip();
        }

        try {
            const pipWin = await window.documentPictureInPicture!.requestWindow({
                width: PIP_WIDTH,
                height: PIP_HEIGHT,
            });
            pipWindowRef.current = pipWin;
            isOpenRef.current = true;

            // Clone styles + build DOM
            injectStyles(pipWin.document);
            buildDOM(pipWin.document);
            wireEvents(pipWin.document);
            startUpdateLoop(pipWin.document);

            // When user closes the PiP window (via the browser's X button)
            pipWin.addEventListener("pagehide", () => {
                isOpenRef.current = false;
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                pipWindowRef.current = null;
            });
        } catch (err: any) {
            if (err?.name !== "NotAllowedError") {
                console.error("[PiP] Failed to open window:", err);
            }
        }
    }, [injectStyles, buildDOM, wireEvents, startUpdateLoop]);

    // When player state changes, restart the update loop so closures capture fresh values
    useEffect(() => {
        if (!isOpenRef.current || !pipWindowRef.current) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        startUpdateLoop(pipWindowRef.current.document);
    }, [currentSurah, currentVerseKey, currentVerse, currentWordPosition, surahCurrentTime, surahDuration, isPlaying, isLoading, startUpdateLoop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            closePip();
        };
    }, [closePip]);

    const isPipOpen = isOpenRef.current;
    return { openPip, closePip, isPipOpen };
}
