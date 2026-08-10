"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { MainLayout } from "@/components/layout/AppSidebar";
import FocusMode from "@/components/player/FocusMode";


export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const pagesWithoutSidebar = ["/", "/privacy", "/terms", "/account", "/forgot-password", "/reset-password", "/donate"];

  let showSidebar = !pagesWithoutSidebar.includes(pathname);

  // Hide sidebar on About page for guests
  if (pathname === "/about" && !user) {
    showSidebar = false;
  }

  // Hide entirely if it starts with read/explained or info, if you don't want sidebar there
  if (pathname?.startsWith("/info/") || pathname?.startsWith("/explained/")) {
    showSidebar = false;
  }

  const { isFullPlayerOpen, isFocusMode } = useAudioPlayer();
  const showSidebarFinal = showSidebar && !isFocusMode;

  return (
    <MainLayout showSidebar={showSidebarFinal}>
      <div className={(isFullPlayerOpen || isFocusMode) ? "hidden" : "contents"}>
        {children}
      </div>
      <FocusMode />
    </MainLayout>
  );
}


