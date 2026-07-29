"use client";
import { useState, createContext, useContext, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookOpen,
  Sparkles,
  LayoutDashboard,
  Info,
  Mail,
  Settings,
  HelpCircle,
  Lock,
  LockOpen,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { usePrefetch } from "@/hooks/use-prefetch";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isHovered, setIsHovered }}>
      {children}
    </SidebarContext.Provider>
  );
};

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Read Quran", path: "/read" },
  { icon: Sparkles, label: "AI Chat", path: "/ai" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Info, label: "About", path: "/about" },
  { icon: Mail, label: "Contact", path: "/contact" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const { prefetchRoute } = usePrefetch();
  const { isExpanded, setIsExpanded, isHovered, setIsHovered } = useSidebar();

  const shouldShowExpanded = isExpanded || isHovered;

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = pathname === item.path ||
      (item.path === "/read" && pathname.startsWith("/read"));
    return (
      <Link 
        key={item.path} 
        href={item.path}
        onMouseEnter={() => prefetchRoute(item.path)}
      >
        <Button
          variant={isActive ? "sidebarActive" : "sidebar"}
          size="default"
          className={cn(
            "w-full transition-all duration-300 justify-start h-12 rounded-xl",
            // Button is inside a container with px-3 (12px). 
            // Sidebar center is at 32px. 
            // Button starts at 12px, so icon center should be at 20px from button start.
            // Icon is 20px wide (w-5), so left padding should be 10px (px-2.5)
            "px-2.5" 
          )}
        >
          <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
          <span 
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              shouldShowExpanded ? "max-w-[150px] opacity-100 ml-4" : "max-w-0 opacity-0 ml-0"
            )}
          >
            {item.label}
          </span>
        </Button>
      </Link>
    );
  };

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-[60]",
        "transition-all duration-300 ease-in-out flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide",
        shouldShowExpanded ? "w-56" : "w-16"
      )}
    >
      {/* Header with logo and toggle */}
      <div className="flex items-center justify-between border-b border-sidebar-border min-h-[72px]">
        <Link href="/home" className={cn(
            "flex items-center transition-all duration-300",
            // Logo is 32px, to center in 64px (w-16) sidebar, we use px-4 (16px)
            "px-4" 
        )}>
          <Logo
            showText={shouldShowExpanded}
            textClassName="font-semibold text-foreground ml-4"
            className="gap-0" // Gap is handled by text margin to stay stable
            iconClassName="w-8 h-8 p-1.5 shrink-0"
          />
        </Link>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "text-muted-foreground hover:text-foreground transition-all duration-300 shrink-0",
            shouldShowExpanded ? "opacity-100 pointer-events-auto translate-x-0" : "opacity-0 pointer-events-none -translate-x-2"
          )}
        >
          {isExpanded ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col overflow-y-auto py-3">
        <div className="space-y-2 px-3">
          {navItems.map(renderNavItem)}
        </div>

        <div className="mt-auto pt-4 space-y-2 px-3">
          {bottomNavItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="h-5 flex items-center justify-center">
          <div 
            className={cn(
              "transition-all duration-200 ease-in-out overflow-hidden flex justify-center",
              shouldShowExpanded ? "max-w-[200px] opacity-100" : "max-w-[10px] opacity-0"
            )}
          >
            <p className="text-xs text-muted-foreground text-center animate-fade-in whitespace-nowrap">
              Free Forever • Made with ❤️
            </p>
          </div>
          {!shouldShowExpanded && (
            <div className="w-2 h-2 rounded-full bg-primary animate-scale-in" />
          )}
        </div>
      </div>
    </aside>
  );
};

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const MobileBottomNav = () => {
  const pathname = usePathname();

  const mobileNavItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Read", path: "/read" },
    { icon: Sparkles, label: "AI Chat", path: "/ai" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 pb-[env(safe-area-inset-bottom)] bg-background/80 backdrop-blur-lg border-t border-border z-[100] md:hidden flex items-center justify-around px-1">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.path ||
          (item.path === "/read" && pathname.startsWith("/read"));
        return (
          <Link key={item.path} href={item.path} className="flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-full rounded-none flex flex-col items-center justify-center gap-0.5 hover:bg-transparent py-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive && "fill-current")} />
              <span className="text-[8.5px] font-medium tracking-tight truncate max-w-full px-0.5 leading-tight">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
};

export const MainLayout = ({ children, showSidebar = true }: MainLayoutProps) => {
  const { isExpanded, isHovered } = useSidebar();
  const shouldShowExpanded = isExpanded || isHovered;

  // Audio player is always available since AudioPlayerProvider wraps SidebarProvider
  const { isPlayerVisible } = useAudioPlayer();
  const isPlayerActive = isPlayerVisible;

  if (!showSidebar) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen flex w-full bg-background selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          "ml-0 md:ml-16", // Base mobile: no margin, Base desktop: collapsed margin
          shouldShowExpanded && "md:ml-56", // Expanded desktop margin
          isPlayerActive ? "pb-40 md:pb-0" : "pb-20 md:pb-0", // Extra padding when player active on mobile
          "max-md:!ml-0 max-md:!pl-0 max-md:w-full" // Force reset for mobile
        )}
      >
        {children}
      </main>
    </div>
  );
};

