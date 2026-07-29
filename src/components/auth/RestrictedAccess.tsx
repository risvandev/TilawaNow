"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface RestrictedAccessProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const RestrictedAccess = ({ title, description, icon: Icon }: RestrictedAccessProps) => {
  useEffect(() => {
    // Disable scroll when restricted UI is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    // Prevent scrolling on touch devices
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow || "auto";
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[40] bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      {/* Ambient background glow - very subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-primary/[0.03] rounded-full blur-[120px] -z-10" />

      <div className="max-w-xs w-full flex flex-col items-center animate-fade-in-up duration-700">
        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-10 transition-transform duration-500 hover:scale-110">
          <Icon className="w-6 h-6 text-primary/60" />
        </div>

        <h1 className="text-3xl font-extrabold text-foreground mb-4 tracking-tighter leading-none">
          {title}
        </h1>
        
        <p className="text-muted-foreground/50 mb-12 text-sm font-medium leading-relaxed max-w-[220px]">
          {description}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[200px]">
          <Button asChild variant="hero" className="w-full h-12 rounded-2xl shadow-xl shadow-primary/10 font-bold text-sm tracking-tight">
            <Link href="/account">Account</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full h-12 rounded-2xl text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all font-bold text-sm tracking-tight">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
        
        <p className="mt-20 text-[10px] text-muted-foreground/30 tracking-[0.3em] uppercase font-black">
          TilawaNow
        </p>
      </div>
    </div>
  );
};
