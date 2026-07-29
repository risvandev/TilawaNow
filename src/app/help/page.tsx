"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search, Bot, User, Send, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { RestrictedAccess } from "@/components/auth/RestrictedAccess";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How do I start reading the Quran?",
    answer:
      "Simply navigate to the 'Read Quran' section from the sidebar or click 'Start Reading' on the home page. You can browse all 114 surahs, search for specific ones, or use our quick access shortcuts to popular surahs.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No! You can read, listen, and view translations without any account. Creating an account is only needed if you want to track your reading progress and sync across devices.",
  },
  {
    question: "How do I listen to Quran recitation?",
    answer:
      "When viewing any surah, you'll see an audio player. Click the play button to listen to professional recitation. You can choose from different reciters in the settings.",
  },
  {
    question: "How do I change the translation language?",
    answer:
      "Go to Settings from the sidebar, then under 'Language & Translation', select your preferred translation language from the dropdown menu.",
  },
  {
    question: "Is this service free?",
    answer:
      "Yes! This platform is completely free and will always remain free. We believe everyone should have easy access to the Holy Quran without any barriers.",
  },
  {
    question: "How does the AI Assistance work?",
    answer:
      "The AI Assistant helps you understand Quran verses better. You can ask questions about specific ayahs, their meanings, historical context, and related teachings. Simply type your question and get helpful explanations.",
  },
  {
    question: "Can I track my reading progress?",
    answer:
      "Yes! The Dashboard shows your reading statistics including ayahs read and your current reading streak. Your progress is saved locally, or you can sign in to sync across devices.",
  },
  {
    question: "Which reciters are available?",
    answer:
      "We offer recitations from renowned Qaris including Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Saud Al-Shuraim, and many more. You can change the reciter in the settings.",
  },
];

import { chatWithAI, ChatMessage } from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";

