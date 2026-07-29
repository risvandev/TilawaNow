"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchSurah, fetchVerses, Surah, Verse } from "@/lib/quran-api";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GROUP_SIZE = 5;

const SurahStoryPage = () => {
    const { surahId } = useParams();
    const [surah, setSurah] = useState<Surah | null>(null);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [story, setStory] = useState<string>("");

    // Loading states
    const [loadingSurah, setLoadingSurah] = useState(true);

    // Persist translation settings
    const [translationId, setTranslationId] = useState<number>(131);
    const [script, setScript] = useState<string>("text_uthmani");
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // 0. Load settings from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTranslationId = parseInt(localStorage.getItem("quranTranslation") || "131");
            const savedScript = localStorage.getItem("quranScript") || "text_uthmani";
            setTranslationId(savedTranslationId);
            setScript(savedScript);
            setSettingsLoaded(true);
        }
    }, []);

    const sIdStr = typeof surahId === "string" ? surahId : Array.isArray(surahId) ? surahId[0] : "";

    // 1. Initial Load: Surah & Verses
    useEffect(() => {
        const loadInitialData = async () => {
            if (!sIdStr || !settingsLoaded) return;
            setLoadingSurah(true);
            try {
                const sId = parseInt(sIdStr);
                const [surahData, versesData] = await Promise.all([
                    fetchSurah(sId),
                    fetchVerses(sId, translationId, 1, 300, script)
                ]);
                setSurah(surahData);
                setVerses(versesData.verses);
            } catch (error) {
                console.error("Failed to load surah", error);
            } finally {
                setLoadingSurah(false);
            }
        };
        loadInitialData();
    }, [sIdStr, translationId, script, settingsLoaded]);

    // 2. Compute Story for Current Group
    useEffect(() => {
        if (verses.length === 0) return;
        const groupVerses = getGroupVerses(currentGroupIndex);
        const combinedText = groupVerses.map(v => v.translations?.[0]?.text.replace(/<[^>]*>/g, "")).join(" ");
        setStory(combinedText);
    }, [currentGroupIndex, verses]);

    const getGroupVerses = (groupIndex: number) => {
        const start = groupIndex * GROUP_SIZE;
        return verses.slice(start, start + GROUP_SIZE);
    };

    const handleNext = () => {
        if ((currentGroupIndex + 1) * GROUP_SIZE < verses.length) {
            setCurrentGroupIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentGroupIndex > 0) {
            setCurrentGroupIndex(prev => prev - 1);
        }
    };

    if (loadingSurah) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!surah || verses.length === 0) return <div className="min-h-screen flex items-center justify-center">Surah not found.</div>;

    const currentGroupVerses = getGroupVerses(currentGroupIndex);
    const startVerseNum = currentGroupVerses[0]?.verse_number;
    const endVerseNum = currentGroupVerses[currentGroupVerses.length - 1]?.verse_number;

    return (
        <div className="min-h-screen bg-background text-foreground font-serif selection:bg-primary/20 flex flex-col items-center p-2 md:p-6 transition-colors duration-500">
            {/* Header */}
            <div className="max-w-3xl w-full flex items-center justify-between mb-8">
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground px-2 md:px-4">
                    <Link href={`/read/${sIdStr}`}>
                        <ChevronLeft className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Back to Quran</span>
                    </Link>
                </Button>
                <div className="text-right md:text-center">
                    <h1 className="text-lg md:text-xl font-bold">{surah.name_simple}</h1>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Surah Explained • Verses {startVerseNum}-{endVerseNum}</p>
                </div>
                <div className="w-8 md:w-24" />
            </div>

            {/* Story Card */}
            <div className="max-w-3xl w-full flex-1 flex flex-col justify-center min-h-[60vh]">
                <div className="w-full transition-all duration-500">
                    {/* Content */}
                    <div className="relative z-10 flex flex-col gap-8 text-center transition-all duration-300">
                        {/* Story Text */}
                        <div className="min-h-[200px] flex items-center justify-center">
                            <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed mx-auto font-medium text-foreground/90 animate-fade-in w-full text-center">
                                {story}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-xl w-full mt-12 grid grid-cols-2 gap-8">
                <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentGroupIndex === 0}
                    className="group text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                >
                    <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Previous
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleNext}
                    disabled={(currentGroupIndex + 1) * GROUP_SIZE >= (verses?.length || 0)}
                    className="group text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                >
                    Next Part
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            <div className="mt-8 text-xs text-muted-foreground">
                Part {currentGroupIndex + 1} / {Math.ceil((verses?.length || 0) / GROUP_SIZE)}
            </div>

        </div>
    );
};

export default SurahStoryPage;
