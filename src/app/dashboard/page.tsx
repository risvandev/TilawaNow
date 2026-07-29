"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Target,
  Flame,
  Calendar,
  Award,
  Clock,
  Settings,
  Activity,
  Play,
  Pause,
  Loader2,
  RotateCcw,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { RestrictedAccess } from "@/components/auth/RestrictedAccess";
import { QURAN_STATS } from "@/lib/quran-api";
import { usePrefetch } from "@/hooks/use-prefetch";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useKhatmah } from "@/contexts/KhatmahContext";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { supabase } from "@/lib/supabase";
import { useSurahs } from "@/hooks/use-quran-queries";

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload || !payload.value) return null;
  const parts = String(payload.value).split(" ");
  const dayName = parts[0] || "";
  const dateNum = parts[1] || "";

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={10} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={11} fontWeight={700}>
        {dateNum}
      </text>
      <text x={0} y={23} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={9} fontWeight={500} opacity={0.7}>
        {dayName}
      </text>
    </g>
  );
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { prefetchRoute, prefetchSurahData } = usePrefetch();
  const navigate = useRouter();
  const { readingHistory, userStats, dailyActivity } = useBookmarks();
  const { isKhatmahActive, currentProgress, isLoading: isKhatmahLoading, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const { unlockAudio } = useAudioPlayer();
  const { data: allSurahs = [] } = useSurahs();
  // unused state removed

  // Premium Mac Glass Class
  const glassPanelClass = "md:bg-secondary/40 md:backdrop-blur-3xl md:border md:border-white/[0.08] md:shadow-2xl md:shadow-black/40 md:rounded-[2rem] md:p-6 p-4 border-none bg-transparent rounded-none relative transition-all duration-500 group md:hover:bg-secondary/50 md:hover:border-white/[0.12]";

  // Derived Stats
  const totalSurahsStarted = readingHistory.length;
  const totalAyahsRead = userStats.totalAyahsRead;
  const currentStreak = userStats.currentStreak;

  // Calculate Today's Progress (Count only)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivity = dailyActivity.find(d => d.date === todayStr);
  const ayahsToday = todayActivity ? todayActivity.count : 0;

  // Activity Data
  const activityData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      return d;
    });

    return last14Days.map(d => {
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      const activity = dailyActivity.find(a => a.date === dateStr);
      const formattedDate = `${dayName} ${d.getDate()}`;
      return { name: formattedDate, ayahs: activity ? activity.count : 0 };
    });
  }, [dailyActivity]);

  const chartScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollRight = () => {
      if (chartScrollRef.current) {
        chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
      }
    };
    scrollRight();
    const timer = setTimeout(scrollRight, 150);
    return () => clearTimeout(timer);
  }, [activityData]);

  // Recent Sessions
  const recentSessions = [...readingHistory]
    .sort((a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime())
    .slice(0, 3)
    .map(h => {
      return {
        surah: `Surah ${h.surah_id}`,
        ayahs: h.verse_key?.split(':')[1] || "1",
        date: new Date(h.last_read_at).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
        duration: "recently"
      };
    });

  const [suggestion, setSuggestion] = useState<{ type: 'unread' | 'popular', title: string, subtitle: string, link: string } | null>(null);

  useEffect(() => {
    if (!user || allSurahs.length === 0) return;

    if (readingHistory.length > 0) {
      const latest = readingHistory[0];
      const lastReadSurah = latest.surah_id;
      const lastReadAyah = latest.verse_key ? parseInt(latest.verse_key.split(':')[1]) : 1;
      const surahName = allSurahs.find(s => s.id === lastReadSurah)?.name_simple || "Surah";
      
      setSuggestion({
        type: 'popular', 
        title: "Continue Reading",
        subtitle: `Resume from ${surahName} Ayah ${lastReadAyah}`,
        link: `/read/${lastReadSurah}?verse=${lastReadAyah}&play=true`
      });

      // Pre-fetch surah data and route in background for instant transition
      prefetchSurahData(lastReadSurah);
      prefetchRoute(`/read/${lastReadSurah}?verse=${lastReadAyah}&play=true`);
    } else {
      const unreadSurah = allSurahs[0];
      if (unreadSurah) {
        setSuggestion({
          type: 'unread',
          title: "Start Your Journey",
          subtitle: `Read Surah ${unreadSurah.name_simple} (${unreadSurah.translated_name.name})`,
          link: `/read/${unreadSurah.id}`
        });
      }
    }
  }, [user, readingHistory, allSurahs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <RestrictedAccess 
        title="Dashboard Restricted"
        description="Sign in to track your reading progress and save bookmarks."
        icon={BookOpen}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden font-sans pb-32 md:pb-0">
      
      {/* Ambient Mac-like Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-premium-accent/10 blur-[140px] pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-white/5 blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-4 md:py-12 lg:py-20 max-w-7xl">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 md:mb-12 animate-fade-in-up mt-2 md:mt-0 p-4 md:p-0 bg-secondary/30 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-[2rem] md:rounded-none border border-white/10 md:border-transparent shadow-lg shadow-black/20 md:shadow-none">
          <div className="flex-1">
            <p className="text-[10px] md:text-base text-muted-foreground/80 font-bold md:font-medium tracking-wider md:tracking-wide uppercase md:normal-case mb-0.5 md:mb-2">
              <span className="md:hidden">DASHBOARD</span>
              <span className="hidden md:inline">Welcome back,</span>
            </p>
            <h1 className="text-xl md:text-5xl font-extrabold tracking-tight md:tracking-tighter text-foreground drop-shadow-sm">
              {user.user_metadata?.full_name?.split(' ')[0] || 'Friend'}
            </h1>
            <p className="hidden md:block text-sm md:text-base text-muted-foreground/80 font-medium tracking-wide mt-1">
              Your spiritual journey continues.
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-sm font-bold text-foreground">Current Streak</span>
              <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
                <Flame className="w-3 h-3" /> {currentStreak} days
              </span>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                // Clear session cache to force hard fetch
                sessionStorage.removeItem(`user_data_${user.id}`);
                window.location.reload();
              }}
              className="w-10 h-10 md:h-12 md:w-12 rounded-full md:rounded-xl border-white/10 bg-secondary/40 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all shadow-lg shrink-0 group/refresh"
              title="Refresh Stats"
            >
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5 group-hover/refresh:rotate-180 transition-transform duration-500" />
            </Button>
            <Button asChild variant="outline" size="icon" className="w-10 h-10 md:h-12 md:w-12 rounded-full md:rounded-xl border-white/10 bg-secondary/40 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all shadow-lg shrink-0">
              <Link href="/settings">
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min mb-6">
          
          {/* Top Row: Khatmah & Stats */}
          
          {/* Khatmah Widget - Spans 7 cols if active */}
          {currentProgress && (
            <div className={cn(glassPanelClass, "md:col-span-7 flex flex-col justify-between animate-fade-in-up")} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-24 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-[70px]" />
              </div>
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">Khatmah</h3>
                    <p className="text-sm text-muted-foreground/80 font-medium">Continuous Recitation</p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                  onClick={async () => {
                    if (confirm("Are you sure you want to restart your Khatmah from the beginning?")) {
                      await restartKhatmah();
                    }
                  }}
                  disabled={isKhatmahLoading}
                  title="Restart Khatmah"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative z-10">
                <p className="text-sm text-muted-foreground mb-6">
                  You are currently on Surah {currentProgress.surah_id}. Maintain your pace to finish the Quran.
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
                  disabled={isKhatmahLoading}
                  className={cn(
                    "w-full h-12 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-black/20",
                    isKhatmahActive ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 hover:border-destructive/30" : ""
                  )}
                >
                  {isKhatmahLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isKhatmahActive ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Journey
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume Khatmah
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Quick Stats - Spans 5 cols if Khatmah active, 12 cols if no Khatmah */}
          <div className={cn(glassPanelClass, currentProgress ? "md:col-span-5" : "md:col-span-12", "animate-fade-in-up p-4 md:p-4")} style={{ animationDelay: '150ms', animationFillMode: 'forwards', opacity: 0 }}>
             <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
               <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-premium-accent/20 rounded-full blur-[70px]" />
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-1 gap-3 md:gap-4 relative z-10">
               <div className="bg-white/[0.02] md:bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 flex items-center justify-between transition-all hover:bg-white/[0.06]">
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Ayahs Today</p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{ayahsToday}</h3>
                  </div>
                  <div className="hidden md:flex w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
               </div>
               
               <div className="bg-white/[0.02] md:bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 flex items-center justify-between transition-all hover:bg-white/[0.06]">
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Surahs Started</p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{totalSurahsStarted} <span className="text-xs md:text-sm font-medium text-muted-foreground">/ 114</span></h3>
                  </div>
                  <div className="hidden md:flex w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Second Row: Activity Chart & Recent Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min mb-6">
          
          {/* Reading Activity Area Chart - Spans 8 cols */}
          <div className={cn(glassPanelClass, "md:col-span-8 flex flex-col animate-fade-in-up")} style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="flex items-center justify-between mb-4 md:mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Reading Activity</p>
                  <h3 className="text-lg md:text-lg font-extrabold md:font-bold text-foreground tracking-tight">
                    <span className="md:hidden">Past 14 Days</span>
                    <span className="hidden md:inline">Reading Activity</span>
                  </h3>
                  <p className="hidden md:block text-xs text-muted-foreground font-medium">Ayahs read over the last 14 days</p>
                </div>
              </div>
            </div>
            
            <div ref={chartScrollRef} className="h-[240px] md:h-[270px] w-full relative z-10 overflow-x-auto overflow-y-hidden scrollbar-none [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-2 md:mt-10">
              <div className="h-full min-w-[550px] md:min-w-[700px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorAyahs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    axisLine={false} 
                    tickLine={false} 
                    tick={<CustomXAxisTick />}
                    height={45}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(var(--background), 0.8)', 
                      backdropFilter: 'blur(12px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '16px', 
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.3 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ayahs" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAyahs)" 
                    activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  />
                </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Sessions & Suggestion - Spans 4 cols */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            <div className={cn(glassPanelClass, "flex-1 animate-fade-in-up")} style={{ animationDelay: '250ms', animationFillMode: 'forwards', opacity: 0 }}>
              <div className="flex items-center gap-3 mb-4 md:mb-6 relative z-10">
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-foreground">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Activity History</p>
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Recent Sessions</h3>
                </div>
              </div>
              
              <div className="relative z-10 pl-4 md:pl-0 space-y-4 md:space-y-3 border-l-2 border-white/10 md:border-l-0 ml-2 md:ml-0">
                {recentSessions.length > 0 ? (
                  recentSessions.map((activity, index) => (
                    <div key={index} className="relative group flex items-baseline justify-between p-0 md:p-4 rounded-none md:rounded-2xl bg-transparent md:bg-white/[0.02] border-none md:border md:border-white/5 hover:bg-white/[0.06] transition-all duration-300">
                      {/* Mobile Timeline Node Dot */}
                      <span className="md:hidden absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background shadow-sm shadow-primary" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="font-bold text-base md:text-sm text-foreground truncate">{activity.surah}</p>
                          <span className="text-xs font-semibold text-primary">· Ayah {activity.ayahs}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 font-medium md:hidden mt-0.5">{activity.date}</p>
                      </div>

                      <div className="hidden md:block text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{activity.date.split(',')[0]}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                  </div>
                )}
              </div>
            </div>

            {suggestion && (
               <div className={cn(glassPanelClass, "animate-fade-in-up p-4 md:p-6")} style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>
                 <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 rounded-[2rem]" />
                 
                 {/* Desktop Suggestion Card */}
                 <div className="hidden md:flex relative z-10 flex-col items-center text-center">
                   <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
                     <Flame className="w-6 h-6" />
                   </div>
                   <h4 className="font-bold text-foreground mb-1">{suggestion.title}</h4>
                   <p className="text-xs text-muted-foreground mb-5">{suggestion.subtitle}</p>
                   <Button asChild variant="hero" className="w-full rounded-xl shadow-lg shadow-black/20">
                     <Link onClick={() => unlockAudio()} href={suggestion.link}>Go to {suggestion.type === 'unread' ? 'Surah' : 'Ayah'}</Link>
                   </Button>
                 </div>

                 {/* Mobile Minimal White Button */}
                 <div className="md:hidden">
                   <Button asChild className="flex flex-col items-center justify-center w-full h-14 rounded-[2rem] bg-white text-black hover:bg-white/90 border-none transition-all font-semibold relative z-10 shadow-2xl p-0">
                     <Link onClick={() => unlockAudio()} href={suggestion.link} className="flex flex-col items-center justify-center gap-0 leading-none">
                       <div className="text-black font-extrabold text-base leading-none">
                         <span>{suggestion.title}</span>
                       </div>
                       <span className="text-[11px] text-black/75 font-medium leading-none -mt-0.5">
                         ({suggestion.subtitle})
                       </span>
                     </Link>
                   </Button>
                 </div>
               </div>
            )}
            
          </div>
        </div>

        {/* Third Row: Active Days Leaderboard + Achievements */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 auto-rows-min mb-12">

           {/* Active Days — Standalone Leaderboard Card (Mobile) */}
           <div className="md:hidden animate-fade-in-up bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-[2rem] p-5 relative overflow-hidden" style={{ animationDelay: '380ms', animationFillMode: 'forwards', opacity: 0 }}>
             <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-3">
                 <div>
                   <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400/80 mb-0.5">Your Streak</p>
                   <h3 className="text-lg font-extrabold text-foreground tracking-tight">Active Days</h3>
                 </div>
                 <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-extrabold text-foreground tracking-tighter">{userStats.totalActiveDays}</span>
                   <span className="text-xs font-semibold text-muted-foreground/60">days</span>
                 </div>
               </div>
               <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                 <div 
                   className="h-full bg-gradient-to-r from-orange-500/70 to-orange-400 rounded-full transition-all duration-500" 
                   style={{ width: `${Math.min(100, (userStats.totalActiveDays / (userStats.totalActiveDays < 7 ? 7 : userStats.totalActiveDays < 30 ? 30 : userStats.totalActiveDays < 100 ? 100 : 365)) * 100)}%` }}
                 />
               </div>
               <Link href="/leaderboard" className="flex items-center justify-center w-full py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-bold text-foreground hover:bg-white/10 transition-all">
                 View Community Leaderboard
               </Link>
             </div>
           </div>

           {/* Achievements (3 remaining + Active Days on Desktop) */}
           <div className={cn(glassPanelClass, "animate-fade-in-up bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 md:p-6 md:bg-transparent md:border-none md:rounded-none")} style={{ animationDelay: '400ms', animationFillMode: 'forwards', opacity: 0 }}>
              <div className="flex items-center gap-3 mb-6 md:mb-8 relative z-10">
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 items-center justify-center text-yellow-500">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Milestones</p>
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Achievements</h3>
                  <p className="hidden md:block text-xs text-muted-foreground font-medium">Your lifetime milestones</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:grid md:grid-cols-4 md:gap-4 relative z-10">
                {[
                  { 
                    label: "Active Days", 
                    value: `${userStats.totalActiveDays}`, 
                    displayValue: `${userStats.totalActiveDays} / ${userStats.totalActiveDays < 7 ? 7 : userStats.totalActiveDays < 30 ? 30 : userStats.totalActiveDays < 100 ? 100 : 365} Days`, 
                    progress: Math.min(100, (userStats.totalActiveDays / (userStats.totalActiveDays < 7 ? 7 : userStats.totalActiveDays < 30 ? 30 : userStats.totalActiveDays < 100 ? 100 : 365)) * 100), 
                    unlocked: userStats.totalActiveDays > 0,
                    desktopOnly: false,
                    mobileOnly: false
                  },
                  { 
                    label: "Quran Read", 
                    value: `${((userStats.uniqueAyahsRead / QURAN_STATS.totalAyahs) * 100).toFixed(1)}%`, 
                    displayValue: `${((userStats.uniqueAyahsRead / QURAN_STATS.totalAyahs) * 100).toFixed(1)}%`, 
                    progress: Math.min(100, (userStats.uniqueAyahsRead / QURAN_STATS.totalAyahs) * 100), 
                    unlocked: userStats.uniqueAyahsRead > 0,
                    desktopOnly: false,
                    mobileOnly: false
                  },
                  { 
                    label: "Surahs", 
                    value: `${totalSurahsStarted}`, 
                    displayValue: `${totalSurahsStarted} / 114 Surahs`, 
                    progress: Math.min(100, (totalSurahsStarted / 114) * 100), 
                    unlocked: totalSurahsStarted > 0,
                    desktopOnly: false,
                    mobileOnly: false
                  },
                  { 
                    label: "Total Ayahs", 
                    value: `${totalAyahsRead}`, 
                    displayValue: `${totalAyahsRead} / 6,236 Ayahs`, 
                    progress: Math.min(100, (totalAyahsRead / 6236) * 100), 
                    unlocked: totalAyahsRead > 0,
                    desktopOnly: false,
                    mobileOnly: false
                  },
                ].map((achievement, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "p-0 md:p-6 rounded-none md:rounded-2xl border-none md:border flex flex-col justify-center gap-2 md:gap-3 transition-all duration-300",
                      achievement.label === "Active Days" ? "hidden md:flex" : "",
                      achievement.unlocked 
                        ? "md:bg-white/[0.04] md:border-white/10 md:hover:bg-white/[0.08] md:hover:border-white/20 md:hover:-translate-y-1 md:shadow-lg" 
                        : "md:bg-black/20 md:border-transparent opacity-70 md:opacity-40 md:grayscale"
                    )}
                  >
                    {/* Desktop Circle View */}
                    <div className={cn(
                      "hidden md:flex w-14 h-14 rounded-full items-center justify-center text-lg font-bold shadow-inner mx-auto",
                      achievement.unlocked ? "bg-primary/20 text-primary border border-primary/20" : "bg-white/5 text-white/40"
                    )}>
                      {achievement.value}
                    </div>
                    <span className="hidden md:block text-sm font-bold text-foreground tracking-wide text-center">{achievement.label}</span>

                    {/* Mobile Minimal Layout with Progressive Bar */}
                    <div className="md:hidden flex flex-col gap-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground tracking-wide">{achievement.label}</span>
                        <span className="text-xs font-semibold text-primary">{achievement.displayValue}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500" 
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

