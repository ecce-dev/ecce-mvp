import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "ecce",
  description: "Discover ecce.",
  icons: {
    icon: "/favicon/android-chrome-512x512.png",
    apple: "/favicon/apple-touch-icon.png",
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
    <html lang="en">
      <body
        className={`${ibmPlexMono.variable} ${ibmPlexSerif.variable} antialiased`}
      >
        {/* Safe area overlay for mobile PWA */}
        <div className="safe-area-overlay" />
        <div className="safe-area-overlay-bottom" />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