const SITE_SUPPORT_PROMPT = `SYSTEM PROMPT — TilawaNow Support Guide

You are the dedicated Support Assistant for "TilawaNow", a premium Quran engagement platform.
Your SOLE responsibility is to assist users with using the website, configuring settings, and troubleshooting feature issues.

PRINCIPLE: You are a Technical Guide, not a Sheikh. Do not interpret the Quran. Focus on the PLATFORM.

1) PRIMARY PURPOSE
- Answer questions on:
  • **Navigation**: How to find Surahs, Dashboard, Bookmarks, settings.
  • **Settings**: Configuring general options, reading choices, audio reciters, profile, and community.
  • **Features**: Word-by-word playback, daily reading streaks, meaning mode.
  • **Troubleshooting**: Audio playback, loading errors, resetting name.

2) DETAILED KNOWLEDGE BASE (APP FEATURES & SETTINGS)
- **Settings Path**: User can access settings via [[NAVIGATE:/settings]]. Settings are organized into 4 tabs:
  1. **General Settings Tab**:
     - *Appearance*: Toggle between Light Theme and Dark Theme. Switch on/off **Night Mode** (comfort tint with a warm yellow filter to reduce eye strain).
     - *Language & Translation*: Choose the translation edition (default is Saheeh International, with translations available in English, Urdu, Turkish, Spanish, French, etc.).
  2. **Reading & Audio Settings Tab**:
     - *Quran Text Script*: Select script style: **Uthmani (Default)**, **IndoPak (Asian style)**, or **Simple (Imlaei)**.
     - *Audio Reciter (Qari)*: Select the reciter (Mishary Alafasy, Al-Sudais, Al-Shuraim, etc.). Suggest **Al-Husary** or **AbdulBaset** for the best word-by-word audio highlighting support. There is a "Play" button to test the selected reciter's audio preview.
  3. **Community Settings Tab**:
     - *WhatsApp Group*: Join the "TilawaNow Family" main WhatsApp community group chat.
     - *Instagram*: Follow the official Instagram profile @tilawanow for graphics and visual verses.
  4. **Profile Settings Tab**:
     - *Edit Profile Name*: Edit full name by clicking the pencil icon next to the name. Saved directly to the user profile database.
     - *Sign Out*: Sign out of the active user session.
     - *Support Us*: Link to the voluntary donation page.
- **Read Quran (📖)**:
  - Accessible via [[NAVIGATE:/read]]. Actions include audio play, translation toggle, and word-by-word meaning lookup. "Meaning Mode" simplifies the view to keep readers distraction-free.
- **Dashboard (📊)**:
  - Accessible via [[NAVIGATE:/dashboard]]. Tracks reading time, ayah count, and active reading streaks.

3) REFUSAL & REDIRECTION (CRITICAL)
- **RELIGIOUS QUESTIONS**: If a user asks for Tafsir, Fatwa, or Islamic Ruling:
  - *Response*: "I help with website settings and features. For Quranic knowledge, please use our **TilawaNow AI** (Quran Assistant) on the main page. 📖"
- **OFF-TOPIC**: If a user asks about math, news, or general code:
  - *Response*: "I am specialized only in TilawaNow platform support. How can I help you regarding our website settings? ⚙️"

4) STRUCTURE & TONE
- **Tone**: Professional, technical but simplified, friendly (Customer Support style).
- **Format**:
  - Use **Bold** for UI buttons/menus (e.g., **Settings** > **General**).
  - Use arrows for paths: **Settings** → **Reading & Audio**.
  - Use emojis for visual cues (⚙️, 🔊, 🌙).

5) HALAL / ETHICAL GUARDRAILS
- Maintain strict Islamic etiquette (Adab).

- **ROUTES**: Landing Page (/), App Home (/home), Reading (/read), Dashboard (/dashboard), Settings (/settings), About (/about), Help (/help), Contact (/contact), Donate (/donate).

6) NAVIGATION (COMMANDS)
- To take user somewhere: use [[NAVIGATE:/path]] (LOWERCASE, start with /)
- To offer a button: use [[OFFER_NAVIGATE:/path|Label]]

7) UNKNOWN ISSUES
- If a user reports a bug you don't know:
  - "I'm sorry you're facing this. Please try refreshing the page. If the issue persists, you can email our dev team at tilawanow@gmail.com."

END OF SYSTEM PROMPT`;

const sanitizePath = (path: string) => {
  let rawPath = path.split("|")[0];
  let cleaned = rawPath.trim().toLowerCase();
  
  if (!cleaned.startsWith("/") && !cleaned.startsWith("http")) {
    cleaned = "/" + cleaned;
  }
  return cleaned;
};

