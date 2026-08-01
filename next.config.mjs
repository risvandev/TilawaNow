/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "verses.quran.com",
      },
      {
        protocol: "https",
        hostname: "audio.qurancdn.com",
      },
      {
        protocol: "https",
        hostname: "api.quran.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      }
    ],
  },
  typescript: {
    // Re-enabled for production readiness
    ignoreBuildErrors: false, 
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'none'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.puter.com https://va.vercel-scripts.com https://*.razorpay.com blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://verses.quran.com https://api.quran.com https://raw.githubusercontent.com https://lh3.googleusercontent.com https://*.supabase.co https://audio.qurancdn.com",
              "connect-src 'self' https://*.quran.com https://*.qurancdn.com https://*.supabase.co wss://*.supabase.co https://*.puter.com wss://*.puter.com https://*.puter.io wss://*.puter.io https://api.puter.com wss://api.puter.com https://vitals.vercel-insights.com https://*.razorpay.com",
              "font-src 'self' data:",
              "frame-ancestors 'self'",
              "frame-src 'self' https://*.razorpay.com",
              "media-src 'self' blob: data: https://*.quran.com https://*.qurancdn.com https://*.supabase.co",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "manifest-src 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
