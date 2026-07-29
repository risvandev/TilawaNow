import { QURAN_STATS } from "@/lib/quran-api";
import { Counter } from "@/components/ui/counter";

const stats = [
  {
    value: QURAN_STATS.totalAyahs,
    isNumber: true,
    label: "Total Ayahs",
    description: "Verses of divine guidance",
  },
  {
    value: QURAN_STATS.totalSurahs,
    isNumber: true,
    label: "Total Surahs",
    description: "Chapters of wisdom",
  },
  {
    value: QURAN_STATS.totalJuz,
    isNumber: true,
    label: "Total Juz",
    description: "Divisions for easy reading",
  },
  {
    value: "∞",
    isNumber: false,
    label: "Blessings",
    description: "Infinite rewards await",
  },
];

export const StatsSection = () => {
  return (
    <section className="py-16 bg-background border-b border-border/40">
      <div className="container mx-auto max-w-5xl px-6">
        {/* Section Intro as pure typographic fact introduction */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-accent">
            Scriptural Fact Sheet
          </span>
          <h3 className="text-base font-bold tracking-tight text-foreground/90 mt-1 uppercase tracking-[0.08em]">
            Quranic Metrics & Divisions
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center opacity-0 animate-fade-in-up flex flex-col items-center"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
            >
              {/* Large fact numbers */}
              <div className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-foreground mb-2">
                {stat.isNumber ? (
                  <Counter end={stat.value as number} />
                ) : (
                  <span>{stat.value}</span>
                )}
              </div>
              
              {/* Labels */}
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 mb-1">
                {stat.label}
              </div>
              
              {/* Description */}
              <p className="text-[11px] text-muted-foreground/45 max-w-[150px] leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
