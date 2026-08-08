"use client";

import { useState, useEffect, useMemo, useRef, memo } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  ArrowRight,
  Info,
  ChevronDown,
  X,
  Quote,
  Copy,
  Sparkles,
  LogOut,
  MessageSquarePlus,
  Loader2,
  Square
} from "lucide-react";

import getPuter from "@/lib/puter-service";
import {
  chatWithAI,
  streamChatWithAI,
  ChatMessage,
  generateCompanionSystemPrompt,
  AIChatMode,
  determineRequiredTools,
  executeTextToolCall,
  getToolStatusMessage
} from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RestrictedAccess } from "@/components/auth/RestrictedAccess";
import { useAICompanion } from "@/contexts/AICompanionContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/layout/AppSidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const QURAN_EXPERT_PROMPT = `SYSTEM PROMPT — TilawaNow Islamic Assistant

You are a grounded, reliable Quranic companion. 
Your primary goal is to help users understand the Quran through verified classical interpretations.

OPERATING MODES:
1. QUICK: Brief, direct answers based on reliable knowledge.
2. RESEARCH: High-level academic analysis with fallback to web search ONLY for modern scholarly context. Always prioritize classical sources first.

AVAILABLE TOOLS & CONTEXT:
The system automatically fetches Quranic text, translations, and Tafsir for you before you respond.
If you see a [SYSTEM TOOL EXECUTION] block in your memory, you MUST use that exact data to formulate your answer.
Do NOT guess or hallucinate Quranic translations or Tafsirs. Rely strictly on the provided tool data.

