import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Search, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { useSurahs } from "@/hooks/use-quran-queries";
import { searchVerses } from "@/lib/quran-api";
import Fuse from "fuse.js";

export const HeroSection = () => {
  const { user } = useAuth();
  const { data: surahs = [] } = useSurahs();
  const [searchQuery, setSearchQuery] = useState("");
  const [verseResults, setVerseResults] = useState<any[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [placeholder, setPlaceholder] = useState("Search surah, translation, or topics...");

  // Setup Fuse.js for local Surah searching
  const fuse = new Fuse(surahs, {
    keys: ["name_simple", "name_arabic", "translated_name.name", "id"],
    threshold: 0.35,
  });

  const filteredSurahs = searchQuery.trim()
    ? fuse.search(searchQuery.trim()).map(r => r.item).slice(0, 5) // top 5 surahs
    : [];

  const parseDirectCoord = (query: string) => {
    const match = query.trim().match(/^(\d+):(\d+)$/);
    if (match) {
      const surahId = parseInt(match[1]);
      const ayahId = parseInt(match[2]);
      if (surahId >= 1 && surahId <= 114) {
        const surah = surahs.find(s => s.id === surahId);
        if (surah) {
          return { surah, ayahId };
        }
      }
    }
    return null;
  };
  const directCoord = parseDirectCoord(searchQuery);

  // Debounced API call for verse search
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setVerseResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsLoadingVerses(true);
      try {
        const res = await searchVerses(searchQuery.trim());
        if (res && res.results) {
          setVerseResults(res.results.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingVerses(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update placeholder text on mobile screens to save space
  useEffect(() => {
    const updatePlaceholder = () => {
      setPlaceholder(
        window.innerWidth < 768
          ? "Search surah, translation, topics..."
          : "Search surah, translation, or topics..."
      );
    };
    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder);
    return () => window.removeEventListener("resize", updatePlaceholder);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (directCoord) {
        router.push(`/read/${directCoord.surah.id}?ayah=${directCoord.ayahId}`);
        setIsDropdownOpen(false);
        return;
      }
      if (filteredSurahs.length > 0) {
        router.push(`/read/${filteredSurahs[0].id}`);
        setIsDropdownOpen(false);
        return;
      }
      if (verseResults.length > 0) {
        const surahId = parseInt(verseResults[0].verse_key.split(":")[0]);
        const ayahId = parseInt(verseResults[0].verse_key.split(":")[1]);
        router.push(`/read/${surahId}?ayah=${ayahId}`);
        setIsDropdownOpen(false);
        return;
      }
      router.push(`/read?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsDropdownOpen(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute left-0 right-0 top-20 md:top-24 bottom-[55%] md:bottom-[50%] z-0">
        <Image
          src="/hero_section.webp_mobile.webp"
          alt="Quran Background"
          fill
          priority
          className="object-cover opacity-45 md:hidden"
          sizes="(max-width: 767px) 100vw, 0vw"
          quality={90}
        />
        <Image
          src="/hero_section.webp"
          alt="Quran Background"
          fill
          priority
          className="object-cover opacity-45 hidden md:block"
          sizes="(min-width: 768px) 100vw, 0vw"
          quality={90}
        />
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-5 md:px-8 md:py-6 container mx-auto">
        <Link href={user ? "/home" : "/"} className="hover:opacity-90 transition-opacity">
          <Logo
            className="gap-2.5"
            iconClassName="w-6 h-6 md:w-7 md:h-7"
            textClassName="font-extrabold tracking-[-0.03em] text-sm md:text-base text-foreground"
            arabicClassName="text-sm md:text-lg"
          />
        </Link>
        
        {/* Centered Navigation Links */}
        <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          <Link href="/read" className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/80 hover:text-foreground hover:scale-[1.02] active:scale-98 transition-all duration-300">
            Quran
          </Link>
          <Link href="/dashboard" className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/80 hover:text-foreground hover:scale-[1.02] active:scale-98 transition-all duration-300">
            Dashboard
          </Link>
          <Link href="/about" className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/80 hover:text-foreground hover:scale-[1.02] active:scale-98 transition-all duration-300">
            About
          </Link>
        </div>

        <div className="absolute right-4 md:right-8 flex items-center gap-1.5 md:gap-3">
          {user ? (
            <Button asChild variant="ghost" className="text-foreground hover:bg-secondary/50 gap-2 h-7 md:h-9 px-2 md:px-3 rounded-xl transition-all">
              <Link href="/settings">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-sm font-semibold tracking-wider uppercase">{user.user_metadata.full_name || "Profile"}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="default" className="bg-foreground text-background hover:bg-foreground/90 h-7 md:h-9 px-3.5 md:px-5 rounded-xl text-[10px] md:text-sm font-bold tracking-[0.08em] uppercase shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
              <Link href="/account">Account</Link>
            </Button>
          )}
        </div>
      </nav>

      {/* Curved Search Bar positioned just above the 50% image division line */}
      <div ref={searchRef} className="absolute left-1/2 -translate-x-1/2 bottom-[57%] md:bottom-[52%] w-full z-30 container mx-auto px-6 text-center">
        <form 
          onSubmit={handleSearchSubmit} 
          className="w-full max-w-lg md:max-w-xl mx-auto relative group"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 md:w-5 md:h-5 text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors duration-300" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full bg-black hover:bg-black/95 focus:bg-black text-foreground placeholder:text-muted-foreground/45 border border-border/70 rounded-full py-3.5 pl-11 pr-11 md:py-4 md:pl-13 md:pr-13 text-xs md:text-sm font-medium tracking-wide focus:outline-none focus:border-foreground/20 focus:ring-4 focus:ring-foreground/5 transition-all duration-300 shadow-xl shadow-black/25"
            />
            {isLoadingVerses && (
              <Loader2 className="absolute right-4 w-4 h-4 md:w-5 md:h-5 text-primary animate-spin" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (searchQuery.trim().length > 0 || filteredSurahs.length > 0 || verseResults.length > 0 || directCoord) && (
            <div className="absolute left-0 right-0 mt-2 bg-black/95 border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-50 text-left max-h-[300px] overflow-y-auto scrollbar-thin">
              <div className="p-2 flex flex-col gap-1">
                
                {/* Direct coordinate match */}
                {directCoord && (
                  <div className="border-b border-border/40 pb-1 mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        router.push(`/read/${directCoord.surah.id}?ayah=${directCoord.ayahId}`);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/40 text-xs md:text-sm font-medium text-primary hover:text-primary-foreground transition-all"
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Go to Surah {directCoord.surah.name_simple}, Ayah {directCoord.ayahId}</span>
                    </button>
                  </div>
                )}

                {/* Surah Matches */}
                {filteredSurahs.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                      Surahs
                    </div>
                    {filteredSurahs.map(surah => (
                      <button
                        key={surah.id}
                        type="button"
                        onClick={() => {
                          router.push(`/read/${surah.id}`);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary/40 transition-all text-xs md:text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BookOpen className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                          <span className="font-semibold text-foreground truncate">{surah.name_simple}</span>
                          <span className="text-muted-foreground/50 truncate text-[11px] font-medium">{surah.translated_name.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-arabic text-primary/70">{surah.name_arabic}</span>
                          <span className="text-[10px] bg-secondary/80 text-muted-foreground/70 px-1.5 py-0.5 rounded font-mono">
                            {surah.id}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Verse Matches */}
                {verseResults.length > 0 && (
                  <div className="mt-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider border-t border-border/40 pt-2">
                      Matching Verses
                    </div>
                    {verseResults.map((verse, idx) => {
                      const surahId = parseInt(verse.verse_key.split(":")[0]);
                      const ayahId = parseInt(verse.verse_key.split(":")[1]);
                      const surahMeta = surahs.find(s => s.id === surahId);
                      return (
                        <button
                          key={verse.verse_id || idx}
                          type="button"
                          onClick={() => {
                            router.push(`/read/${surahId}?ayah=${ayahId}`);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex flex-col gap-1 px-3 py-2 rounded-xl hover:bg-secondary/40 transition-all text-left"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-primary/80">
                            <span>{surahMeta ? `${surahMeta.name_simple} (${surahMeta.name_arabic})` : `Surah ${surahId}`}</span>
                            <span className="font-mono text-muted-foreground/50">Ayah {ayahId}</span>
                          </div>
                          {verse.text && (
                            <p className="font-arabic text-xs text-foreground/90 truncate w-full text-right" dir="rtl">
                              {verse.text}
                            </p>
                          )}
                          {verse.translations && verse.translations[0] && (
                            <p className="text-[11px] text-muted-foreground/80 truncate w-full line-clamp-1">
                              {verse.translations[0].text.replace(/<[^>]*>/g, "")}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {filteredSurahs.length === 0 && verseResults.length === 0 && !directCoord && searchQuery.trim().length >= 3 && !isLoadingVerses && (
                  <div className="px-3 py-4 text-center text-xs md:text-sm text-muted-foreground/70">
                    No matching surahs or verses found for "{searchQuery}"
                  </div>
                )}

              </div>
            </div>
          )}
        </form>
      </div>

      {/* Grid of Surah boxes below the image section (bottom half) */}
      <div className="absolute left-0 right-0 bottom-4 md:bottom-10 top-[47%] md:top-[51%] z-20 flex items-center justify-center px-4">
        <div className="container mx-auto max-w-5xl h-full max-h-[42vh] md:max-h-[30vh] grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-3.5 px-0 md:px-[2rem]">
          {/* Left Column: Al-Fatihah (Tall Box) */}
          <Link 
            href="/read/1" 
            className="md:col-span-5 bg-card/45 border border-border/70 hover:border-primary/40 rounded-2xl p-3 md:p-4 flex flex-col justify-between hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            {/* Watermark */}
            <div className="absolute -right-3 -bottom-3 text-7xl font-extrabold text-foreground/5 opacity-5 select-none font-sans group-hover:scale-110 transition-transform duration-300">
              01
            </div>
            
            {/* Header info */}
            <div>
              <div className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
                Surah 01
              </div>
              <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Al-Fatihah
              </h2>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                The Opening & Foundation
              </p>
            </div>

            {/* Bottom info */}
            <div className="flex items-end justify-between mt-6">
              <span className="text-[9px] font-medium tracking-wider uppercase text-muted-foreground/60">
                7 Verses • Meccan
              </span>
              <span className="font-arabic text-3xl text-primary/80 group-hover:text-primary transition-all duration-300 group-hover:scale-105">
                الفاتحة
              </span>
            </div>
          </Link>

          {/* Right Column: Ya-Sin (Top) & Al-Ikhlas (Bottom) Stack */}
          <div className="md:col-span-7 flex flex-row md:flex-col gap-3 md:gap-3.5 h-full">
            {/* Ya-Sin */}
            <Link 
              href="/read/36" 
              className="flex-1 bg-card/45 border border-border/70 hover:border-primary/40 rounded-2xl p-3 md:p-4 flex flex-col justify-between hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 group cursor-pointer relative overflow-hidden"
            >
              {/* Watermark */}
              <div className="absolute -right-3 -bottom-3 text-6xl font-extrabold text-foreground/5 opacity-5 select-none font-sans group-hover:scale-110 transition-transform duration-300">
                36
              </div>

              <div>
                <div className="text-[8px] md:text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-0.5">
                  Surah 36
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <h2 className="text-xs md:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors whitespace-nowrap md:whitespace-normal">
                    Ya-Sin
                  </h2>
                  <span className="font-arabic text-base md:text-xl text-primary/80 group-hover:text-primary transition-all duration-300 group-hover:scale-105">
                    يس
                  </span>
                </div>
                <p className="text-[10px] md:text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                  The Heart of the Quran
                </p>
              </div>

              <div className="flex items-end justify-between mt-2">
                <span className="text-[8px] md:text-[9px] font-medium tracking-wider uppercase text-muted-foreground/60">
                  83 Verses • Meccan
                </span>
              </div>
            </Link>

            {/* Al-Ikhlas */}
            <Link 
              href="/read/112" 
              className="flex-1 bg-card/45 border border-border/70 hover:border-primary/40 rounded-2xl p-3 md:p-4 flex flex-col justify-between hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 group cursor-pointer relative overflow-hidden"
            >
              {/* Watermark */}
              <div className="absolute -right-3 -bottom-3 text-6xl font-extrabold text-foreground/5 opacity-5 select-none font-sans group-hover:scale-110 transition-transform duration-300">
                112
              </div>

              <div>
                <div className="text-[8px] md:text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-0.5">
                  Surah 112
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <h2 className="text-xs md:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors whitespace-nowrap md:whitespace-normal">
                    Al-Ikhlas
                  </h2>
                  <span className="font-arabic text-base md:text-xl text-primary/80 group-hover:text-primary transition-all duration-300 group-hover:scale-105">
                    الإخلاص
                  </span>
                </div>
                <p className="text-[10px] md:text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                  The Sincerity & Monotheism
                </p>
              </div>

              <div className="flex items-end justify-between mt-2">
                <span className="text-[8px] md:text-[9px] font-medium tracking-wider uppercase text-muted-foreground/60">
                  4 Verses • Meccan
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
};
