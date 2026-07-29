"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Headphones, Languages, ChevronRight, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    step: "1",
    title: "Choose a Surah",
    description: "Browse through all 114 surahs or search for a specific one.",
  },
  {
    icon: Headphones,
    step: "2",
    title: "Listen & Read",
    description: "Follow along with beautiful recitation while reading the verses.",
  },
  {
    icon: Languages,
    step: "3",
    title: "Understand",
    description: "Read translations in your preferred language to grasp the meaning.",
  },
];

export const QuickStartSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationId: number;
    let isInteracting = false;
    let exactScrollLeft = container.scrollLeft;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      if (!isInteracting) {
        exactScrollLeft += scrollSpeed;
        
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        if (exactScrollLeft >= maxScrollLeft - 1) {
          exactScrollLeft = 0;
        }
        
        container.scrollLeft = exactScrollLeft;
      } else {
        exactScrollLeft = container.scrollLeft;
      }
      animationId = requestAnimationFrame(animate);
    };

    const handleInteractionStart = () => {
      isInteracting = true;
    };

    const handleInteractionEnd = () => {
      isInteracting = false;
    };

    container.addEventListener("touchstart", handleInteractionStart, { passive: true });
    container.addEventListener("touchend", handleInteractionEnd, { passive: true });
    container.addEventListener("mousedown", handleInteractionStart);
    container.addEventListener("mouseup", handleInteractionEnd);
    container.addEventListener("mouseleave", handleInteractionEnd);

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      if (container) {
        container.removeEventListener("touchstart", handleInteractionStart);
        container.removeEventListener("touchend", handleInteractionEnd);
        container.removeEventListener("mousedown", handleInteractionStart);
        container.removeEventListener("mouseup", handleInteractionEnd);
        container.removeEventListener("mouseleave", handleInteractionEnd);
      }
    };
  }, []);

  return (
    <section className="py-20 bg-card border-y border-border">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start <span className="text-premium-accent">Reading</span> in Seconds
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            No registration required. Just open and begin your journey with the <span className="text-premium-accent font-semibold">Quran</span>.
          </p>
        </div>

        {/* Steps */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 gap-6 md:gap-8 mb-12 pt-4 pb-6 md:pt-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0"
        >
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="flex-none w-[280px] md:w-auto group relative text-center opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: "forwards" }}
            >
              {/* Connector line (Desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              {/* Mobile Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="md:hidden absolute top-[40%] -right-3 transform -translate-y-1/2 translate-x-1/2 z-10 flex items-center justify-center pointer-events-none">
                  <ArrowRight className="w-6 h-6 text-premium-accent/50" />
                </div>
              )}

              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary/80 border border-border hover:border-premium-accent/30 hover:bg-premium-accent/5 transition-all duration-300 flex items-center justify-center group-hover:scale-105">
                  <item.icon className="w-6 h-6 md:w-10 md:h-10 text-premium-accent transition-colors" />
                </div>
                <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-premium-accent text-white text-xs md:text-sm font-bold flex items-center justify-center shadow-md">
                  {item.step}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild variant="hero" size="lg">
            <Link href="/read">
              Start Reading Now
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