STRICT PROTOCOL:
- Never invent interpretations (hallucinate).
- If grounded context is fetched via tools, summarize and simplify it using the structured output format.
- Maintain academic rigor and respectful tone.
- Do NOT start your response with "Wa Alaikum Assalam" or other greetings unless the user explicitly greeted you in their message.
`;

const sanitizePath = (path: string) => {
  // If the AI mixed formats and included a pipe (e.g. /path|Label)
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
    <div className="space-y-4">
      <div className="markdown-content">
        <ReactMarkdown>{cleanText}</ReactMarkdown>
      </div>
      {offers.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {offers.map((offer, i) => (
            <Button
              key={i}
              variant="hero"
              size="sm"
              className="rounded-xl flex items-center gap-2 group/btn"
              onClick={() => onNavigate(offer.path, offer.label)}
            >
              <span>{offer.label}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

const ChatMessageList = memo(({
  messages,
  isLoading,
  executeNavigation,
  toast,
  toolStatus
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  executeNavigation: (path: string, label: string) => void;
  toast: any;
  toolStatus: string | null;
}) => {
  return (
    <div className="space-y-8 pb-40 md:pb-32">
      {messages.map((message, index) => {
        if (message.role === "assistant" && !message.content && isLoading && index === messages.length - 1) {
          return (
            <div key={index} className="flex justify-start pt-6 pb-2 w-full">
              <div className="w-full">
                {toolStatus ? (
                  <div className="flex items-center text-sm font-medium text-muted-foreground ml-2">
                    <span>{toolStatus.replace(/\.+$/, "")}</span>
                    <span className="wave-dot tracking-widest text-primary/70">.</span>
                    <span className="wave-dot tracking-widest text-primary/70">.</span>
                    <span className="wave-dot tracking-widest text-primary/70">.</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm font-medium text-muted-foreground ml-2">
                    <span>Thinking</span>
                    <span className="wave-dot tracking-widest text-primary/70">.</span>
                    <span className="wave-dot tracking-widest text-primary/70">.</span>
                    <span className="wave-dot tracking-widest text-primary/70">.</span>
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (message.role === "assistant" && !message.content) return null;

        return (
          <div key={index} id={`message-${index}`} className={cn(
            "flex animate-in fade-in slide-in-from-bottom-4 duration-500",
            message.role === "user" ? "justify-end gap-4" : "justify-start gap-0"
          )}>
            <div className={cn(
              "rounded-2xl py-3 px-5",
              message.role === "user"
                ? "max-w-[90%] md:max-w-[80%] bg-secondary text-foreground rounded-3xl rounded-tr-md shadow-sm"
                : "w-full px-0 bg-transparent border-none shadow-none py-4"
            )}>
              <div className="text-sm md:text-base leading-relaxed selection:bg-primary/30">
                {message.role === "assistant" ? (
                  <div className="ai-response-content">
                    {isLoading && index === messages.length - 1 && toolStatus && (
                      <div className="flex items-center text-sm font-medium text-muted-foreground mb-3 w-fit ml-2">
                        <span>{toolStatus.replace(/\.+$/, "")}</span>
                        <span className="wave-dot tracking-widest text-primary/70">.</span>
                        <span className="wave-dot tracking-widest text-primary/70">.</span>
                        <span className="wave-dot tracking-widest text-primary/70">.</span>
                      </div>
                    )}
                    <MessageWithOffers content={message.content || ""} onNavigate={executeNavigation} />
                    {message.role === "assistant" && message.content && !isLoading && (
                      <div className="flex justify-start mt-4 pt-2 border-t border-primary/5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-all rounded-lg group/copy"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content || "");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5 group-hover/copy:scale-110 transition-transform" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown>{message.content || ""}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
ChatMessageList.displayName = "ChatMessageList";

const AIAssistance = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentContext, userAIMemory } = useAICompanion();
  const { isExpanded, isHovered } = useSidebar();
  const shouldShowExpanded = isExpanded || isHovered;

  // AI Modes & State
  const [chatMode, setChatMode] = useState<AIChatMode>("Quick");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const [dontShowNewChatConfirm, setDontShowNewChatConfirm] = useState(false);
  const [rememberNewChatChoice, setRememberNewChatChoice] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);

  // Contextual Follow-up State
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [selectionPopup, setSelectionPopup] = useState<{ text: string, x: number, y: number } | null>(null);

  // Puter State
  const [isPuterSignedIn, setIsPuterSignedIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Auto-resizing Textarea Ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Use rAF to check native height without forcing layout recalculations
    requestAnimationFrame(() => {
      const scrollH = textarea.scrollHeight;
      
      setIsMultiline((prev) => {
        if (scrollH > 44) return true;
        if (textarea.value.length <= 12 && !textarea.value.includes('\n')) return false;
        return prev;
      });
    });
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    setMounted(true);
    const savedNewChatPref = localStorage.getItem("dontShowNewChatConfirm") === "true";
    setDontShowNewChatConfirm(savedNewChatPref);
    // Load chat history from session storage on mount
    const savedChat = sessionStorage.getItem("tilawanow_chat_history");
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed)) {
            const safeMessages = parsed.map((m: any) => ({
                ...m,
                content: typeof m.content === 'string' ? m.content : (m.content ? JSON.stringify(m.content) : "")
            }));
            setMessages(safeMessages);
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Persist messages to session storage whenever they change
  useEffect(() => {
    if (mounted) {
      if (messages.length > 0) {
        sessionStorage.setItem("tilawanow_chat_history", JSON.stringify(messages));
      } else {
        sessionStorage.removeItem("tilawanow_chat_history");
      }
    }
  }, [messages, mounted]);

  // Initialize Puter from SDK
  useEffect(() => {
    if (mounted) {
      const checkPuter = () => {
        const p = getPuter();
        if (p) {
          const signedIn = p.auth.isSignedIn();
          setIsPuterSignedIn(signedIn);
          setShowOnboarding(!signedIn);
          return true;
        }
        return false;
      };

      if (!checkPuter()) {
        const interval = setInterval(() => {
          if (checkPuter()) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [mounted, toast]);

  const timelineNodes = useMemo(() => {
    return (messages || [])
      .map((msg, idx) => ({ ...msg, originalIndex: idx }))
      .filter(msg => msg?.role === "user");
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!target) return;
    // If the user scrolls up from the bottom of the container, disable auto-scroll
    const isScrolledUp = target.clientHeight + target.scrollTop < target.scrollHeight - 150;
    setAutoScrollEnabled(!isScrolledUp);
  };

  useEffect(() => {
    if (mounted && autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isLoading, mounted, autoScrollEnabled]);

  // Handle Text Selection for Contextual Follow-up
  useEffect(() => {
    if (!mounted) return;

    const handleMouseUp = () => {
      // Small timeout to allow the browser to finalize selection
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          setSelectionPopup(null);
          return;
        }

        const selectedText = selection.toString().trim();
        if (selectedText.length < 3) {
          setSelectionPopup(null);
          return;
        }

        // Ensure selection is inside an AI assistant response area
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer as HTMLElement;

        if (!(container as HTMLElement)?.closest('.ai-response-content')) {
          setSelectionPopup(null);
          return;
        }

        const rect = range.getBoundingClientRect();
        setSelectionPopup({
          text: selectedText,
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + window.scrollY
        });
      }, 50);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [mounted]);

  const handlePuterSignIn = async () => {
    const p = getPuter();
    if (!p) return;
    try {
      await p.auth.signIn();
      setIsPuterSignedIn(true);
      setShowOnboarding(false);
      toast({ title: "Connected", description: "Successfully linked to your Puter account." });
    } catch (e: any) {
      // Users often close the popup or cancel, so we silently handle it 
      // instead of showing a scary red error toast.
      console.log("Puter authentication dismissed or failed:", e);
    }
  };

  const executeNavigation = (path: string, label: string) => {
    const targetPath = sanitizePath(path);
    toast({ title: "Redirecting", description: `Opening ${label} (${targetPath})...` });
    router.push(targetPath);
  };

  const handleSend = async (messageOverride?: string, forceMode?: AIChatMode) => {
    const userMessage = (messageOverride || input).trim();
    if (!userMessage || isLoading) return;

    const mode = forceMode || chatMode;
    setInput("");

    let finalMessage = userMessage;
    if (quotedText) {
      finalMessage = `> ${quotedText}\n\n${userMessage}`;
      setQuotedText(null);
    }

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: finalMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setAutoScrollEnabled(true); // Force scroll to bottom for new messages

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const fullSystemPrompt = generateCompanionSystemPrompt(
        {
          ...userAIMemory, currentPosition: currentContext.verseKey ? {
            surahId: currentContext.surahId!,
            ayahNumber: currentContext.ayahNumber!,
            verseKey: currentContext.verseKey
          } : undefined
        },
        QURAN_EXPERT_PROMPT
      );

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let chatHistory = [{ role: "system", content: fullSystemPrompt } as ChatMessage, ...newMessages.slice(-5)];

      // 1. PRE-FLIGHT TOOL CHECK
      const contextOpts = { mode, verseKey: currentContext.verseKey || undefined };
      const requiredTools = await determineRequiredTools(chatHistory, contextOpts);

      if (requiredTools && requiredTools.length > 0) {
        let combinedToolResults = "";
        
        for (const tool of requiredTools) {
          if (!tool.tool || !tool.verseKey) continue;
          setToolStatus(getToolStatusMessage(tool.tool));
          
          const result = await executeTextToolCall(tool.tool, tool.verseKey);
          combinedToolResults += `[SYSTEM TOOL EXECUTION: ${tool.tool} for ${tool.verseKey}]\nRESULT:\n${result}\n\n`;
        }

        if (combinedToolResults) {
          chatHistory.push({
            role: "system",
            content: `Use the following fetched data to answer the user:\n\n${combinedToolResults}`
          });
        }
      }

      setToolStatus(null);

      // 2. VISIBLE CONVERSATIONAL STREAM
      let fullResponse = "";
      await streamChatWithAI(
        chatHistory,
        (chunk: string) => {
          fullResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              let displayContent = fullResponse.replace(/\[\[NAVIGATE:.*?\]\]/g, "").trim();
              updated[lastIndex] = { ...updated[lastIndex], content: displayContent };
            }
            return updated;
          });
        },
        contextOpts,
        abortController.signal
      );

      const navMatch = fullResponse.match(/\[\[NAVIGATE:\s*(.*?)\s*\]\]/);
      if (navMatch && navMatch[1]) {
        const targetPath = sanitizePath(navMatch[1]);
        toast({ title: "Auto-Navigating", description: `Taking you to ${targetPath}...` });
        setTimeout(() => router.push(targetPath), 1000);
      }

    } catch (error: any) {
      const errMsg = error?.message ? (typeof error.message === 'string' ? error.message : JSON.stringify(error.message)) : "An unexpected error occurred.";
      toast({ variant: "destructive", title: "Error", description: errMsg });

      // Force re-login on authentication or token errors to "clean" the state
      if (errMsg.toLowerCase().includes('unauthorized') || error?.status === 401 || errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('session')) {
        const p = getPuter();
        if (p) p.auth.signOut();
        setIsPuterSignedIn(false);
        setShowOnboarding(true);
        toast({ title: "Session Expired", description: "Please connect your Puter account again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (!user) {
    return (
      <RestrictedAccess 
        title="AI Chat Restricted"
        description="Get explanations, meanings, and guidance while reading."
        icon={Sparkles}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "relative w-full h-full flex flex-col overflow-hidden bg-background transition-all duration-700",
        showOnboarding && "items-center justify-center p-4"
      )}>
        {/* Bottom White Gradient — visible only on empty initial state */}
        {messages.length === 0 && !isLoading && !showOnboarding && (
          <div 
            className="fixed bottom-0 left-0 right-0 h-[70vh] pointer-events-none z-[1] animate-in fade-in duration-700"
            style={{
              background: "linear-gradient(to top, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.20) 45%, rgba(255, 255, 255, 0.05) 80%, transparent 100%)"
            }}
          />
        )}

        {/* Floating Follow-up Button */}
        {selectionPopup && (
          <div
            className="absolute z-[100] animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
            style={{
              left: `${selectionPopup.x}px`,
              top: `${selectionPopup.y - 48}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="relative pointer-events-auto">
              <Button
                size="sm"
                variant="hero"
                className="rounded-full shadow-2xl flex items-center gap-2 h-9 px-4 bg-primary/95 backdrop-blur-md border border-white/10"
                onClick={() => {
                  setQuotedText(selectionPopup.text);
                  setSelectionPopup(null);
                  window.getSelection()?.removeAllRanges();
                }}
              >
                <Quote className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Ask about this</span>
              </Button>
              {/* Caret/Arrow pointing down */}
              <div
                className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-primary/95 rotate-45 border-r border-b border-white/10"
              />
            </div>
          </div>
        )}

        {showOnboarding ? (
          /* Minimalist Auth Gate */
          <div className="max-w-sm w-full mx-auto text-center space-y-8 animate-fade-in-up relative px-6">
            <div className="absolute -inset-20 bg-primary/5 rounded-full blur-[100px] opacity-20 pointer-events-none" />

            <div className="flex items-center justify-center mx-auto mb-4 opacity-80">
              <Image
                src="/quran-logo.svg"
                alt="TilawaNow Logo"
                width={48}
                height={48}
                className="text-primary brightness-0 dark:brightness-125 dark:grayscale"
              />
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">AI Companion</h3>
            </div>

            <div className="pt-2">
              <Button
                onClick={handlePuterSignIn}
                size="lg"
                variant="hero"
                className="w-full rounded-xl text-sm font-bold h-12 shadow-lg shadow-primary/10 hover:scale-[1.01] transition-all mb-4"
              >
                Connect & Continue
              </Button>
              <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-medium">
                Powered by Puter
              </p>
            </div>
          </div>
        ) : (
          /* Unlocked State - Full AI Interface */
          <div className="w-full flex-1 flex flex-col min-h-0 relative">
            {/* Chat Timeline */}
            <div className="hidden lg:flex fixed right-10 top-1/2 -translate-y-1/2 flex-col items-center gap-2 z-30 py-2">
              {timelineNodes.map((node, i) => (
                <Tooltip key={i} delayDuration={50}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        const el = document.getElementById(`message-${node.originalIndex}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="w-6 h-6 rounded-full hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110 active:scale-90 group"
                    >
                      <span className="text-primary text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">—</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-popover/90 backdrop-blur-md border-primary/20 max-w-[200px]">
                    <p className="text-xs line-clamp-2">{typeof (node as any).content === 'string' ? (node as any).content : JSON.stringify((node as any).content)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="w-full flex-1 flex flex-col min-h-0 md:max-w-4xl mx-auto px-4 pt-16 md:pt-20">
              {/* Top Header Fade */}
              <div className={cn(
                "fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-background via-background/95 to-transparent pt-4 md:pt-6 pb-12 px-6 md:px-12 lg:px-24 xl:px-48 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500 transition-all md:left-16",
                shouldShowExpanded && "md:left-56"
              )}>
                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex-1 flex justify-start">
                    {messages.length > 0 && (
                      dontShowNewChatConfirm ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Start New Chat"
                                onClick={() => {
                                  sessionStorage.removeItem("tilawanow_chat_history");
                                  setMessages([]);
                                }}
                                className="h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                              >
                                <MessageSquarePlus className="w-4 h-4 md:w-5 md:h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Start New Chat
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <AlertDialog>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Start New Chat"
                                    className="h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                                  >
                                    <MessageSquarePlus className="w-4 h-4 md:w-5 md:h-5" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                Start New Chat
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <AlertDialogContent className="max-w-[90vw] md:max-w-sm rounded-2xl glass-card border-white/10 p-6 pointer-events-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base md:text-lg font-bold text-foreground">
                                Start a new chat?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                                Clear history to speed up responses and save AI credits. (Past chats aren't saved on this device).
                              </AlertDialogDescription>
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/20">
                                <Checkbox
                                  id="dont-show-new-chat"
                                  checked={rememberNewChatChoice}
                                  onCheckedChange={(checked) => setRememberNewChatChoice(!!checked)}
                                />
                                <label
                                  htmlFor="dont-show-new-chat"
                                  className="text-xs text-muted-foreground cursor-pointer select-none"
                                >
                                  Don't show this again
                                </label>
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row justify-end gap-2 mt-5">
                              <AlertDialogCancel className="rounded-xl text-xs font-semibold h-9 px-4 mt-0 bg-secondary/50 border-white/10 hover:bg-secondary">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  if (rememberNewChatChoice) {
                                    localStorage.setItem("dontShowNewChatConfirm", "true");
                                    setDontShowNewChatConfirm(true);
                                  }
                                  sessionStorage.removeItem("tilawanow_chat_history");
                                  setMessages([]);
                                }}
                                className="rounded-xl text-xs font-semibold h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Start New
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )
                    )}
                  </div>
                  <h1 className="text-lg md:text-2xl font-bold text-foreground tracking-tight text-center">TilawaNow AI</h1>
                  <div className="flex-1 flex justify-end">
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Disconnect AI Connection"
                              className="h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                            >
                              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          Disconnect AI Connection
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <AlertDialogContent className="max-w-[90vw] md:max-w-sm rounded-2xl glass-card border-white/10 p-6 pointer-events-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base md:text-lg font-bold text-foreground">
                          Disconnect AI?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                          Are you sure you want to disconnect? You will need to sign in again to use the AI companion.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row justify-end gap-2 mt-5">
                        <AlertDialogCancel className="rounded-xl text-xs font-semibold h-9 px-4 mt-0 bg-secondary/50 border-white/10 hover:bg-secondary">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            getPuter()?.auth.signOut();
                            setIsPuterSignedIn(false);
                            setShowOnboarding(true);
                            toast({ title: "Connection Reset", description: "You have disconnected from Puter AI." });
                          }}
                          className="rounded-xl text-xs font-semibold h-9 px-4 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

              {/* Empty State — shown before first message */}
              {messages.length === 0 && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-700 min-h-0">
                  <div className="flex flex-col items-center gap-5">
                    <Image
                      src="/quransite_white_small.png"
                      alt="TilawaNow"
                      width={64}
                      height={64}
                      className="opacity-90 shrink-0"
                    />
                    <div className="text-center">
                      <h2 className="text-2xl md:text-3xl font-bold leading-snug text-foreground">
                        What's on your mind?
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        Ask about any verse, Surah, or Islamic concept.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message History — only render when there's content */}
              {(messages.length > 0 || isLoading) && (
                <div 
                  className="flex-1 w-full overflow-y-auto overscroll-contain touch-pan-y" 
                  style={{ WebkitOverflowScrolling: 'touch' }}
                  onScroll={handleScroll}
                >
                  <ChatMessageList
                    messages={messages}
                    isLoading={isLoading}
                    executeNavigation={executeNavigation}
                    toast={toast}
                    toolStatus={toolStatus}
                  />
                  <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
                </div>
              )}
            </div>

            {/* AI Control Center & Input Area (FLEX-NONE, NOT FIXED) */}
            <div className={cn(
              "flex-none w-full z-50 pt-2 pb-20 md:pb-6 px-4",
              messages.length > 0 ? "bg-gradient-to-t from-background via-background/95 to-background border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]" : "bg-transparent"
            )}>
              <div className="max-w-3xl mx-auto space-y-4">

                {/* Quoted Context Preview */}
                {quotedText && (
                  <div className="flex items-center gap-3 bg-secondary/50 backdrop-blur-xl border border-primary/20 rounded-xl p-2 px-4 animate-in slide-in-from-bottom-2 duration-300 group/quote shadow-2xl">
                    <div className="w-0.5 h-6 bg-primary rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/80 italic truncate leading-relaxed">"{quotedText}"</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuotedText(null)}
                      className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {chatMode === "Research" && (
                  <div className="flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border/40 text-[10px] text-muted-foreground font-bold uppercase tracking-widest cursor-help">
                            <Info className="w-3 h-3 text-muted-foreground" />
                            Research Mode: Ext. Sources Allowed
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs p-3">
                          Uses online search for comparative scholarly opinions. Higher AI credit usage. May include unverified modern opinions.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Input Bar */}
                <div className={cn(
                  "relative glass-card rounded-[1.5rem] md:rounded-[1.75rem] p-2 md:p-3 shadow-2xl backdrop-blur-3xl transition-all flex flex-row flex-wrap items-end gap-2",
                  messages.length === 0 && !isLoading
                    ? "bg-[#121212]/98 border border-white/15 focus-within:border-white/40"
                    : "bg-secondary/95 border border-border/40 focus-within:border-primary/40"
                )}>
                  {/* Left: Mode Selector Dropdown */}
                  <div className={cn(isMultiline ? "order-2" : "order-1")}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Select AI Chat Mode"
                          className={cn(
                            "flex items-center justify-center rounded-full md:rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all bg-transparent border-0 border-none shadow-none shrink-0",
                            isMultiline ? "h-8 w-8 md:h-9 md:w-auto md:px-3 md:gap-1.5" : "h-9 w-9 md:h-10 md:w-auto md:px-3 md:gap-1.5"
                          )}
                        >
                          <ChevronDown className={cn("text-primary", isMultiline ? "w-3.5 h-3.5" : "w-4 h-4 md:w-3.5 md:h-3.5")} />
                          <span className={cn("hidden md:inline text-xs font-bold uppercase tracking-wider", isMultiline && "text-[11px]")}>{chatMode}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 p-1 glass-card border-primary/20 rounded-2xl mb-2">
                        <DropdownMenuItem
                          onClick={() => setChatMode("Quick")}
                          className={cn(
                            "flex flex-col items-start p-3 rounded-xl cursor-pointer transition-colors",
                            chatMode === "Quick" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                          )}
                        >
                          <span className="text-xs font-bold">Quick Mode</span>
                          <span className="text-[10px] opacity-60">Fast, direct answers</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setChatMode("Research")}
                          className={cn(
                            "flex flex-col items-start p-3 rounded-xl cursor-pointer transition-colors",
                            chatMode === "Research" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                          )}
                        >
                          <span className="text-xs font-bold">Research Mode</span>
                          <span className="text-[10px] opacity-60">Includes web fallbacks</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Middle: Native Auto-expanding Textarea via CSS Grid */}
                  <div className={cn(
                    "relative grid transition-all",
                    isMultiline ? "order-1 w-full mb-1" : "order-2 flex-1 items-center"
                  )}>
                    {/* Invisible ghost element that grows natively with text wrap */}
                    <div 
                      className="col-start-1 row-start-1 invisible whitespace-pre-wrap break-words min-h-[36px] max-h-[160px] w-full py-1.5 px-1 md:py-2 text-base leading-relaxed"
                      aria-hidden="true"
                    >
                      {input + ' '}
                    </div>
                    {/* Actual textarea strictly follows grid cell height */}
                    <Textarea
                      ref={textareaRef}
                      placeholder={currentContext.verseKey ? `Ask about Verse ${currentContext.verseKey}...` : "Ask about the Quran..."}
                      value={input}
                      rows={1}
                      disabled={isLoading}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="col-start-1 row-start-1 h-full min-h-[36px] max-h-[160px] w-full bg-transparent border-0 border-none shadow-none ring-0 ring-offset-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none resize-none py-1.5 px-1 md:py-2 text-base text-foreground font-medium placeholder:text-muted-foreground/40 disabled:opacity-50 leading-relaxed scrollbar-hide overflow-hidden will-change-[height]"
                    />
                  </div>

                  {/* Spacer for multiline layout to push send button right */}
                  {isMultiline && <div className="order-3 flex-1" />}

                  {/* Right: Send / Stop Button */}
                  {isLoading ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Stop Generating"
                      onClick={() => {
                        abortControllerRef.current?.abort();
                        setIsLoading(false);
                      }}
                      className={cn(
                        "rounded-full hover:bg-primary/10 hover:text-primary transition-all shrink-0",
                        isMultiline ? "order-4 h-8 w-8 md:h-9 md:w-9" : "order-3 h-9 w-9 md:h-10 md:w-10 md:mb-0.5"
                      )}
                    >
                      <Square className="w-4 h-4 md:w-5 md:h-5 text-primary fill-primary" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Send Message"
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      className={cn(
                        "rounded-full hover:bg-primary/10 hover:text-primary transition-all shrink-0",
                        isMultiline ? "order-4 h-8 w-8 md:h-9 md:w-9" : "order-3 h-9 w-9 md:h-10 md:w-10 md:mb-0.5"
                      )}
                    >
                      <Send className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AIAssistance;
