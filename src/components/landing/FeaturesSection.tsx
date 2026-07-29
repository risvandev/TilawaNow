import Link from "next/link";
import { ArrowRight, BookOpen, Sun, Sparkles } from "lucide-react";

const popularAyahs = [
  {
    icon: BookOpen,
    surahName: "Al-Baqarah",
    reference: "2:255",
    surahId: 2,
    ayahId: 255,
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ...",
    translation: "Allah! There is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth...",
    tag: "Ayat al-Kursi (The Throne Verse)"
  },
  {
    icon: Sun,
    surahName: "An-Nur",
    reference: "24:35",
    surahId: 24,
    ayahId: 35,
    arabic: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ ۖ الْمِصْبَاحُ فِي زُجَاجَةٍ...",
    translation: "Allah is the Light of the heavens and the earth. The example of His light is like a niche within which is a lamp; the lamp is within glass...",
    tag: "Ayat an-Nur (The Verse of Light)"
  },
  {
    icon: Sparkles,
    surahName: "Ash-Sharh",
    reference: "94:5-6",
    surahId: 94,
    ayahId: 5,
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "For indeed, with hardship comes ease. Indeed, with hardship comes ease.",
    tag: "Ayat al-Yusr (The Verse of Ease)"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="pt-8 pb-16 md:py-20 relative overflow-hidden bg-background">
      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-accent">
            Words of Wisdom
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/90 mt-1 uppercase tracking-[0.08em]">
            Popular Verses for Reflection
          </h2>
          <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto mt-2">
            Timeless verses of divine guidance, spiritual light, and absolute comfort.
          </p>
        </div>

        {/* Ayah Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularAyahs.map((ayah, index) => (
            <Link
              key={ayah.reference}
              href={`/read/${ayah.surahId}?ayah=${ayah.ayahId}`}
              className="opacity-0 animate-fade-in-up group bg-card/30 hover:bg-card/55 border border-border/60 hover:border-primary/45 rounded-3xl p-6 flex flex-col justify-between hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 relative overflow-hidden cursor-pointer"
              style={{ 
                animationDelay: `${index * 150}ms`, 
                animationFillMode: "forwards"
              }}
            >
              {/* Header inside Card */}
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ayah.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      {ayah.surahName} • {ayah.reference}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                    {ayah.ayahId === 5 ? "Ayah 5-6" : `Ayah ${ayah.ayahId}`}
                  </span>
                </div>

                {/* Tag label */}
                <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground/40 mb-3">
                  {ayah.tag}
                </div>

                {/* Arabic Text */}
                <p className="font-arabic text-xl md:text-2xl text-foreground/90 group-hover:text-foreground text-right leading-relaxed mb-6 select-none" dir="rtl">
                  {ayah.arabic}
                </p>
              </div>

              {/* Translation and Action */}
              <div>
                <p className="text-xs text-muted-foreground/75 leading-relaxed italic mb-6">
                  "{ayah.translation}"
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary group-hover:text-primary-foreground group-hover:translate-x-1 transition-all">
                  <span>Read Verse Context</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
