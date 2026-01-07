import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.ecce.ing',
      },
    ],
  },
  turbopack: {},
  async rewrites() {
    return [
      {
        // Proxy WordPress uploads through Next.js to avoid CORS issues with GLB files
        source: '/wp-content/uploads/:path*',
        destination: 'https://admin.ecce.ing/wp-content/uploads/:path*',
      },
      // Proxy PostHog requests to avoid ad blockers
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
