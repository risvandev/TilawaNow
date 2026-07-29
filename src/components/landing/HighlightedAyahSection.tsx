export const HighlightedAyahSection = () => {
  return (
    <section className="ayah-highlight">
      <div className="relative container mx-auto px-6 py-8">
        {/* Arabic text */}
        <p className="font-arabic text-2xl md:text-5xl lg:text-5xl leading-loose md:leading-[2.5] text-premium-accent mb-6 animate-fade-in">
          إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ
        </p>

        {/* Translation */}
        <p className="text-lg md:text-xl text-foreground mb-4 animate-fade-in delay-100 italic">
          "Indeed, this Quran guides to that which is most suitable..."
        </p>

        {/* Reference */}
        <p className="text-sm text-foreground/80 animate-fade-in delay-200">
          — Surah Al-Isra (17:9)
        </p>
      </div>
    </section>
  );
};
