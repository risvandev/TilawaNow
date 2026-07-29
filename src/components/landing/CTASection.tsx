import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="cta-section py-16 md:py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-cta-foreground mb-4">
          Begin Your <span className="text-premium-accent">Journey</span> Today
        </h2>
        <p className="text-base md:text-lg text-cta-foreground/80 max-w-xl mx-auto mb-8">
          Join thousands who have made the <span className="text-premium-accent font-semibold">Quran</span> a part of their daily life.
          No account needed — start reading in seconds.
        </p>
        <Button asChild variant="cta" size="lg" className="max-md:h-10 max-md:px-6 max-md:text-sm">
          <Link href="/read">
            Start Reading Now
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
};
