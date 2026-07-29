/**
 * TilawaNow - A modern Quran platform.
 * Copyright (c) 2026 Muhammed Risvan.
 * Licensed under the GNU Affero General Public License v3.0.
 */

"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { PopularSurahsSection } from "@/components/landing/PopularSurahsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { QuickStartSection } from "@/components/landing/QuickStartSection";
import { HighlightedAyahSection } from "@/components/landing/HighlightedAyahSection";
import { CTASection } from "@/components/landing/CTASection";
import { OpenSourceSection } from "@/components/landing/OpenSourceSection";
import { AppDownloadSection } from "@/components/landing/AppDownloadSection";
import { Footer } from "@/components/layout/Footer";

const Landing = () => {
  return (
    <div className="theme-premium-gray min-h-screen bg-background">
      <HeroSection />
      <StatsSection />
      <PopularSurahsSection />
      <FeaturesSection />
      <QuickStartSection />
      <HighlightedAyahSection />
      <OpenSourceSection />
      <CTASection />
      <AppDownloadSection />
      <Footer />
    </div>
  );
};

export default Landing;
