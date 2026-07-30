"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  active_days: number;
  current_streak: number;
  total_ayahs_read: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [user?.id]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Use secure RPC function — only returns leaderboard-safe fields
      const { data, error } = await supabase.rpc("get_leaderboard");

      if (error) throw error;

      const merged: LeaderboardEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name || "Anonymous Reader",
        active_days: row.active_days || 0,
        current_streak: row.current_streak || 0,
        total_ayahs_read: row.total_ayahs_read || 0,
      }));

      setLeaders(merged);

      // Find user's rank
      if (user) {
        const rank = merged.findIndex((l) => l.id === user.id);
        setMyRank(rank >= 0 ? rank + 1 : null);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-primary font-black";
    if (rank === 2) return "text-primary/80 font-extrabold";
    if (rank === 3) return "text-primary/60 font-bold";
    return "text-muted-foreground/60 font-medium";
  };

  const getRankBadge = (rank: number) => {
    return `#${rank}`;
  };

  return (
    <div className="relative min-h-screen bg-background overflow-x-clip font-sans">
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[140px] pointer-events-none opacity-50 mix-blend-screen" />

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-4 md:py-12 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in-up mt-2">
          <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-secondary/30 border border-white/10 shrink-0">
            <Link href="/dashboard">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-0.5">Community</p>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Leaderboard</h1>
          </div>
        </div>

        {/* My Position Card */}
        {user && myRank && (
          <div className="animate-fade-in-up bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-[2rem] p-5 mb-6 relative overflow-hidden" style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Your Rank</p>
                <p className={cn("text-3xl tracking-tighter", getRankStyle(myRank))}>
                  {getRankBadge(myRank)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-foreground tracking-tighter">
                  {leaders.find(l => l.id === user.id)?.active_days || 0}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">active days</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-bold text-foreground mb-2">No data yet</p>
              <p className="text-sm text-muted-foreground">Start reading to appear on the leaderboard!</p>
            </div>
          ) : (
            leaders.map((entry, index) => {
              const rank = index + 1;
              const isMe = user?.id === entry.id;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-4 py-4 border-b border-white/5 last:border-none transition-all",
                    isMe && "bg-primary/5 -mx-4 px-4 rounded-2xl border-none"
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    "w-10 text-center shrink-0 font-extrabold tracking-tighter",
                    isTop3 ? "text-xl" : "text-sm",
                    getRankStyle(rank)
                  )}>
                    {getRankBadge(rank)}
                  </div>

                  {/* Avatar Initial (Removed) */}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-bold text-sm truncate",
                      isMe ? "text-primary" : "text-foreground"
                    )}>
                      {entry.full_name}
                      {isMe && <span className="text-xs font-medium text-primary/70 ml-1">(You)</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {entry.total_ayahs_read.toLocaleString()} ayahs
                      </span>
                      {entry.current_streak > 0 && (
                        <span className="text-[11px] text-primary/80 font-semibold flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> {entry.current_streak}d streak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Days */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-foreground tracking-tighter leading-none">
                      {entry.active_days}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">days</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Verse */}
        <div className="text-center py-12 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>
          <p className="font-arabic text-xl leading-loose text-foreground/80 mb-3">
            فَاسْتَبِقُوا الْخَيْرَاتِ
          </p>
          <p className="text-xs text-muted-foreground/70 italic font-medium">
            "So race to all that is good" — Al-Baqarah 2:148
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