const MessageWithOffers = ({ content, onNavigate }: { content: string, onNavigate: (path: string, label: string) => void }) => {
  const offerRegex = /\[\[OFFER_NAVIGATE:\s*(.*?)\s*\|\s*(.*?)\s*\]\]/g;
  const cleanText = (content || "").replace(offerRegex, "").trim();
  const offers: { path: string, label: string }[] = [];
  
  const matches = Array.from((content || "").matchAll(offerRegex));
  matches.forEach(match => {
    offers.push({ path: match[1], label: match[2] });
  });

  return (
    <div className="space-y-3">
      <div className="markdown-content">
        <ReactMarkdown>{cleanText}</ReactMarkdown>
      </div>
      {offers.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {offers.map((offer, i) => (
            <Button 
              key={i} 
              variant="hero" 
              size="sm" 
              className="h-8 rounded-xl flex items-center gap-1.5 text-xs group/btn"
              onClick={() => onNavigate(offer.path, offer.label)}
            >
              <span>{offer.label}</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};


const HelpSupport = () => {
  const { user } = useAuth();
  const navigate = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    return (
      <RestrictedAccess 
        title="Support Restricted"
        description="Sign in to access personalized support and AI assistance."
        icon={HelpCircle}
      />
    );
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm here to help you with any questions about using this website. How can I assist you today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    // Optimistic update
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: userMessage }
    ];
    setChatMessages(newMessages);
    setIsLoading(true);

    try {
      const systemMessage: ChatMessage = { role: "system", content: SITE_SUPPORT_PROMPT };

      // Append safety constraint to the last message
      const recentMessages = newMessages.slice(-8);
      const lastIndex = recentMessages.length - 1;

      const apiMessages = [
        systemMessage,
        ...recentMessages.map((msg, index) => {
          if (index === lastIndex && msg.role === "user") {
            return {
              ...msg,
              content: msg.content + "\n\n[SYSTEM INSTRUCTION: Answer ONLY if related to TilawaNow settings/features. If religious/off-topic, REFUSE/REDIRECT.]"
            };
          }
          return msg;
        })
      ];

      const responseContent = await chatWithAI(apiMessages);

      const displayContent = responseContent.replace(/\[\[NAVIGATE:.*?\]\]/g, "").trim();
      setChatMessages(prev => [...prev, { role: "assistant", content: displayContent }]);

      // Handle Navigation
      const navMatch = responseContent.match(/\[\[NAVIGATE:\s*(.*?)\s*\]\]/);
      if (navMatch && navMatch[1]) {
        const targetPath = sanitizePath(navMatch[1]);
        toast({ title: "Auto-Navigating", description: `Opening ${targetPath}...` });
        setTimeout(() => navigate.push(targetPath), 1000);
      }

    } catch (error: any) {
      console.error("Support AI Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to contact support agent."
      });
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting to the support server. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 -ml-4 pl-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Help & Support</h1>
          <p className="text-muted-foreground text-sm md:text-base">Find answers or chat with our support assistant</p>
        </div>

        {/* Search FAQs */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search frequently asked questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-secondary border-border"
          />
        </div>

        {/* FAQs */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filteredFaqs.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No matching questions found. Try the support chat below.
            </p>
          )}
        </div>
      </div>
      <Footer />

      {/* App Support Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-24 md:bottom-6 right-6 z-50 p-3 md:p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
            <span className="absolute right-full mr-3 bg-card text-foreground px-2 py-1 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
              App Support
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-4 md:p-6 h-[100dvh]">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              App Support
            </SheetTitle>
            <SheetDescription>
              Ask about app settings, features, or report issues.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col min-h-0 mb-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin">
              {/* Initial message */}
              <div className="flex justify-start py-2">
                <div className="bg-transparent text-foreground text-sm max-w-full leading-relaxed">
                  <ReactMarkdown components={{
                    strong: ({ node, ...props }) => <span className="font-semibold text-primary" {...props} />
                  }}>
                    {"Hi! I'm your **TilawaNow** Support Guide. I can help you with app settings, features, and how to use the platform. What would you like to know?"}
                  </ReactMarkdown>
                </div>
              </div>

              {chatMessages.slice(1).map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start py-2"}`}
                >
                  <div
                    className={cn(
                      "text-sm leading-relaxed",
                      message.role === "user"
                        ? "max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm"
                        : "max-w-full bg-transparent text-foreground px-0"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <MessageWithOffers 
                        content={message.content} 
                        onNavigate={(path, label) => {
                          const target = sanitizePath(path);
                          toast({ title: "Redirecting", description: `Opening ${label} (${target})...` });
                          navigate.push(target);
                        }} 
                      />
                    ) : (
                      <ReactMarkdown components={{
                        strong: ({ node, ...props }) => <span className="font-semibold text-primary" {...props} />,
                        p: ({ node, ...props }) => <span {...props} />
                      }}>
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start py-2">
                  <div className="bg-transparent px-0 py-1">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative border border-border/40 rounded-xl bg-secondary/80 focus-within:border-primary/30 mt-auto flex items-center p-1">
              <Input
                placeholder="Ask support..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                className="bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 px-3 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/40"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSendMessage} 
                disabled={!chatInput.trim() || isLoading} 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Send className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div >
  );
};

export default HelpSupport;
