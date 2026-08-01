"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Moon, Sun, Globe, User, Bell, BookOpen, Volume2, Play, Loader2, Square, ChevronLeft, ChevronRight, ChevronDown, Pencil, Check, X, Heart, HelpCircle, Mail, Users, Instagram } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { getTranslationsByLanguage, AVAILABLE_RECITERS, AVAILABLE_TRANSLATIONS, AVAILABLE_WBW_LANGUAGES } from "@/lib/quran-api";
import { useAuth } from "@/contexts/AuthContext";
import { RestrictedAccess } from "@/components/auth/RestrictedAccess";

declare global {
  interface Window {
    testAudioInstance: HTMLAudioElement | null;
  }
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useRouter();
  const { theme, setTheme } = useTheme();
  const [translationId, setTranslationId] = useState("20"); // Default to Saheeh International
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "general");

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', val);
    navigate.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [isTranslationDropdownOpen, setIsTranslationDropdownOpen] = useState(false);
  const [quranScript, setQuranScript] = useState("text_uthmani");
  const [nightMode, setNightMode] = useState(false);
  const [reciterId, setReciterId] = useState(1);
  const [wbwLanguage, setWbwLanguage] = useState("en");
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [tafsirId, setTafsirId] = useState("169"); // Default to Ibn Kathir (en)

  // Audio Preview State
  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const [testAudioLoading, setTestAudioLoading] = useState(false);

  // Removed Donate Dialog State and Razorpay logic in favor of /donate page


  // Profile Edit State
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    // Always load local settings first for settings not stored in Supabase
    // (like wbwLanguage, showTransliteration, tafsirId, reminderTime)
    loadLocalSettings();

    if (!user) {
      return;
    }

    // Settings are fully managed via local storage and next-themes now.

    // Cleanup test audio on unmount
    return () => {
      if (window.testAudioInstance) {
        window.testAudioInstance.pause();
        window.testAudioInstance = null;
      }
    };
  }, [user]);

  const loadLocalSettings = () => {
    // Load reciter preference
    const savedReciter = localStorage.getItem("reciterId");
    if (savedReciter) setReciterId(parseInt(savedReciter));

    // Theme is managed by next-themes natively.

    // Check for saved script preference
    const savedScript = localStorage.getItem("quranScript");
    if (savedScript) {
      setQuranScript(savedScript);
    }

    // Check for saved translation preference
    const savedTranslation = localStorage.getItem("quranTranslation");
    if (savedTranslation) {
      setTranslationId(savedTranslation);
    }

    // Check for WBW Language
    const savedWbw = localStorage.getItem("wbwLanguage");
    if (savedWbw) setWbwLanguage(savedWbw);

    // Check for Show Transliteration
    const savedTransliteration = localStorage.getItem("showTransliteration");
    if (savedTransliteration !== null) setShowTransliteration(savedTransliteration === "true");

    // Check for Tafsir ID
    const savedTafsir = localStorage.getItem("tafsirId");
    if (savedTafsir) setTafsirId(savedTafsir);

    // Check for night mode preference
    const savedNightMode = localStorage.getItem("nightMode") === "true";
    setNightMode(savedNightMode);
    if (savedNightMode) {
      document.body.classList.add("night-mode");
    } else {
      document.body.classList.remove("night-mode");
    }

  };

  // Removed updateProfileSetting since settings are strictly local now

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const toggleNightMode = (checked: boolean) => {
    setNightMode(checked);
    localStorage.setItem("nightMode", String(checked));
    if (checked) {
      document.body.classList.add("night-mode");
    } else {
      document.body.classList.remove("night-mode");
    }
  };





  const handleUpdateProfileName = async () => {
    if (!user || !newName.trim()) return;

    try {
      // 1. Update Auth Metadata (for session/navbar)
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: newName }
      });

      if (authError) throw authError;

      // 2. Update Public Profile (for database persistence)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setEditingName(false);
      toast({
        title: "Profile Updated",
        description: "Your name has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update your profile name.",
      });
    }
  };

  const handleDonate = () => {
    navigate.push("/donate");
  };

  if (!user) {
    return (
      <RestrictedAccess
        title="Settings Restricted"
        description="Sign in to customize your experience and save preferences."
        icon={SettingsIcon}
      />
    );
  }

  return (
    <div className="relative flex-1 min-h-[calc(100vh-4rem)] md:min-h-screen overflow-x-hidden pb-32 md:pb-0">
      {/* Ambient Mac-like Glows */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vh] rounded-full bg-primary/10 blur-[120px] pointer-events-none opacity-60 mix-blend-screen z-0" />
      <div className="absolute top-[30vh] right-0 w-[40vw] h-[40vh] rounded-full bg-premium-accent/10 blur-[120px] pointer-events-none opacity-50 mix-blend-screen z-0" />

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-4 md:py-8 md:max-w-6xl">
        {/* Mobile Header (Back + Title Inline) */}
        <div className="md:hidden flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -ml-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (showMobileDetail) {
                setShowMobileDetail(false);
              } else {
                navigate.back();
              }
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          {!showMobileDetail ? (
            <div>
              <h1 className="text-xl font-bold text-foreground">Settings</h1>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-foreground capitalize">
                {activeTab === "notifications" ? "Notification" : activeTab} Settings
              </h1>
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">System Settings</h1>
              <p className="text-muted-foreground">Customize your TilawaNow experience</p>
            </div>
          </div>
        </div>

        {/* Unified Mac-like Glass Window */}
        <div className="md:bg-secondary/40 md:backdrop-blur-3xl md:border md:border-white/[0.08] md:shadow-2xl md:rounded-[2rem] md:overflow-hidden transition-all duration-300">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex flex-col md:flex-row min-h-[600px]"
          >
            {/* Mobile Menu List (Visible only on mobile when no detail is open) */}
            <div className={`${showMobileDetail ? 'hidden' : 'flex'} md:hidden flex-col gap-1 w-full`}>
              <button
                onClick={() => { handleTabChange("general"); setShowMobileDetail(true); }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                    <Moon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Appearance</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => { handleTabChange("reading"); setShowMobileDetail(true); }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Reading & Audio</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => { handleTabChange("community"); setShowMobileDetail(true); }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Community</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => { handleTabChange("profile"); setShowMobileDetail(true); }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Help & Support (Mobile) */}
              <button
                onClick={() => navigate.push("/help")}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Help & Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Contact (Mobile) */}
              <button
                onClick={() => navigate.push("/contact")}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Contact</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Donate Item (Mobile) */}
              <button
                onClick={handleDonate}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-pink-500/10 rounded-md text-pink-500 group-hover:bg-pink-500/20 transition-colors">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Support Us</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Desktop Sidebar (Hidden on mobile) */}
            <TabsList className="hidden md:flex flex-col justify-start w-64 bg-black/10 p-4 gap-2 h-auto md:border-r md:border-white/[0.08] shrink-0">
              <TabsTrigger
                value="general"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-xl transition-all border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5"
              >
                <Moon className="w-5 h-5" />
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="reading"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-xl transition-all border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5"
              >
                <BookOpen className="w-4 h-4" />
                Reading & Audio
              </TabsTrigger>
              <TabsTrigger
                value="community"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-xl transition-all border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5"
              >
                <Users className="w-4 h-4" />
                Community
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-xl transition-all border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5"
              >
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            <div className={`flex-1 min-w-0 p-0 md:p-8 ${showMobileDetail ? 'block' : 'hidden md:block'}`}>
              {/* General Tab */}
              <TabsContent value="general" className="mt-0 space-y-6 animate-fade-in">
                {/* Appearance */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden hover:bg-white/[0.04] transition-colors duration-300">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    Appearance
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <label className="font-medium text-foreground">Theme Preference</label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Choose how TilawaNow looks on your device
                      </p>
                    </div>
                    <Select value={theme} onValueChange={handleThemeChange}>
                      <SelectTrigger className="bg-black/20 backdrop-blur-md border-white/10 hover:bg-black/30 transition-colors w-full md:w-64">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System (Default)</SelectItem>
                        <SelectItem value="dark">Dark Theme</SelectItem>
                        <SelectItem value="light">Light Theme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4">
                    <div>
                      <p className="font-medium text-foreground">Night Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Eye comfort filter (warm tint)
                      </p>
                    </div>
                    <Switch checked={nightMode} onCheckedChange={toggleNightMode} />
                  </div>
                </div>



              </TabsContent>

              {/* Reading Tab */}
              <TabsContent value="reading" className="mt-0 space-y-6 animate-fade-in">
                {/* Reading Preferences */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden hover:bg-white/[0.04] transition-colors duration-300">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Reading Preferences
                  </h2>
                  <div className="space-y-6">
                    {/* Script Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Quran Text Script
                      </label>
                      <Select
                        value={quranScript}
                        onValueChange={(value) => {
                          setQuranScript(value);
                          localStorage.setItem("quranScript", value);
                          toast({
                            title: "Script Updated",
                            description: "Quran script has been updated.",
                          });
                        }}
                      >
                        <SelectTrigger className="bg-black/20 backdrop-blur-md border-white/10 hover:bg-black/30 transition-colors w-full">
                          <SelectValue placeholder="Select script style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text_uthmani">Uthmani (Default)</SelectItem>
                          <SelectItem value="text_indopak">IndoPak (Asian)</SelectItem>
                          <SelectItem value="text_imlaei">Simple (Imlaei)</SelectItem>
                          <SelectItem value="text_uthmani_tajweed">Uthmani Tajweed (Color-coded)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Translation Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Translation Language & Author
                      </label>
                      <Select
                        value={translationId}
                        onValueChange={(value) => {
                          setTranslationId(value);
                          localStorage.setItem("quranTranslation", value);
                          toast({
                            title: "Translation Updated",
                            description: "Your translation preference has been saved.",
                          });
                        }}
                      >
                        <SelectTrigger className="bg-black/20 backdrop-blur-md border-white/10 hover:bg-black/30 transition-colors w-full">
                          <SelectValue placeholder="Select a translation" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_TRANSLATIONS.map((t) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Word-by-Word Language */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Word-by-Word Language
                      </label>
                      <Select
                        value={wbwLanguage}
                        onValueChange={(value) => {
                          setWbwLanguage(value);
                          localStorage.setItem("wbwLanguage", value);
                          toast({
                            title: "Word-by-Word Language Updated",
                            description: "Hover over words to see translations.",
                          });
                        }}
                      >
                        <SelectTrigger className="bg-black/20 backdrop-blur-md border-white/10 hover:bg-black/30 transition-colors w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_WBW_LANGUAGES.map((l) => (
                            <SelectItem key={l.code} value={l.code}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tafsir Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Default Scholarly Tafsir
                      </label>
                      <Select
                        value={tafsirId}
                        onValueChange={(value) => {
                          setTafsirId(value);
                          localStorage.setItem("tafsirId", value);
                          toast({
                            title: "Tafsir Updated",
                            description: "Default Tafsir has been updated.",
                          });
                        }}
                      >
                        <SelectTrigger className="bg-black/20 backdrop-blur-md border-white/10 hover:bg-black/30 transition-colors w-full">
                          <SelectValue placeholder="Select a Tafsir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="169">Tafsir Ibn Kathir (English)</SelectItem>
                          <SelectItem value="16">Tafsir Al-Jalalayn (Arabic)</SelectItem>
                          <SelectItem value="91">Tafsir Al-Waseet (Arabic)</SelectItem>
                          <SelectItem value="164">Tafsir Ibn Kathir (Urdu)</SelectItem>
                          <SelectItem value="14">Tafsir Ibn Kathir (Arabic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Show Transliteration Toggle */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Show Transliteration</h3>
                        <p className="text-xs text-muted-foreground mt-1">Show English pronunciation in word tooltips</p>
                      </div>
                      <Switch
                        checked={showTransliteration}
                        onCheckedChange={(checked) => {
                          setShowTransliteration(checked);
                          localStorage.setItem("showTransliteration", String(checked));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Audio Preferences */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden hover:bg-white/[0.04] transition-colors duration-300">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Audio Preferences
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Reciter (Qari)
                      </label>
                      <div className="flex gap-2">
                        <Select
                          value={reciterId.toString()}
                          onValueChange={(value) => {
                            setReciterId(parseInt(value));
                            localStorage.setItem("reciterId", value);
                            toast({
                              title: "Reciter Updated",
                              description: "Audio selection has been saved.",
                            });
                          }}
                        >
                          <SelectTrigger className="bg-black/20 backdrop-blur-md border-white/10 hover:bg-black/30 transition-colors flex-1">
                            <SelectValue placeholder="Select a reciter" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_RECITERS.map((reciter) => (
                              <SelectItem key={reciter.id} value={reciter.id.toString()}>
                                {reciter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 w-10 h-10"
                          title={testAudioPlaying ? "Stop" : "Test Audio"}
                          onClick={() => {
                            if (testAudioPlaying) {
                              if (window.testAudioInstance) {
                                window.testAudioInstance.pause();
                                window.testAudioInstance = null;
                              }
                              setTestAudioPlaying(false);
                              setTestAudioLoading(false);
                              return;
                            }

                            setTestAudioLoading(true);

                            if (window.testAudioInstance) {
                              window.testAudioInstance.pause();
                            }

                            fetch(`https://api.quran.com/api/v4/recitations/${reciterId}/by_ayah/1:1`)
                              .then(res => res.json())
                              .then(data => {
                                if (data.audio_files?.[0]?.url) {
                                  const url = data.audio_files[0].url;
                                  const fullUrl = url.startsWith('http') ? url : `https://verses.quran.com/${url}`;

                                  const audio = new Audio(fullUrl);
                                  window.testAudioInstance = audio;

                                  audio.addEventListener('canplay', () => {
                                    setTestAudioLoading(false);
                                    setTestAudioPlaying(true);
                                    audio.play();
                                  });

                                  audio.addEventListener('ended', () => {
                                    setTestAudioPlaying(false);
                                    window.testAudioInstance = null;
                                  });

                                  audio.addEventListener('error', (e) => {
                                    console.error("Audio playback error:", e, fullUrl);
                                    setTestAudioLoading(false);
                                    toast({ variant: "destructive", title: "Playback Error", description: "Could not play test audio." });
                                  });
                                } else {
                                  console.error("No audio file found for 1:1");
                                  setTestAudioLoading(false);
                                  toast({ variant: "destructive", title: "Audio Not Found", description: "This reciter may not have audio for Fatiha." });
                                }
                              })
                              .catch((err) => {
                                console.error("Fetch error:", err);
                                setTestAudioLoading(false);
                                toast({ variant: "destructive", title: "Network Error", description: "Failed to fetch audio details." });
                              });
                          }}
                        >
                          {testAudioLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : testAudioPlaying ? (
                            <Square className="w-4 h-4 fill-primary text-primary" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: "Al-Husary" and "AbdulBaset" have the best word-by-word highlighting support.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Community Tab */}
              <TabsContent value="community" className="mt-0 space-y-6 animate-fade-in">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden hover:bg-white/[0.04] transition-colors duration-300">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Community Channels
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Stay connected with the global TilawaNow community, get daily insights, and share your spiritual journey.
                  </p>

                  {/* WhatsApp Section - Main, Top, Long */}
                  <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-5 md:p-6 mb-6 hover:bg-emerald-500/[0.06] transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.457 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-foreground">TilawaNow Family Community</h3>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Main
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                            Join the TilawaNow family on WhatsApp. This is a space for real connections, sharing our spiritual journeys, supporting one another, and growing together as one global family.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full lg:w-auto gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-black font-semibold rounded-lg h-11 px-6 shrink-0 border-none"
                        onClick={() => window.open("https://chat.whatsapp.com/Hhd9xE0gFqFEOciGGq6QxS", "_blank")}
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.457 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Join TilawaNow Family
                      </Button>
                    </div>
                  </div>

                  {/* Instagram Section - Bottom, Long */}
                  <div className="bg-black/20 border border-white/10 rounded-2xl p-5 md:p-6 hover:bg-black/30 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-pink-500/10 rounded-lg w-fit text-pink-500 shrink-0">
                          <Instagram className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground mb-1">Instagram Page</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                            Follow us on Instagram for beautiful daily Quranic graphics, visual verses, and layout highlights.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full lg:w-auto gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-medium rounded-lg h-11 px-6 shrink-0 border-none"
                        onClick={() => window.open("https://www.instagram.com/tilawanow/", "_blank")}
                      >
                        <Instagram className="w-4 h-4" />
                        Follow on Instagram
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-6 animate-fade-in">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden hover:bg-white/[0.04] transition-colors duration-300">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile
                  </h2>
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingName ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="h-8 max-w-[200px] bg-black/20 backdrop-blur-md border-white/10 focus-visible:ring-primary/30 hover:bg-black/30 transition-colors"
                              />
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={handleUpdateProfileName}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                                setEditingName(false);
                                setNewName(user.user_metadata.full_name || "");
                              }}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <p className="font-medium text-foreground truncate">
                                {newName || user.user_metadata.full_name || "User"}
                              </p>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setNewName(user.user_metadata.full_name || "");
                                  setEditingName(true);
                                }}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                            Sign Out
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sign Out</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to sign out? You will need to log in again to access personalized features.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => signOut()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Sign Out
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-sm mb-4">
                        Sign in to save your reading progress across devices and unlock personalized features.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/login">Sign In</a>
                      </Button>
                    </>
                  )}
                </div>

                {/* Support / Donate Section */}
                <div className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden hover:bg-pink-500/10 transition-colors duration-300">
                  <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                    Support Our Mission
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Support its development voluntarily. Access will <strong className="text-foreground">always be free</strong>.
                  </p>
                  <Button
                    onClick={handleDonate}
                    variant="hero"
                    className="w-full gap-2"
                  >
                    <Heart className="w-4 h-4 fill-primary/20" />
                    Donate to Support
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>



    </div>
  );
};

export default Settings;
