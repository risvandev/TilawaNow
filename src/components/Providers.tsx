"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { KhatmahProvider } from "@/contexts/KhatmahContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { ReadingTrackerProvider } from "@/contexts/ReadingTrackerContext";
import { SidebarProvider } from "@/components/layout/AppSidebar";
import GlobalAudioPlayer from "@/components/GlobalAudioPlayer";
import { GlobalPrefetch } from "@/components/GlobalPrefetch";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PWAProvider } from "@/contexts/PWAContext";
import { AICompanionProvider } from "@/contexts/AICompanionContext";
import { useEffect, useState } from "react";
import NextTopLoader from 'nextjs-toploader';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Restore settings
    const savedFont = localStorage.getItem("quranFont");
    if (savedFont) {
      document.documentElement.style.setProperty("--font-quran", savedFont);
    }
    const savedNightMode = localStorage.getItem("nightMode") === "true";
    if (savedNightMode) {
      document.body.classList.add("night-mode");
    }

    // Register Service Worker for PWA (production only)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    } else if ("serviceWorker" in navigator && process.env.NODE_ENV === "development") {
      // Unregister any leftover SW from dev testing to prevent issues
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
  }, []);

  return (
    <>
      <NextTopLoader 
        color="hsl(var(--primary))"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
      />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <PWAProvider>
            <TooltipProvider>
              <AuthProvider>
                <BookmarksProvider>
                  <ReadingTrackerProvider>
                    <AICompanionProvider>
                      <AudioPlayerProvider>
                        <KhatmahProvider>
                          <SidebarProvider>
                            <div className="relative flex flex-col min-h-screen">
                              {children}
                            </div>
                          </SidebarProvider>
                          <GlobalAudioPlayer />
                          <GlobalPrefetch />
                        </KhatmahProvider>

                      </AudioPlayerProvider>
                    </AICompanionProvider>
                  </ReadingTrackerProvider>
                </BookmarksProvider>
              </AuthProvider>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </PWAProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}
