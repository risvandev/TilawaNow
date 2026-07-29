
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        let mounted = true;

        // Listen for all auth state changes (including INITIAL_SESSION)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        // Backup check in case the listener is delayed
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setSession((currentSession) => {
                    // Only apply the getSession result if we haven't already received a valid session from the listener
                    if (!currentSession && session) {
                        setUser(session.user);
                        return session;
                    }
                    return currentSession;
                });
                // If there is an OAuth redirect in progress, wait for onAuthStateChange to handle it
                const isOAuthRedirect = typeof window !== 'undefined' && 
                    (window.location.search.includes('code=') || 
                     window.location.hash.includes('access_token=') ||
                     window.location.hash.includes('error_description='));

                if (!isOAuthRedirect) {
                    setLoading(false);
                }
            }
        }).catch(err => {
            console.error("Auth session fetch error:", err);
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const signInWithGoogle = async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('MISSING')) {
            toast({
                variant: "destructive",
                title: "Configuration Missing",
                description: "Supabase URL is not configured. Please check your .env file and restart the server.",
            });
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/home`,
            },
        });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, signInWithGoogle }}>
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 animate-in fade-in duration-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-xl font-bold text-foreground tracking-tight">TilawaNow</span>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
