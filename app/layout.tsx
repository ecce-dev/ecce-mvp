import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { zangezi, zangeziCondensed } from "@/lib/fonts/zangezi";
// Import critical CSS - Next.js will optimize and minimize automatically
import "./globals.css";
// wpAcfWysiwyg.css is deferred - loaded dynamically when content is rendered
// This prevents it from blocking initial render (saves ~160ms)
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import dynamic from "next/dynamic";

// Lazy load CookieBanner - not needed for initial render
// Note: Component is already client-side only (uses hooks), so no ssr needed
const CookieBanner = dynamic(() => 
  import("@/lib/components/util/CookieBanner").then(mod => ({ default: mod.CookieBanner }))
);


const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400"], // Only load regular weight initially - defer others
  display: "swap", // Critical: don't block rendering - use fallback font immediately
  preload: false, // Defer font preload to avoid blocking
  adjustFontFallback: true, // Better fallback rendering
  fallback: ["monospace", "system-ui"], // Fast fallback fonts
});


export const metadata: Metadata = {
  title: "ecce",
  description: "\"I will not compare my insides to their outsides.\"",
  icons: {
    icon: "/app-assets/android-chrome-512x512.png",
    apple: "/app-assets/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ecce",
  },
  openGraph: {
    title: "ecce",
    description: "\"I will not compare my insides to their outsides.\"",
  },
  // SEO: Allow search engines to index the page
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Performance optimizations
  other: {
    "dns-prefetch": "https://archive.ecce.ing",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000619",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical logo for faster LCP - highest priority */}
        <link
          rel="preload"
          href="/ecce_logo_black.svg"
          as="image"
          fetchPriority="high"
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://archive.ecce.ing" />
        {/* Defer WYSIWYG CSS loading - prevents blocking initial render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Load WYSIWYG CSS asynchronously after page load
                // Uses the "print" media trick to load without blocking render
                function loadWysiwygCSS() {
                  if (document.querySelector('link[data-wysiwyg-css]')) return;
                  
                  const link = document.createElement('link');
                  link.rel = 'stylesheet';
                  link.setAttribute('data-wysiwyg-css', 'true');
                  link.media = 'print'; // Load with low priority
                  link.onload = function() {
                    link.media = 'all'; // Switch to all once loaded
                  };
                  
                  // Find Next.js base path
                  const scripts = document.querySelectorAll('script[src*="_next"]');
                  if (scripts.length > 0) {
                    const scriptSrc = scripts[0].getAttribute('src') || '';
                    const basePath = scriptSrc.substring(0, scriptSrc.lastIndexOf('/_next') + 6);
                    link.href = basePath + '/static/css/app/wpAcfWysiwyg.css';
                  } else {
                    link.href = '/_next/static/css/app/wpAcfWysiwyg.css';
                  }
                  
                  document.head.appendChild(link);
                }
                
                // Load after page is interactive
                if (document.readyState === 'complete') {
                  setTimeout(loadWysiwygCSS, 0);
                } else {
                  window.addEventListener('load', function() {
                    setTimeout(loadWysiwygCSS, 0);
                  }, { once: true });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${ibmPlexMono.variable} ${zangezi.variable} ${zangeziCondensed.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Safe area overlay for mobile PWA */}
          <div className="safe-area-overlay" />
          <div className="safe-area-overlay-bottom" />
          <QueryProvider>
            {children}
            <CookieBanner />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
