"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import Link from "next/link";


const Login = () => {
    const navigate = useRouter();
    const { toast } = useToast();
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [email, setEmail] = useState("");

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Google Sign-In failed",
                description: "Could not connect to Google. Please try again.",
            });
            setIsLoading(false);
        }
    };

    const handleMagicLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Login failed",
                    description: typeof error.message === 'string' ? error.message : JSON.stringify(error.message),
                });
            } else {
                setEmailSent(true);
            }
        } catch (error: any) {
            const errMessage = error?.message ? (typeof error.message === 'string' ? error.message : JSON.stringify(error.message)) : "An unexpected error occurred.";
            toast({
                variant: "destructive",
                title: "Error",
                description: errMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-sans">
            {/* Ambient Mac-like Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px] pointer-events-none opacity-60 mix-blend-screen z-0" />
            <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-premium-accent/10 blur-[140px] pointer-events-none opacity-50 mix-blend-screen z-0" />
            <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-white/5 blur-[120px] pointer-events-none mix-blend-screen z-0" />

            {/* Back Button */}
            <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all group backdrop-blur-md shadow-sm"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-semibold tracking-wide">Home</span>
                </Link>
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                {/* Glass Panel */}
                <div className="bg-secondary/40 backdrop-blur-3xl border border-white/[0.08] shadow-2xl shadow-black/40 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group hover:bg-secondary/50 hover:border-white/[0.12] transition-all duration-500">
                    {/* Subtle inner glow orb */}
                    <div className="absolute -top-24 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                    
                    <div className="flex justify-center mb-8 relative z-10">
                        <Logo 
                            iconClassName="w-12 h-12 p-2 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner"
                            textClassName="text-2xl font-bold text-foreground tracking-tight"
                            arabicClassName="hidden"
                        />
                    </div>

                    <div className="text-center mb-8 relative z-10">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2 drop-shadow-sm">
                            {emailSent ? "Check your email" : "Welcome Back"}
                        </h1>
                        <p className="text-muted-foreground/80 text-sm font-medium">
                            {emailSent ? `We've sent a magic link to ${email}` : "Continue your spiritual journey."}
                        </p>
                    </div>

                    <div className="relative z-10">
                        {emailSent ? (
                            <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
                                <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
                                    <CheckCircle2 className="w-10 h-10 text-primary" />
                                </div>
                                <p className="text-center text-muted-foreground leading-relaxed text-sm">
                                    Click the secure link we sent to instantly access your account.
                                </p>
                                <Button 
                                    variant="ghost" 
                                    className="mt-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl"
                                    onClick={() => setEmailSent(false)}
                                >
                                    Use a different email
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleMagicLinkSubmit} className="space-y-5 animate-fade-in">
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within/input:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Email Address"
                                        className="pl-12 h-14 bg-black/20 backdrop-blur-md border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all rounded-xl text-base text-foreground placeholder:text-muted-foreground/50 shadow-inner hover:bg-black/30"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="hero"
                                    className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20 rounded-xl transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                    ) : (
                                        "Continue with Email"
                                    )}
                                </Button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-secondary/40 px-4 text-muted-foreground/70 font-bold tracking-widest rounded-full backdrop-blur-xl border border-white/5">
                                            Or
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-14 bg-white/[0.03] hover:bg-white/[0.08] border-white/10 transition-all rounded-xl gap-3 text-base font-semibold shadow-sm"
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </Button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center px-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <p className="font-arabic text-2xl md:text-3xl text-foreground mb-4 drop-shadow-sm">
                        أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground/90 italic font-medium tracking-wide">
                        "Verily, in the remembrance of Allah do hearts find rest."
                    </p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-premium-accent/80 mt-3">
                        Surah Ar-Ra'd 13:28
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
