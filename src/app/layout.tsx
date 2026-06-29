/**
 * TilawaNow - A modern Quran platform.
 * Copyright (c) 2026 Muhammed Risvan.
 * Licensed under the GNU Affero General Public License v3.0.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/Providers";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Analytics } from "@vercel/analytics/react";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://tilawanow.vercel.app"),
  title: "TilawaNow",
  description: "Read, listen, and reflect on the Holy Quran through a modern and respectful digital experience.",
  icons: {
    icon: "/icon for app.png",
    apple: "/icon for app.png",
  },
  openGraph: {
    title: "TilawaNow",
    description: "A modern Quran platform to read, listen, and understand the Quran with clarity and ease.",
    url: "https://tilawanow.vercel.app",
    siteName: "TilawaNow",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TilawaNow",
    description: "Read, listen, and reflect on the Holy Quran through a modern and respectful digital experience.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "ocIOVZe3l3sNdnDfLVN2NRpcLTvCQXF1MY37V4slakk",
  },
  manifest: "/manifest.webmanifest",
};

import Script from "next/script"; // 1. Add this import at the top of your file

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://verses.quran.com" />
        <link rel="preconnect" href="https://api.quran.com" />
        <link rel="dns-prefetch" href="https://verses.quran.com" />
        <link rel="dns-prefetch" href="https://api.quran.com" />
        <link rel="preload" as="image" href="/hero_section.webp" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
        <Analytics />

        {/* 2. Add the Google Search Brand Schema right here */}
        <Script
          id="schema-org-branding"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TilawaNow",
              "url": "https://tilawanow.vercel.app",
            }),
          }}
        />
      </body>
    </html>
  );
}
