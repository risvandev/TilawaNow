"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, ChevronLeft, ChevronDown, Loader2, Coffee, Server, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { useSmartBack } from "@/hooks/use-smart-back";

const CURRENCY_CONFIG = {
  INR: {
    symbol: "₹",
    oneTimeAmounts: [100, 250, 500, 1000, 2500, 5000],
    monthlyAmounts: [100, 300, 500, 1000],
    defaultAmount: 100
  },
  USD: {
    symbol: "$",
    oneTimeAmounts: [5, 10, 25, 50, 100, 250],
    monthlyAmounts: [5, 10, 25, 50],
    defaultAmount: 10
  },
  EUR: {
    symbol: "€",
    oneTimeAmounts: [5, 10, 25, 50, 100, 250],
    monthlyAmounts: [5, 10, 25, 50],
    defaultAmount: 10
  },
  GBP: {
    symbol: "£",
    oneTimeAmounts: [5, 10, 25, 50, 100, 250],
    monthlyAmounts: [5, 10, 25, 50],
    defaultAmount: 10
  },
};
type CurrencyCode = keyof typeof CURRENCY_CONFIG;

export default function DonatePage() {
  const navigate = useRouter();
  const handleBack = useSmartBack("/home");
  const { toast } = useToast();
  const { user } = useAuth();

  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [donationType, setDonationType] = useState<"monthly" | "one-time">("one-time");
  const [selectedTier, setSelectedTier] = useState<number | "custom">(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const lang = navigator.language || "";
      let detectedCurrency: CurrencyCode = "USD"; // Global fallback

      if (tz.includes("Kolkata") || tz.includes("Calcutta") || lang.includes("IN")) {
        detectedCurrency = "INR";
      } else if (tz.includes("London") || tz.includes("Belfast") || lang.includes("GB")) {
        detectedCurrency = "GBP";
      } else if (tz.includes("Europe") || lang.includes("FR") || lang.includes("DE") || lang.includes("IT") || lang.includes("ES")) {
        detectedCurrency = "EUR";
      }

      setCurrency(detectedCurrency);
      setSelectedTier(CURRENCY_CONFIG[detectedCurrency].defaultAmount);
    } catch (e) {
      // Ignore and fallback to default (INR/USD)
    }
  }, []);

  const currentConfig = CURRENCY_CONFIG[currency];
  const amounts = donationType === "monthly" ? currentConfig.monthlyAmounts : currentConfig.oneTimeAmounts;
  const currentAmount = selectedTier === "custom" ? Number(customAmount) : selectedTier;

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    setSelectedTier(CURRENCY_CONFIG[newCurrency].defaultAmount);
    setCustomAmount("");
  };

  const handleDonationTypeChange = (type: "monthly" | "one-time") => {
    setDonationType(type);
    const newConfig = CURRENCY_CONFIG[currency];
    const newAmounts = type === "monthly" ? newConfig.monthlyAmounts : newConfig.oneTimeAmounts;
    if (selectedTier === "custom" || !newAmounts.includes(selectedTier)) {
      setSelectedTier(newAmounts[0]);
      setCustomAmount("");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayDonate = async () => {
    if (!currentAmount || currentAmount < 1) return;

    setIsProcessingDonation(true);
    try {
      const isLoaded = await loadRazorpayScript();

      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: currentAmount, currency, donationType, useFallback: !isLoaded }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to create payment session");

      // If adblocker blocked the script OR we got a payment link fallback, redirect directly
      if (!isLoaded || data.payment_link) {
        if (data.payment_link) {
          window.location.href = data.payment_link;
        } else {
          toast({ 
            title: "Checkout Blocked", 
            description: "Please disable your adblocker or privacy shields for this site.",
            variant: "destructive" 
          });
        }
        return;
      }

      const options: any = {
        key: data.key_id,
        name: "TilawaNow",
        description: donationType === "monthly" ? "Monthly Subscription Support" : "Support TilawaNow",
        prefill: {
          name: user?.user_metadata?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#02042B",
        },
      };

      if (data.type === "subscription") {
        options.subscription_id = data.id;
        options.handler = function (response: any) {
          toast({
            title: "Subscription Successful",
            description: "Jazakallah Khair for your monthly support! May Allah reward you.",
          });
          navigate.push("/");
        };
      } else {
        options.amount = data.amount;
        options.currency = data.currency;
        options.order_id = data.id;
        options.handler = function (response: any) {
          toast({
            title: "Donation Successful",
            description: "Jazakallah Khair for your support! May Allah reward you.",
          });
          navigate.push("/");
        };
      }

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingDonation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top Header, Nav & Widget Area */}
      <div className="bg-secondary/10 border-b border-border/40 relative overflow-hidden">

        {/* ── MOBILE NAV ─────────────────────────────────── */}
        <div className="md:hidden w-full pt-5 px-4 pb-2">
          <div className="flex items-center justify-between">
            {/* Left: Back button icon + Logo */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleBack}
                className="p-1 rounded-lg text-foreground hover:bg-secondary/40 transition-colors"
                title="Return to App"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <Logo
                showText={false}
                iconClassName="w-6 h-6"
              />
            </div>

            {/* Dropdown trigger */}
            <div className="relative" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/40 border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Menu
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown panel — right-aligned */}
              {isMobileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <Link
                    href="/funding-policy"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors border-b border-border/30"
                  >
                    Funding Policy
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors border-b border-border/30"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    Contact
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── DESKTOP NAV (unchanged) ─────────────────────── */}
        <div className="hidden md:block w-full pt-6 px-4 md:px-8">
          <div className="container mx-auto max-w-7xl flex items-center justify-between relative z-20">
            {/* Left: Return */}
            <div className="flex-1">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Return to App
              </button>
            </div>

            {/* Center: Nav Links */}
            <nav className="flex-1 flex items-center justify-center gap-4 md:gap-8 text-sm font-medium text-muted-foreground">
              <Link href="/funding-policy" className="hover:text-foreground transition-colors">Funding Policy</Link>
              <Link href="/about" className="hover:text-foreground transition-colors hidden sm:block">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </nav>

            {/* Right: Sign In */}
            <div className="flex-1 flex justify-end">
              {!user && (
                <Button
                  onClick={() => navigate.push("/account")}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border/40 bg-background/50 hover:bg-background"
                >
                  Account
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 pb-12 pt-8 md:pb-24 md:pt-16 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center lg:items-start justify-between">

            {/* Left Header Text */}
            <div className="w-full lg:w-1/2 pt-4 lg:pt-12 text-left md:text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6">
                Support Core Development
              </h1>
              <div className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl mx-0 md:mx-auto lg:mx-0">
                <p className="mb-4">If every active user contributed {currentConfig.symbol}100 this month, TilawaNow would be funded for the entire year.</p>
                <p>Every donation counts. Thank you!</p>
              </div>
            </div>

            {/* Right Widget */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <div className="w-full max-w-lg bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border/40">
                {/* Type Toggle */}
                <div className="flex bg-secondary/30 p-1 rounded-xl mb-6">
                  <button
                    onClick={() => handleDonationTypeChange("monthly")}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${donationType === "monthly"
                      ? "bg-premium-accent text-white shadow-md"
                      : "text-premium-accent hover:bg-secondary/50"
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => handleDonationTypeChange("one-time")}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${donationType === "one-time"
                      ? "bg-premium-accent text-white shadow-md"
                      : "text-premium-accent hover:bg-secondary/50"
                      }`}
                  >
                    One-time
                  </button>
                </div>

                {/* Amounts Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedTier(amt);
                        setCustomAmount("");
                      }}
                      className={`py-3 px-1 rounded-lg font-bold text-sm sm:text-lg border-2 transition-all ${selectedTier === amt
                        ? "border-premium-accent bg-premium-accent text-white"
                        : "border-border/40 text-foreground hover:border-premium-accent/40 hover:bg-secondary/20"
                        }`}
                    >
                      {currentConfig.symbol} {amt}
                    </button>
                  ))}
                </div>

                <h3 className="text-xl font-medium text-foreground mb-4">
                  {donationType === "one-time" ? (
                    <>Donate, just <span className="font-bold">once</span></>
                  ) : (
                    <>Donate <span className="font-bold">monthly</span></>
                  )}
                </h3>

                {/* Action Row */}
                <div className="flex flex-row gap-2 sm:gap-4 mb-6">
                  {donationType === "one-time" && (
                    <div className="relative w-5/12 sm:w-1/3 shrink-0">
                      <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-base sm:text-lg">{currentConfig.symbol}</span>
                      <Input
                        type="number"
                        value={customAmount}
                        onChange={(e) => {
                          setSelectedTier("custom");
                          setCustomAmount(e.target.value);
                        }}
                        onFocus={() => setSelectedTier("custom")}
                        className={`pl-7 sm:pl-10 h-12 text-base sm:text-lg font-medium border-2 rounded-lg ${selectedTier === "custom" ? "border-premium-accent" : "border-border/40"
                          }`}
                        placeholder="Other"
                      />
                    </div>
                  )}

                  <Button
                    className={`flex-1 ${donationType === "one-time" ? "w-7/12 sm:w-2/3" : "w-full"} h-12 rounded-lg text-base sm:text-lg font-bold bg-[#EF4444] hover:bg-[#DC2626] text-white relative overflow-hidden transition-all shadow-md`}
                    onClick={handleRazorpayDonate}
                    disabled={isProcessingDonation || !currentAmount || currentAmount < 1}
                  >
                    {isProcessingDonation ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Heart className="absolute w-3 h-3 text-white/30 bottom-2 left-6 rotate-[-12deg]" fill="currentColor" />
                        <Heart className="absolute w-4 h-4 text-white/20 top-2 right-12 rotate-[15deg]" fill="currentColor" />
                        <Heart className="absolute w-5 h-5 text-white/20 bottom-3 right-8 rotate-[-5deg]" fill="currentColor" />
                        <span>Donate</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Footer Row */}
                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <Link href="/funding-policy" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border">
                    Funding Policy
                  </Link>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                      className="appearance-none cursor-pointer pl-3 pr-8 py-1.5 bg-secondary/20 rounded-md border border-border/40 text-xs font-bold text-foreground hover:bg-secondary/40 transition-colors outline-none focus:ring-1 focus:ring-premium-accent"
                    >
                      {Object.keys(CURRENCY_CONFIG).map((code) => (
                        <option key={code} value={code} className="bg-background text-foreground">{code}</option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-50 flex items-center justify-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    Secured by Razorpay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Content Area: Why Donate? */}
      <div className="flex-1 container mx-auto px-4 md:px-8 py-10 md:py-24 max-w-7xl">
        <div className="max-w-4xl mx-auto lg:mx-0">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8 pb-3 md:pb-4 border-b border-border/40">Why Donate?</h2>

          <div className="space-y-4 md:space-y-6 text-muted-foreground text-sm md:text-lg leading-relaxed">
            <p>
              TilawaNow is built with a simple vision: to create the most beautiful, distraction-free environment for reading and reflecting on the Qur'an.
            </p>
            <p>
              Unlike many platforms, TilawaNow is completely free of ads, tracking, and paywalls. The project was built by Muhammed Risvan over months of dedicated development and is purely community-owned and open-source.
            </p>
            <p>
              Currently, we run entirely on free-tier services (including Vercel and Supabase) and utilize the Quran.com API as our primary data source. However, as our community and traffic grow, we need to transition to paid, high-speed, and reliable infrastructure, purchase a dedicated domain, and build advanced features like personalized user dashboards.
            </p>
            <p>
              Your contribution, no matter the size, directly funds this transition and ensures this resource remains fast and accessible to the Ummah worldwide.
            </p>
          </div>

          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-1.5 md:space-y-2">
              <h4 className="font-bold text-foreground text-base md:text-lg">How do payments work, and are there refunds or tax benefits?</h4>
              <p className="text-muted-foreground text-xs md:text-base leading-relaxed">
                Payments are processed securely via Razorpay (UPI, Netbanking, and standard/international cards). Because these are voluntary tips for infrastructure costs, all contributions are final, non-refundable, and not tax-deductible (no 80G certificate).
              </p>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <h4 className="font-bold text-foreground text-base md:text-lg">Do I get premium features, and can I cancel my monthly support?</h4>
              <p className="text-muted-foreground text-xs md:text-base leading-relaxed">
                TilawaNow will always be completely free and open-source, so there are no premium features to unlock—your support just keeps the platform ad-free and fast. If you choose a monthly plan, you can cancel it at any time.
              </p>
            </div>
          </div>

          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border/40">
            <p className="font-bold text-foreground text-lg md:text-xl">Jazakallah Khair,</p>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">Muhammed Risvan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
