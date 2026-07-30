"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
    const navigate = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Optional: Check if we have a session (hash fragment from email link)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
            if (event === "PASSWORD_RECOVERY") {
                // Determine if we need to do anything specific
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Passwords do not match",
                description: "Please make sure both passwords are the same.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Update failed",
                    description: error.message,
                });
            } else {
                toast({
                    title: "Password updated",
                    description: "You can now sign in with your new password.",
                });
                navigate.push("/home");
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-x-clip">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                <div className="glass-card p-8 md:p-10 border border-white/5 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <KeyRound className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Set New Password</h1>
                        <p className="text-muted-foreground">Enter your new password below</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 h-11 bg-secondary/50 border-white/10 focus:bg-background/80 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11 bg-secondary/50 border-white/10 focus:bg-background/80 transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
