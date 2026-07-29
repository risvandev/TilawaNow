import { useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSurahs } from "@/hooks/use-quran-queries";

const POPULAR_IDS = [2, 12, 18, 55, 56, 67];

export const PopularSurahsSection = () => {
  const { data: surahs = [], isLoading } = useSurahs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Map chosen IDs to the dynamically loaded surah list
  const popularSurahs = POPULAR_IDS.map(id => {
    return surahs.find(s => s.id === id);
  }).filter(Boolean) as any[];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || popularSurahs.length === 0) return;

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
        // Sync our tracking variable with the user's manual scroll position
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

    // Start auto scroll
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
  }, [isLoading, popularSurahs.length]);

  if (isLoading || popularSurahs.length === 0) {
    return (
      <section className="pt-16 pb-8 md:py-20 bg-background border-b border-border/40 relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-6 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-accent">
              Quick Access
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 mt-1 uppercase tracking-[0.08em]">
              Popular Surahs
            </h2>
            <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto mt-2">
              Jump directly to the chapters most frequently read and reflected upon.
            </p>
          </div>

          {/* Skeleton Grid/Carousel */}
          <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex-none w-[260px] md:w-auto h-[160px] bg-card/25 border border-border/40 rounded-[1.25rem] p-6 flex flex-col justify-between animate-pulse"
              >
                <div className="flex justify-end mb-6">
                  <div className="h-8 w-16 bg-secondary/40 rounded-md" />
                </div>
                <div className="mt-auto space-y-2">
                  <div className="h-3 w-12 bg-secondary/40 rounded" />
                  <div className="h-5 w-24 bg-secondary/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-16 pb-8 md:py-20 bg-background border-b border-border/40 relative overflow-hidden">
      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-accent">
            Quick Access
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 mt-1 uppercase tracking-[0.08em]">
            Popular Surahs
          </h2>
          <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto mt-2">
            Jump directly to the chapters most frequently read and reflected upon.
          </p>
        </div>

        {/* Surahs Grid / Carousel */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0"
        >
          {popularSurahs.map((surah, index) => (
            <Link
              key={surah.id}
              href={`/read/${surah.id}`}
              className={`opacity-0 animate-fade-in-up group relative overflow-hidden cursor-pointer transition-all duration-300
                flex-none w-[260px] md:w-auto min-h-[160px] flex flex-col justify-between p-6 rounded-[1.25rem]
                bg-black/20 border border-white/[0.04] hover:bg-black/30 hover:border-white/[0.08]
                hover:shadow-2xl hover:shadow-black/40`}
              style={{ 
                animationDelay: `${index * 80}ms`, 
                animationFillMode: "forwards"
              }}
            >
              {/* Top: Arabic right-aligned */}
              <div className="flex justify-end mb-8">
                <span className="font-arabic text-3xl text-foreground/80 group-hover:text-premium-accent transition-colors duration-300 drop-shadow-sm">
                  {surah.name_arabic}
                </span>
              </div>
              {/* Bottom: Number & English left-aligned */}
              <div className="flex flex-col items-start mt-auto">
                 <div className="flex items-center mb-1.5">
                   <span className="text-[9px] font-bold text-muted-foreground/50 tracking-[0.15em] uppercase">
                     Surah {String(surah.id).padStart(3, '0')}
                   </span>
                 </div>
                 <h3 className="text-xl font-bold text-foreground/90 tracking-tight group-hover:text-primary transition-colors">
                   {surah.name_simple}
                 </h3>
                 <p className="text-[11px] text-muted-foreground/60 mt-1 font-medium tracking-wide">
                   {surah.translated_name.name}
                 </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
