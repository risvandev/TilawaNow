"use client";

import { Button } from "@/components/ui/button";
import { Github, Code2, Heart } from "lucide-react";
import Link from "next/link";

export const OpenSourceSection = () => {
  return (
    <section className="py-20 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-12 md:gap-20">
          
          {/* Left Side: Title & Buttons */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-premium-accent/10 to-primary/5 border border-premium-accent/20 text-premium-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-8 shadow-[0_0_15px_rgba(20,184,166,0.15)] backdrop-blur-md animate-fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              <Code2 className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">AGPL v3 LICENSED</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 tracking-tight leading-[1.1]">
              Built by the Community, <br className="hidden lg:block" />
              <span className="text-premium-accent">For the Ummah</span>
            </h2>
            
            <div className="flex flex-col gap-6 mt-10 w-full max-w-xl mx-auto md:mx-0 text-left">
              {/* Donate Button Block */}
              <div className="flex flex-col gap-2.5 items-center md:items-start">
                <p className="text-sm text-muted-foreground/90 font-medium text-center md:text-left">
                  Your donation helps me dedicate more time to improving TilawaNow and adding exciting new features.
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto px-8 bg-[#F96854] hover:bg-[#e05d4b] text-white border-none rounded-full shadow-lg shadow-[#F96854]/20 group transition-all duration-300">
                  <Link href="/donate">
                    <Heart className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:fill-white transition-all duration-300" />
                    <span className="font-semibold">Donate Now</span>
                  </Link>
                </Button>
              </div>

              {/* GitHub Star Button Block */}
              <div className="flex flex-col gap-2.5 items-center md:items-start">
                <p className="text-sm text-muted-foreground/90 font-medium text-center md:text-left">
                  Can't donate? Give us a star on GitHub to help others discover TilawaNow.
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto px-8 bg-[#24292F] hover:bg-[#1b1f23] text-white border-none rounded-full shadow-lg group transition-all duration-300">
                  <Link href="https://github.com/risvandev/TilawaNow" target="_blank">
                    <Github className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 group-hover:rotate-6 transition-all duration-300" />
                    <span className="font-semibold">Star on GitHub</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side: Micro Text & Features */}
          <div className="flex-1 md:max-w-[420px] w-full border-t md:border-t-0 md:border-l border-border/40 pt-10 md:pt-4 md:pl-16 flex flex-col justify-center">
            <p className="text-sm md:text-[13px] text-muted-foreground/80 leading-relaxed font-medium mb-10 text-center md:text-left tracking-wide">
              TilawaNow is 100% open-source and transparent. We believe the tools for reading and understanding the <span className="text-foreground font-semibold">Holy Qur'an</span> should be accessible to everyone, everywhere. No ads, no tracking.
            </p>
            
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 opacity-80">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-lg md:text-xl font-bold text-foreground">Open</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Source</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-lg md:text-xl font-bold text-foreground">Free</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Forever</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-lg md:text-xl font-bold text-foreground">No Ads</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Guaranteed</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-lg md:text-xl font-bold text-foreground">Secure</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Privacy-First</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
    </section>
  );
};
