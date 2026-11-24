"use client";

import { sanitizeQuranMarkup } from "@/lib/quran-markup";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchSurah, fetchSurahInfo, Surah } from "@/lib/quran-api";
import { ChevronLeft, Loader2 } from "lucide-react";

const SurahInfoPage = () => {
    const params = useParams();
    const surahId = params?.surahId as string;
    
    const [surah, setSurah] = useState<Surah | null>(null);
    const [infoText, setInfoText] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!surahId) return;
            setLoading(true);

            try {
                const idStr = Array.isArray(surahId) ? surahId[0] : surahId;
                const id = parseInt(idStr);
                
                const surahData = await fetchSurah(id);
                setSurah(surahData);

                if (surahData) {
                    const infoData = await fetchSurahInfo(id);
                    setInfoText(infoData?.text || "");
                }
            } catch (error) {
                console.error("Error fetching surah info:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [surahId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!surah) return null;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                {/* Back Navigation */}
                <Link href={`/read/${surahId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-12 text-sm no-underline transition-colors group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Reading</span>
                </Link>

                {/* Header Section */}
                <header className="mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-10">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl ring-1 ring-primary/20">
                                    {surah.id}
                                </span>
                                <span className="text-muted-foreground uppercase tracking-[0.2em] text-xs font-bold">Surah Information</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">{surah.name_simple}</h1>
                            <div className="flex items-center gap-3 text-muted-foreground text-xl md:text-2xl">
                                <span className="font-arabic text-primary">{surah.name_arabic}</span>
                                <span className="opacity-30">•</span>
                                <span>{surah.translated_name.name}</span>
                            </div>
                        </div>
                        
                        {/* Surah Stats Card */}
                        <div className="grid grid-cols-2 gap-4 bg-secondary/30 p-6 rounded-3xl border border-border/50 backdrop-blur-sm">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Revelation</p>
                                <p className="font-bold text-lg">{surah.revelation_place}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Verses</p>
                                <p className="font-bold text-lg">{surah.verses_count}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Order</p>
                                <p className="font-bold text-lg">#{surah.revelation_order}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Pages</p>
                                <p className="font-bold text-lg">{surah.pages[0]}-{surah.pages[surah.pages.length-1]}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-16">
                    {infoText ? (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div 
                                className="markdown-content quran-info-content max-w-none prose prose-invert prose-primary"
                                dangerouslySetInnerHTML={{ __html: sanitizeQuranMarkup(infoText) }}
                            />
                        </section>
                    ) : (
                        <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border">
                            <p className="text-muted-foreground italic">Detailed information for this Surah is currently unavailable.</p>
                        </div>
                    )}
                </div>

                <footer className="mt-20 pt-10 border-t border-border/20 text-center">
                    <p className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Source: Quran.com</p>
                </footer>
            </div>

            <style jsx global>{`
                .quran-info-content {
                    font-size: 1.125rem;
                    line-height: 1.8;
                    color: hsl(var(--foreground) / 0.9);
                }
                .quran-info-content h2 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-top: 3.5rem;
                    margin-bottom: 1.5rem;
                    color: hsl(var(--foreground));
                    border-bottom: 1px solid hsl(var(--border) / 0.4);
                    padding-bottom: 0.75rem;
                    letter-spacing: -0.025em;
                }
                .quran-info-content h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    color: hsl(var(--foreground));
                }
                .quran-info-content p {
                    margin-bottom: 1.5rem;
                }
                .quran-info-content ul, .quran-info-content ol {
                    margin-bottom: 1.5rem;
                    padding-left: 1.5rem;
                }
                .quran-info-content li {
                    margin-bottom: 0.75rem;
                }
                .quran-info-content blockquote {
                    border-left: 4px solid hsl(var(--primary) / 0.3);
                    padding-left: 1.5rem;
                    font-style: italic;
                    color: hsl(var(--muted-foreground));
                    margin: 2.5rem 0;
                }

                /* Mobile Optimizations */
                @media (max-width: 768px) {
                    .quran-info-content {
                        font-size: 1rem;
                        line-height: 1.7;
                    }
                    .quran-info-content h2 {
                        font-size: 1.5rem;
                        margin-top: 2.5rem;
                        margin-bottom: 1.25rem;
                    }
                    .quran-info-content h3 {
                        font-size: 1.25rem;
                        margin-top: 2rem;
                        margin-bottom: 0.75rem;
                    }
                    .quran-info-content p {
                        margin-bottom: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default SurahInfoPage;
