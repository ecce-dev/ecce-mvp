import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'archive.ecce.ing',
      },
    ],
    // Performance optimizations
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  turbopack: {},
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Exclude Next.js devtools from production bundle
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Exclude Next.js devtools from production client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@next/devtools': false,
      };
    }
    return config;
  },
  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@phosphor-icons/react',
      'lucide-react',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Proxy WordPress uploads through Next.js to avoid CORS issues with GLB files
        source: '/wp-content/uploads/:path*',
        destination: 'https://archive.ecce.ing/wp-content/uploads/:path*',
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
});

export default pwaConfig(nextConfig);
