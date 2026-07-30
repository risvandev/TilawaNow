"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, User, Settings, Play, Pause, Loader2, RotateCcw, Activity, ArrowUpRight, Sparkles } from "lucide-react";
import { POPULAR_SURAHS } from "@/lib/quran-api";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { InviteDialog } from "@/components/InviteDialog";
import { supabase } from "@/lib/supabase";

import { useBookmarks } from "@/contexts/BookmarksContext";
import { useKhatmah } from "@/contexts/KhatmahContext";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { usePrefetch } from "@/hooks/use-prefetch";
import { cn } from "@/lib/utils";

const Home = () => {
  const { user } = useAuth();
  const { prefetchRoute, prefetchSurahData } = usePrefetch();
  const [readingProfile, setReadingProfile] = useState<{ last_read_surah: number; last_read_ayah: number } | null>(null);
  const navigate = useRouter();
  const { dailyActivity } = useBookmarks();
  const { isKhatmahActive, currentProgress, isLoading, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const { unlockAudio } = useAudioPlayer();
  const [greeting, setGreeting] = useState("Good morning");

  // Calculate Today's Activity
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivity = dailyActivity.find(d => d.date === todayStr);
  const ayahsToday = todayActivity ? todayActivity.count : 0;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good evening");
    else setGreeting("Good night");
  }, []);

  useEffect(() => {
    const fetchReadingProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("last_read_ayah")
        .eq("id", user.id)
        .maybeSingle();

      if (data && data.last_read_ayah) {
        const [surahStr, ayahStr] = data.last_read_ayah.split(':');
        const surahId = parseInt(surahStr);
        const ayahId = parseInt(ayahStr);
        setReadingProfile({
          last_read_surah: surahId,
          last_read_ayah: ayahId
        });
        // Pre-fetch surah data and route in background for instant transition
        prefetchSurahData(surahId);
        prefetchRoute(`/read/${surahId}?verse=${ayahId}&play=true`);
      }
    };
    fetchReadingProfile();
  }, [user, prefetchRoute, prefetchSurahData]);

  // Premium Mac Glass Class
  const glassPanelClass = "md:bg-secondary/40 md:backdrop-blur-3xl md:border md:border-white/[0.08] md:shadow-2xl md:shadow-black/40 md:rounded-[2rem] md:p-6 p-4 border-none bg-transparent rounded-none relative transition-all duration-500 group md:hover:bg-secondary/50 md:hover:border-white/[0.12]";

  return (
    <div className="relative min-h-screen bg-background overflow-x-clip font-sans">

      {/* Ambient Mac-like Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-premium-accent/10 blur-[140px] pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-white/5 blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-4 md:py-12 lg:py-20 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 md:mb-12 animate-fade-in-up mt-2 md:mt-0 p-4 md:p-0 bg-secondary/30 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-[2rem] md:rounded-none border border-white/10 md:border-transparent shadow-lg shadow-black/20 md:shadow-none">
          <div className="flex-1">
            <p className="text-[10px] md:text-base text-muted-foreground/80 font-bold md:font-medium tracking-wider md:tracking-wide uppercase md:normal-case mb-0.5 md:mb-2">
              {greeting}
            </p>
            <h1 className="text-xl md:text-5xl font-extrabold tracking-tight md:tracking-tighter text-foreground drop-shadow-sm">
              {user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Friend') : 'Guest'}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <>
                <InviteDialog />
                <Button asChild variant="outline" size="icon" className="w-10 h-10 md:w-auto md:h-10 md:px-4 rounded-full md:rounded-xl border-white/10 bg-secondary/40 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all text-xs font-semibold tracking-wide shadow-lg shrink-0">
                  <Link href="/settings" className="flex items-center justify-center md:gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">Profile</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <InviteDialog />
                <Button asChild variant="hero" size="sm" className="h-10 rounded-full md:rounded-xl shadow-primary/20 shrink-0">
                  <Link href="/account">Account</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">

          {/* Khatmah Widget - Spans 7 cols */}
          <div className={cn(glassPanelClass, "md:col-span-7 flex flex-col justify-between animate-fade-in-up")} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>
            {/* Permanent subtle glow orb at the top */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
              <div className="absolute -top-24 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-[70px]" />
            </div>

            <div className="flex justify-end md:items-start md:justify-between mb-2 md:mb-8 relative z-10">
              <div className="hidden md:flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Khatmah</h3>
                  <p className="text-sm text-muted-foreground/80 font-medium">Continuous Recitation</p>
                </div>
              </div>

              {currentProgress && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                  onClick={async () => {
                    if (confirm("Are you sure you want to restart your Khatmah from the beginning?")) {
                      await restartKhatmah();
                    }
                  }}
                  disabled={isLoading}
                  title="Restart Khatmah"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="relative z-10 w-full">
              <p className="hidden md:block text-sm text-muted-foreground mb-6">
                {currentProgress
                  ? `You are currently on Surah ${currentProgress.surah_id}. Maintain your pace to finish the Quran.`
                  : "Embark on a guided journey to complete the recitation of the Holy Quran."}
              </p>

              <Button
                variant={isKhatmahActive ? "outline" : "hero"}
                onClick={async () => {
                  if (isKhatmahActive) {
                    stopKhatmah();
                  } else {
                    await startKhatmah();
                    const targetSurah = currentProgress?.surah_id || 1;
                    navigate.push(`/read/${targetSurah}`);
                  }
                }}
                disabled={isLoading}
                className={cn(
                  "flex justify-center items-center w-full h-14 md:h-12 rounded-[2rem] md:rounded-xl text-base md:text-sm font-bold tracking-wide transition-all shadow-xl md:shadow-lg shadow-black/20",
                  isKhatmahActive ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 hover:border-destructive/30" : "bg-gradient-to-r from-primary/80 to-primary text-primary-foreground md:bg-hero md:text-hero-foreground"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isKhatmahActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Journey
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {currentProgress ? "Resume Khatmah" : "Begin Khatmah"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Continue Reading - Spans 5 cols */}
          <div className={cn(glassPanelClass, "md:col-span-5 flex flex-col justify-between animate-fade-in-up")} style={{ animationDelay: '150ms', animationFillMode: 'forwards', opacity: 0 }}>
            {/* Permanent subtle glow orb at the top */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
              <div className="absolute -top-24 -left-12 w-64 h-64 bg-primary/20 rounded-full blur-[70px]" />
            </div>

            <div className="relative z-10 hidden md:block">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 block mb-6">
                Recent Progress
              </span>
              <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                {readingProfile ? "Jump back in" : "Start Reading"}
              </h3>
              <p className="text-sm text-muted-foreground/80 leading-relaxed mb-8">
                {readingProfile
                  ? "Continue exactly where you left off in your last session."
                  : "Open the Book and begin discovering its divine wisdom."}
              </p>
            </div>

            <Button asChild variant="outline" className="flex w-full h-14 md:h-12 rounded-[2rem] md:rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-semibold relative z-10 shadow-xl md:shadow-lg text-base md:text-sm p-0">
              <Link onClick={() => { if (readingProfile) unlockAudio(); }} href={readingProfile ? `/read/${readingProfile.last_read_surah}?verse=${readingProfile.last_read_ayah}&play=true` : "/read"} className="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-2 leading-none">
                <div className="flex items-center gap-1 leading-none">
                  <span>{readingProfile ? "Continue Reading" : "Open Quran"}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                {readingProfile && (
                  <span className="text-[10px] md:text-xs text-muted-foreground/70 font-normal leading-none -mt-0.5 md:mt-0">
                    (Resume from Surah {readingProfile.last_read_surah}:{readingProfile.last_read_ayah})
                  </span>
                )}
              </Link>
            </Button>
          </div>

          {/* Today's Activity - Spans 4 cols */}
          <div className={cn(glassPanelClass, "md:col-span-4 flex flex-col justify-center animate-fade-in-up")} style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="hidden md:flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-premium-accent/10 flex items-center justify-center shrink-0 border border-premium-accent/20">
                <Activity className="w-5 h-5 text-premium-accent" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                Today
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-extrabold text-foreground tracking-tighter drop-shadow-md">
                  {ayahsToday}
                </span>
                <span className="text-sm font-semibold text-premium-accent">
                  Ayahs <span className="md:hidden">Today</span>
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground/70">
                Read today. Consistency is key.
              </p>
            </div>
          </div>

          {/* Benefits Section - Spans 8 cols */}
          <div className={cn(glassPanelClass, "md:col-span-8 flex flex-col justify-center animate-fade-in-up")} style={{ animationDelay: '250ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-primary opacity-80" />
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground/90">Daily Blessings</h2>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-3 gap-0 md:gap-4 divide-y divide-white/5 md:divide-none">
              {[
                "Surah Al-Mulk at night provides protection from the grave.",
                "Surah Al-Kahf on Friday brings light for the week.",
                "Surah Ya-Sin is the heart of the Quran."
              ].map((benefit, i) => (
                <div key={i} className="py-4 md:p-4 md:rounded-2xl md:bg-black/20 border-none md:border md:border-white/5 hover:bg-black/30 transition-colors">
                  <p className="text-sm md:text-xs text-muted-foreground/90 leading-relaxed font-medium">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access - Spans 12 cols */}
          <div className={cn(glassPanelClass, "md:col-span-12 animate-fade-in-up")} style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Quick Access</h2>
                <p className="text-xs text-muted-foreground/60 mt-1">Frequently read chapters</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {POPULAR_SURAHS.map((surah) => (
                <Link
                  key={surah.number}
                  href={`/read/${surah.number}`}
                  className="flex flex-col items-start md:items-center justify-center p-2 md:p-4 rounded-2xl bg-transparent md:bg-white/[0.03] border-none md:border md:border-white/5 hover:bg-white/[0.04] md:hover:bg-white/[0.08] transition-all duration-300 group/surah"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground/60 mb-0.5 md:w-10 md:h-10 md:rounded-xl md:bg-secondary/80 md:flex md:items-center md:justify-center md:text-sm md:font-bold md:text-foreground/80 md:mb-3 group-hover/surah:bg-primary/20 group-hover/surah:text-primary md:border md:border-white/5 md:shadow-inner">
                    {surah.number}
                  </span>
                  <h4 className="font-bold text-base md:text-sm text-foreground mb-0.5 md:mb-1">{surah.name}</h4>
                  <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">{surah.verses} verses</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quote Section - Spans 12 cols */}
          <div className="md:col-span-12 flex flex-col items-center justify-center text-center py-16 animate-fade-in-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="relative z-10 max-w-3xl">
              <p className="font-arabic text-3xl md:text-5xl leading-loose md:leading-[2.5] text-foreground mb-6 text-balance">
                إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ
              </p>
              <p className="text-base md:text-lg text-muted-foreground/90 italic mb-4 font-medium tracking-wide">
                "Indeed, this Quran guides to that which is most suitable."
              </p>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-premium-accent/80">Surah Al-Isra (17:9)</p>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;

