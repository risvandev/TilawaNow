"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Info, Heart } from "lucide-react";
import { useSmartBack } from "@/hooks/use-smart-back";

/**
 * About TilawaNow - Ultra Minimal Industrial Style
 * Precisely containing 100% of the User provided content.
 */
const About = () => {
  const router = useRouter();
  const handleBack = useSmartBack("/home");

  const sections = [
    {
      title: "1. Opening Statement",
      content: (
        <div className="space-y-4">
          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
            TilawaNow is a modern platform to read, listen, and understand the Qur’an with clarity and consistency.
          </p>
          <p>
            Built for simplicity and depth, it helps you form a daily, meaningful connection with the Qur’an—without distraction or confusion.
          </p>
        </div>
      )
    },
    {
      title: "2. The Problem",
      content: (
        <div className="space-y-4">
          <p>Most people engage with the Qur’an, but not effectively:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reading often happens without understanding</li>
            <li>Listening becomes passive, not engaging</li>
            <li>Consistency is hard—people start, stop, and restart</li>
            <li>Existing apps are either too basic or unnecessarily complex</li>
          </ul>
          <p className="font-medium text-foreground/80 mt-4">
            This creates a gap—not in access, but in real connection.
          </p>
        </div>
      )
    },
    {
      title: "3. The Solution",
      content: (
        <div className="space-y-4">
          <p>TilawaNow is designed to close that gap by combining essential elements into one system:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A clean and focused reading experience</li>
            <li>Integrated audio recitation for seamless listening</li>
            <li>AI-assisted explanations to support understanding</li>
            <li>Structured progress tracking through a Khatmah system</li>
            <li>A distraction-free environment built for focus</li>
          </ul>
          <p className="italic">Everything works together—so reading becomes consistent, not occasional.</p>
        </div>
      )
    },
    {
      title: "4. Core Philosophy",
      content: (
        <div className="space-y-8">
          <p>TilawaNow is built on a few clear principles:</p>
          <div className="space-y-6">
            <div className="border-l-2 border-primary/20 pl-4 py-1">
              <h4 className="font-bold text-foreground mb-1">Clarity over complexity</h4>
              <p className="text-sm">Understanding comes before volume. Reading without comprehension is incomplete.</p>
            </div>
            <div className="border-l-2 border-primary/20 pl-4 py-1">
              <h4 className="font-bold text-foreground mb-1">Consistency over intensity</h4>
              <p className="text-sm">Small daily progress is more powerful than rare, heavy effort.</p>
            </div>
            <div className="border-l-2 border-primary/20 pl-4 py-1">
              <h4 className="font-bold text-foreground mb-1">Technology as a tool, not authority</h4>
              <p className="text-sm">AI supports understanding—it does not replace scholars or traditional learning.</p>
            </div>
            <div className="border-l-2 border-primary/20 pl-4 py-1">
              <h4 className="font-bold text-foreground mb-1">Focus over noise</h4>
              <p className="text-sm">No unnecessary features. Only what directly improves your engagement with the Qur’an.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "5. Key Features",
      content: (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium">
          <li className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl border border-border/50">
            <span className="text-lg">📖</span> Structured Qur’an reading
          </li>
          <li className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl border border-border/50">
            <span className="text-lg">🎧</span> Continuous audio playback
          </li>
          <li className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl border border-border/50">
            <span className="text-lg">🧠</span> AI-powered explanations
          </li>
          <li className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl border border-border/50">
            <span className="text-lg">📊</span> Progress & Khatmah tracking
          </li>
          <li className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl border border-border/50">
            <span className="text-lg">🔖</span> Bookmarks and notes
          </li>
        </ul>
      )
    },
    {
      title: "6. How TilawaNow is Different",
      content: (
        <div className="space-y-4">
          <p>TilawaNow is not just another Qur’an app:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Not just a reader → a structured learning system</li>
            <li>Not just audio → a guided listening experience</li>
            <li>Not just AI → a context-aware assistant</li>
            <li>Not just tracking → a discipline-building system</li>
          </ul>
          <p className="font-bold text-foreground/80 mt-4 italic">
            It is designed to change how you engage—not just what you use.
          </p>
        </div>
      )
    },
    {
      title: "7. Who It’s For",
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Beginners who want clear understanding</li>
          <li>Regular readers who want consistency</li>
          <li>Individuals aiming to complete a Khatmah</li>
          <li>Users who prefer structured, focused learning</li>
        </ul>
      )
    },
    {
      title: "8. Trust & Responsibility",
      content: (
        <div className="space-y-4">
          <p>TilawaNow is built with respect and responsibility:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The Qur’an text is not altered</li>
            <li>Content is handled with care and reverence</li>
            <li>Sources are maintained accurately where applicable</li>
            <li>AI is used only as a supportive tool—not an authority</li>
          </ul>
          <p className="bg-primary/5 p-4 rounded-xl text-sm italic border border-primary/10">
            Users are encouraged to seek qualified scholars for deeper or formal guidance.
          </p>
        </div>
      )
    },
    {
      title: "9. Vision",
      content: (
        <div className="space-y-4">
          <p>TilawaNow aims to make Qur’an engagement a natural part of daily life, clear, and consistent.</p>
          <p>Over time, the platform will expand into deeper learning tools while maintaining simplicity and focus.</p>
        </div>
      )
    },
    {
      title: "10. Creator",
      content: (
        <div className="space-y-4">
          <p>TilawaNow is built independently with a strong focus on craftsmanship, usability, and purpose.</p>
          <p>Developed using modern technologies such as <b>React</b>, <b>Supabase</b>, and <b>AI systems (OpenRouter & Puter.js)</b> for assisted understanding.</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">Goal: Purpose over trend-following.</p>
        </div>
      )
    },
    {
      title: "11. Open Source",
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-bold text-foreground">
            <span>🔓</span> Open Source
          </div>
          <div className="space-y-4">
            <p className="font-medium text-foreground">
              TilawaNow is open source. Anyone can explore, use, and contribute to its development.
            </p>
            <p className="text-sm">
              The project is released under the <b>GNU Affero General Public License (AGPL-3.0)</b> to ensure it remains free and community-driven.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Anyone can use, study, and improve the platform</li>
              <li>Source code is publicly available</li>
            </ul>
          </div>
          <div className="pt-4">
            <a
              href="https://github.com/risvandev/TilawaNow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              View Source Code
            </a>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-6 md:pt-32 pb-20 md:pb-40 selection:bg-primary/10">
      <div className="container mx-auto px-6 max-w-2xl">
        <button
          onClick={handleBack}
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-20"
        >
          <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <header className="mb-8 md:mb-24">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8">About TilawaNow.</h1>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase bg-muted/50 w-fit px-4 py-2 rounded-md border border-border/50">
            <Info className="w-3 h-3" />
            <span>Platform Philosophy</span>
          </div>
        </header>

        <div className="space-y-16 text-muted-foreground leading-relaxed text-sm md:text-base">
          <div className="space-y-24">
            {sections.map((section, idx) => (
              <section key={idx} className="space-y-8">
                <h2 className="text-lg font-bold tracking-tight border-b border-border pb-4 w-fit pr-12 text-foreground">
                  {section.title}
                </h2>
                <div className="text-muted-foreground leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
            
            {/* 11. Closing Line */}
            <section className="pt-24 border-t border-border mt-32">
              <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight italic">
                “TilawaNow is built to make your connection with the Qur’an consistent, clear, and meaningful.”
              </p>
              <div className="mt-12 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 leading-loose max-w-lg">
                  Built for the Ummah.
                  <br />
                  © {new Date().getFullYear()} TilawaNow Team
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Heart className="w-4 h-4 text-primary fill-primary/10" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
