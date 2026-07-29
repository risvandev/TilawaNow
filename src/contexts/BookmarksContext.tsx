import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ReadingHistory {
    surah_id: number;
    verse_key: string | null;
    last_read_at: string;
}

interface Mark {
    id: string;
    surah_id: number;
    ayah_id: number | null;
    type: 'ayah' | 'surah';
    created_at: string;
}

interface BookmarksContextType {
    readingHistory: ReadingHistory[];
    marks: Mark[];
    userStats: { totalAyahsRead: number; uniqueAyahsRead: number; currentStreak: number; lastActiveDate: string | null; totalActiveDays: number };
    dailyActivity: { date: string, count: number }[];
    isLoading: boolean;
    updateReadingHistory: (surahId: number, verseKey: string) => Promise<void>;
    toggleMark: (surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => Promise<void>;
    isMarked: (surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Stats State
    const [userStats, setUserStats] = useState({
        totalAyahsRead: 0,
        uniqueAyahsRead: 0,
        currentStreak: 0,
        lastActiveDate: null as string | null,
        totalActiveDays: 0
    });

    // Activity Data for Chart
    const [dailyActivity, setDailyActivity] = useState<{ date: string, count: number }[]>([]);

    // Buffering system to minimize Supabase calls
    const BATCH_INTERVAL = 60000; // 60 seconds
    const pendingStatsRef = useRef({
        totalNewRead: 0,
        uniqueVerses: new Set<string>(),
        lastSurahId: null as number | null,
        lastVerseKey: null as string | null,
        hasChanges: false
    });

    const pendingMarksSyncRef = useRef<Map<string, { 
        timer: NodeJS.Timeout; 
        type: 'add' | 'remove';
        tempId?: string;
        existingId?: string;
        originalMark?: Mark;
    }>>(new Map());

    // Fetch data on mount or user change
    useEffect(() => {
        if (user) {
            fetchUserData();
        } else {
            setReadingHistory([]);
            setMarks([]);
            setDailyActivity([]);
            setUserStats({ totalAyahsRead: 0, uniqueAyahsRead: 0, currentStreak: 0, lastActiveDate: null, totalActiveDays: 0 });
        }
    }, [user]);

    const clearCache = useCallback(() => {
        if (user) sessionStorage.removeItem(`user_data_${user.id}`);
    }, [user]);

    const fetchUserData = async () => {
        setIsLoading(true);
        const cacheKey = `user_data_${user!.id}`;
        
        try {
            // Check session cache first to prevent redundant network requests
            const cachedDataStr = sessionStorage.getItem(cacheKey);
            if (cachedDataStr) {
                const cachedData = JSON.parse(cachedDataStr);
                setReadingHistory(cachedData.readingHistory);
                setUserStats(cachedData.userStats);
                setDailyActivity(cachedData.dailyActivity);
                setMarks(cachedData.marks);
                setIsLoading(false);
                return;
            }

            // Fetch History
            const { data: historyData, error: historyError } = await supabase
                .from('reading_history')
                .select('surah_id, verse_key, last_read_at')
                .eq('user_id', user!.id)
                .order('last_read_at', { ascending: false });

            if (historyError) throw historyError;

            // Fetch User Stats & Goal
            let newUserStats = {
                totalAyahsRead: 0,
                uniqueAyahsRead: 0,
                currentStreak: 0,
                lastActiveDate: null as string | null,
                totalActiveDays: 0
            };

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('total_ayahs_read, unique_ayahs_read, current_streak, last_active_date')
                .eq('id', user!.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error("Error fetching stats:", profileError);
            }

            if (profileData) {
                newUserStats = {
                    ...newUserStats,
                    totalAyahsRead: profileData.total_ayahs_read || 0,
                    uniqueAyahsRead: profileData.unique_ayahs_read || 0,
                    currentStreak: profileData.current_streak || 0,
                    lastActiveDate: profileData.last_active_date,
                };
            }

            // Fetch Daily Activity (Last 14 Days) for Chart
            const { data: activityData } = await supabase
                .from('daily_activity')
                .select('date, ayahs_count')
                .eq('user_id', user!.id)
                .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // Last 14 days
                .order('date', { ascending: true });

            let formattedActivity: {date: string, count: number}[] = [];
            if (activityData) {
                formattedActivity = activityData.map(d => ({ date: d.date, count: d.ayahs_count }));
            }

            // Fetch Total Active Days Count
            const { count: activeCount, error: countError } = await supabase
                .from('daily_activity')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user!.id);

            if (!countError && activeCount !== null) {
                newUserStats.totalActiveDays = activeCount;
            }

            // Fetch Marks
            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select('id, surah_id, ayah_id, type, created_at')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (marksError) throw marksError;

            // Update States
            setReadingHistory(historyData || []);
            setUserStats(newUserStats);
            setDailyActivity(formattedActivity);
            setMarks(marksData || []);

            // Save to Session Cache
            sessionStorage.setItem(cacheKey, JSON.stringify({
                readingHistory: historyData || [],
                userStats: newUserStats,
                dailyActivity: formattedActivity,
                marks: marksData || []
            }));

        } catch (error: any) {
            const isFetchErr = error?.message === 'Failed to fetch' || (typeof error === 'string' && error.includes('Failed to fetch'));
            if (isFetchErr) {
                console.warn('Bookmarks: Network connection or Supabase unreachable.');
            } else {
                console.error('Error fetching user data:', error?.message || error);
            }
        } finally {
            setIsLoading(false);
        }
    };


    // To properly fix, we need to implement the function using functional updates only or Refs.
    // Let's try to just Memoize the value, but if updateReadingHistory changes, value changes.

    // START REPLACEMENT
    const userStatsRef = React.useRef(userStats);
    const dailyActivityRef = React.useRef(dailyActivity);

    useEffect(() => { userStatsRef.current = userStats; }, [userStats]);
    useEffect(() => { dailyActivityRef.current = dailyActivity; }, [dailyActivity]);

    // Robust Flush Logic: Syncs accumulated local progress to Supabase in a single batch
    const flushToSupabase = useCallback(async () => {
        const stats = pendingStatsRef.current;
        if (!user || !stats.hasChanges) return;

        // Reset buffer immediately to prevent overlapping flushes
        const totalToSync = stats.totalNewRead;
        const uniqueList = Array.from(stats.uniqueVerses);
        const lastSurah = stats.lastSurahId;
        const lastKey = stats.lastVerseKey;
        
        pendingStatsRef.current = {
            totalNewRead: 0,
            uniqueVerses: new Set<string>(),
            lastSurahId: null,
            lastVerseKey: null,
            hasChanges: false
        };

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Update Detailed History (Always Upsert latest for each surah)
            if (lastSurah && lastKey) {
                await supabase.from('reading_history').upsert(
                    { user_id: user.id, surah_id: lastSurah, verse_key: lastKey, last_read_at: new Date().toISOString() },
                    { onConflict: 'user_id, surah_id' }
                );
            }

            // 2. Track Unique Verses Read & Read Counts
            let newUniqueCount = 0;
            if (uniqueList.length > 0) {
                // Fetch existing records for the verses we are syncing
                const { data: existingVerses } = await supabase
                    .from('verses_read')
                    .select('verse_key, read_count')
                    .eq('user_id', user.id)
                    .in('verse_key', uniqueList);
                
                const existingMap = new Map(existingVerses?.map(v => [v.verse_key, v.read_count]) || []);
                
                const upsertData = uniqueList.map(vKey => {
                    const currentCount = existingMap.get(vKey) || 0;
                    if (currentCount === 0) newUniqueCount++;
                    return {
                        user_id: user.id,
                        verse_key: vKey,
                        read_count: currentCount + 1
                    };
                });

                await supabase.from('verses_read').upsert(upsertData, { onConflict: 'user_id, verse_key' });
            }

            // 3. Update Daily Activity (Add the newly read count to the total for today)
            const { data: currentDay } = await supabase
                .from('daily_activity')
                .select('ayahs_count')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();

            const existingCount = currentDay?.ayahs_count || 0;
            await supabase.from('daily_activity').upsert({
                user_id: user.id,
                date: today,
                ayahs_count: existingCount + totalToSync
            }, { onConflict: 'user_id, date' });

            // 4. Update Main Profile Stats
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_ayahs_read, unique_ayahs_read, current_streak, last_active_date')
                .eq('id', user.id)
                .single();

            if (profile) {
                const lastActive = profile.last_active_date ? new Date(profile.last_active_date).toDateString() : null;
                const todayDate = new Date().toDateString();
                
                let newStreak = profile.current_streak || 0;
                if (lastActive !== todayDate) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    newStreak = (lastActive === yesterday.toDateString()) ? (newStreak + 1) : 1;
                }

                await supabase.from('profiles').update({
                    total_ayahs_read: (profile.total_ayahs_read || 0) + totalToSync,
                    unique_ayahs_read: (profile.unique_ayahs_read || 0) + newUniqueCount,
                    current_streak: newStreak,
                    last_active_date: new Date().toISOString()
                }).eq('id', user.id);
                clearCache();
            }
        } catch (error: any) {
            // Silence expected 401/403 or network errors to keep console clean
            const isAuthOrNetworkError =
              error?.status === 401 ||
              error?.status === 403 ||
              error?.code === "42501" ||
              error?.message?.includes("fetch") ||
              error?.message?.includes("CORS") ||
              error?.message?.includes("Unauthorized");

            if (!isAuthOrNetworkError) {
              console.error('Bookmarks: Critical Background Sync Error', error);
            }
        }
    }, [user]);

    // Periodic Background Sync
    useEffect(() => {
        const interval = setInterval(flushToSupabase, BATCH_INTERVAL);
        return () => {
            clearInterval(interval);
            // Final attempt to flush on unmount/close
            if (pendingStatsRef.current.hasChanges) flushToSupabase();
            
            // Clean up any pending mark sync timeouts
            if (pendingMarksSyncRef.current) {
                pendingMarksSyncRef.current.forEach(item => {
                    clearTimeout(item.timer);
                });
            }
        };
    }, [flushToSupabase]);

    // Fast, Local-First progress tracking
    const updateReadingHistoryStable = useCallback(async (surahId: number, verseKey: string) => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];

        // --- PHASE 1: Instant Local UI Updates ---
        
        // 1. Update History List
        setReadingHistory(prev => {
            const filtered = prev.filter(h => h.surah_id !== surahId);
            return [{ surah_id: surahId, verse_key: verseKey, last_read_at: new Date().toISOString() }, ...filtered];
        });

        // 2. Update Stats (Optimistic Local Logic)
        setUserStats(prev => {
            const lastActive = prev.lastActiveDate ? new Date(prev.lastActiveDate).toDateString() : null;
            const todayDate = new Date().toDateString();
            let newStreak = prev.currentStreak;
            if (lastActive !== todayDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                newStreak = (lastActive === yesterday.toDateString()) ? (newStreak + 1) : 1;
            }

            return {
                ...prev,
                totalAyahsRead: prev.totalAyahsRead + 1,
                currentStreak: newStreak,
                lastActiveDate: new Date().toISOString(),
                totalActiveDays: (lastActive === todayDate) ? prev.totalActiveDays : (prev.totalActiveDays + 1)
            };
        });

        // 3. Update Chart Activity
        setDailyActivity(prev => {
            const existingToday = prev.find(d => d.date === today);
            const others = prev.filter(d => d.date !== today);
            return [...others, { date: today, count: (existingToday?.count || 0) + 1 }].sort((a, b) => a.date.localeCompare(b.date));
        });

        // --- PHASE 2: Silent Background Buffering ---
        pendingStatsRef.current.totalNewRead += 1;
        pendingStatsRef.current.uniqueVerses.add(verseKey);
        pendingStatsRef.current.lastSurahId = surahId;
        pendingStatsRef.current.lastVerseKey = verseKey;
        pendingStatsRef.current.hasChanges = true;

    }, [user]);

    const toggleMark = useCallback(async (surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => {
        if (!user) {
            toast({ title: "Sign in required", description: "Please sign in to mark items." });
            return;
        }

        const key = `${type}:${surahId}:${ayahId}`;
        const existingMark = marks.find(m => 
            m.surah_id === surahId && 
            m.ayah_id === ayahId && 
            m.type === type
        );

        // Cancel any pending timer for this mark
        const pending = pendingMarksSyncRef.current.get(key);
        if (pending) {
            clearTimeout(pending.timer);
            pendingMarksSyncRef.current.delete(key);

            // Revert state back to original local UI representation
            if (pending.type === 'add') {
                // Was not in DB, we scheduled add, now we remove it locally
                setMarks(prev => prev.filter(m => m.id !== pending.tempId));
            } else {
                // Was in DB, we scheduled remove, now we put it back locally
                if (pending.originalMark) {
                    setMarks(prev => [pending.originalMark!, ...prev]);
                }
            }
            return;
        }

        if (existingMark) {
            // Remove mark (Optimistic)
            setMarks(prev => prev.filter(m => m.id !== existingMark.id));
            
            // Set 2-second debounce for deleting from DB
            const timer = setTimeout(async () => {
                pendingMarksSyncRef.current.delete(key);
                try {
                    const { error } = await supabase
                        .from('marks')
                        .delete()
                        .eq('id', existingMark.id);
                    if (error) throw error;
                    clearCache();
                } catch (error) {
                    console.error('Error removing mark:', error);
                    // Revert state
                    setMarks(prev => [existingMark, ...prev]);
                    toast({ variant: "destructive", title: "Error", description: "Failed to remove mark." });
                }
            }, 2000);

            pendingMarksSyncRef.current.set(key, {
                timer,
                type: 'remove',
                existingId: existingMark.id,
                originalMark: existingMark
            });
        } else {
            // Add mark (Optimistic)
            
            // Check for exclusivity conflicts
            let markToReplace: Mark | undefined;
            if (type === 'surah') {
                markToReplace = marks.find(m => m.type === 'surah');
            } else if (type === 'ayah') {
                markToReplace = marks.find(m => m.type === 'ayah' && m.surah_id === surahId);
            }

            const tempId = Math.random().toString();
            const newMark: Mark = {
                id: tempId,
                surah_id: surahId,
                ayah_id: ayahId,
                type,
                created_at: new Date().toISOString()
            };

            // Update local state by removing collision and adding new
            setMarks(prev => {
                let filtered = prev;
                if (markToReplace) {
                    filtered = filtered.filter(m => m.id !== markToReplace!.id);
                }
                return [newMark, ...filtered];
            });

            // Set 2-second debounce for writing to DB
            const timer = setTimeout(async () => {
                pendingMarksSyncRef.current.delete(key);
                try {
                    // DB Cleanup for collisions
                    if (type === 'surah') {
                        await supabase.from('marks').delete().eq('user_id', user.id).eq('type', 'surah');
                    } else if (type === 'ayah') {
                        await supabase.from('marks').delete().eq('user_id', user.id).eq('type', 'ayah').eq('surah_id', surahId);
                    }

                    // DB Insert
                    const { data, error } = await supabase
                        .from('marks')
                        .insert({ 
                            user_id: user.id, 
                            surah_id: surahId, 
                            ayah_id: ayahId, 
                            type 
                        })
                        .select()
                        .single();
                        
                    if (error) throw error;
                    
                    // Replace temp with real
                    setMarks(prev => prev.map(m => m.id === tempId ? data : m));
                    clearCache();
                } catch (error: any) {
                    console.error('Final Mark Update Error:', error);
                    fetchUserData(); // Re-sync with DB on failure
                    toast({ 
                        variant: "destructive", 
                        title: "Error", 
                        description: error.message || "Failed to update marks." 
                    });
                }
            }, 2000);

            pendingMarksSyncRef.current.set(key, {
                timer,
                type: 'add',
                tempId
            });
        }
    }, [user, marks, toast, clearCache]);

    const isMarked = useCallback((surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => {
        return marks.some(m => 
            m.surah_id === surahId && 
            m.ayah_id === ayahId && 
            m.type === type
        );
    }, [marks]);

    const value = React.useMemo(() => ({
        readingHistory,
        marks,
        userStats,
        dailyActivity,
        isLoading,
        updateReadingHistory: updateReadingHistoryStable,
        toggleMark,
        isMarked
    }), [readingHistory, marks, userStats, dailyActivity, isLoading, updateReadingHistoryStable, toggleMark, isMarked]);

    return (
        <BookmarksContext.Provider value={value}>
            {children}
        </BookmarksContext.Provider>
    );
};

export const useBookmarks = () => {
    const context = useContext(BookmarksContext);
    if (context === undefined) {
        throw new Error('useBookmarks must be used within a BookmarksProvider');
    }
    return context;
};
