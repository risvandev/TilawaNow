import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { usePWA } from "@/contexts/PWAContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Share, PlusSquare, ArrowUpCircle } from "lucide-react";

export const AppDownloadSection = () => {
    const { install, isInstallable, isInstalled } = usePWA();
    const [showInstructions, setShowInstructions] = useState(false);
    const [showAppInfo, setShowAppInfo] = useState(false);

    const handleInstallClick = () => {
        if (isInstallable) {
            install();
        } else if (!isInstalled) {
            setShowInstructions(true);
        }
    };

    return (
        <section className="py-12 md:py-16 relative overflow-hidden flex justify-center">
            <div className="container px-6 relative z-10 max-w-4xl">
                <div className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-card/90 to-background/60 border border-white/10 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden group">

                    {/* Decorative glows inside card */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-premium-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-premium-accent/20 transition-colors duration-700 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-8 md:gap-12">

                        <div className="flex flex-col flex-1 text-left">
                            <div className="flex flex-row items-center gap-4 md:gap-8">
                                <div className="flex-none flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-premium-accent/20 to-primary/10 border border-premium-accent/30 shadow-[inset_0_1px_10px_rgba(255,255,255,0.05)]">
                                    <Download className="w-5 h-5 md:w-7 md:h-7 text-premium-accent" />
                                </div>

                                <h2 className="text-xl md:text-3xl font-bold text-foreground tracking-tight">
                                    Take the <span className="text-premium-accent">Quran</span> Anywhere
                                </h2>
                            </div>

                            <div className="mt-3 md:mt-2 md:ml-24">
                                <p className="text-[13px] md:text-base text-muted-foreground leading-relaxed max-w-md">
                                    Experience TilawaNow natively on your device. Enjoy seamless reading and background audio wherever you go.
                                </p>
                            </div>
                        </div>

                        <div className="flex-none flex flex-col items-center">
                            <Button
                                size="lg"
                                className="h-12 px-8 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all font-semibold group-hover:scale-105 duration-300"
                                onClick={handleInstallClick}
                                disabled={isInstalled}
                            >
                                {isInstalled ? "App Installed" : "Install App"}
                            </Button>
                            <button
                                onClick={() => setShowAppInfo(true)}
                                className="text-[10px] text-muted-foreground hover:text-premium-accent mt-4 font-semibold tracking-widest uppercase flex items-center transition-all border-b border-transparent hover:border-premium-accent pb-0.5"
                            >
                                Learn More →
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Installation Instructions Dialog */}
            <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                <DialogContent className="w-[92vw] sm:w-full max-w-md bg-card border-border shadow-2xl rounded-3xl p-5 md:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">How to Install</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-lg mt-2">
                            If the download doesn't start automatically, follow these steps to add TilawaNow to your home screen:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary">
                                <Share className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">1. Tap Share</p>
                                <p className="text-sm text-muted-foreground">Look for the share icon in your browser's menu or toolbar.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary">
                                <PlusSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">2. Add to Home Screen</p>
                                <p className="text-sm text-muted-foreground">Scroll down and tap 'Add to Home Screen'.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary">
                                <ArrowUpCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">3. TilawaNow Ready</p>
                                <p className="text-sm text-muted-foreground">The app will now be available on your home screen for a premium experience.</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setShowInstructions(false)} className="w-full h-12 text-lg rounded-full">
                        Got it
                    </Button>
                </DialogContent>
            </Dialog>

            <Dialog open={showAppInfo} onOpenChange={setShowAppInfo}>
                <DialogContent className="w-[92vw] sm:w-full max-w-md bg-card/95 backdrop-blur-2xl border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)] rounded-3xl p-0 flex flex-col overflow-hidden">
                    <div 
                        className="p-5 sm:p-6 md:p-8 overflow-y-auto overscroll-none max-h-[85vh]"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        <DialogHeader className="text-left mb-4 flex-shrink-0">
                            <DialogTitle className="text-2xl font-bold text-foreground">About the App</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                TilawaNow is a <strong>Progressive Web App (PWA)</strong>. Instead of downloading a massive file from an App Store, you can install it directly to your device right here. It runs seamlessly through your browser's engine, giving you a native app experience while saving your storage space.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4 flex-shrink-0">
                            <div>
                                <h4 className="font-semibold text-foreground mb-1.5 text-sm tracking-wide uppercase">iOS Support</h4>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    Apple requires a manual setup for web apps. To install:<br />
                                    1) Open this website in Safari.<br />
                                    2) Tap the Share icon at the bottom of the screen.<br />
                                    3) Scroll down and tap "Add to Home Screen".<br />
                                    Note: Due to Apple's system restrictions, background audio and offline features may not work as perfectly on iOS as they do on Android.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-foreground mb-1.5 text-sm tracking-wide uppercase">Android & Windows Support</h4>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    Android & Windows Installation Fully supported natively with <strong>PWA</strong>. Simply tap the Install App button on this page using Chrome or Edge, and it will be added to your device instantly.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-premium-accent mb-1.5 text-sm tracking-wide uppercase">App Updates & Troubleshooting</h4>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    <strong>How App Updates Work:</strong> <br />Because this app runs through your browser, updates are usually automatic. However, if you are not seeing the latest features or experience glitches, <strong>simply delete the app from your home screen and reinstall </strong>it from the website to force a fresh update.
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
};
