import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { zangezi, zangeziCondensed } from "@/lib/fonts/zangezi";
import "./globals.css";
import "./wpAcfWysiwyg.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { CookieBanner } from "@/lib/components/CookieBanner";


const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "ecce",
  description: "Discover ecce.",
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
    description: "Discover ecce.",
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
