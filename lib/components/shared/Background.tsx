"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Background() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always show black logo initially (SSR and first render) for faster LCP
  // Switch to white only after hydration if dark theme is detected
  // This ensures the image is available immediately without waiting for theme detection
  const logoSrc = mounted && resolvedTheme === "dark" 
    ? "/ecce_logo_white.svg" 
    : "/ecce_logo_black.svg";

  return (
    <div className="safe-area-content fixed inset-0 z-1">
      <div className="h-full w-full flex flex-col justify-end items-center p-8">
        {/* Show black logo immediately, switch to white after hydration if needed */}
        <Image
          src={logoSrc}
          alt="Background"
          width={420}
          height={420}
          priority
          loading="eager"
          fetchPriority="high"
          // Preload both variants to avoid layout shift on theme switch
          onLoad={() => {
            // Preload the other variant in the background
            if (typeof window !== 'undefined') {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.as = 'image';
              link.href = resolvedTheme === "dark" ? "/ecce_logo_black.svg" : "/ecce_logo_white.svg";
              document.head.appendChild(link);
            }
          }}
        />
      </div>
    </div>
  );
}