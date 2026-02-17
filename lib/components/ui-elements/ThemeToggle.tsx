"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useAppModeStore } from "@/lib/stores/appModeStore";

/**
 * Theme toggle that integrates with the background mode state machine.
 * 
 * State transitions:
 *   backgroundImage -> dark (always exits to dark mode)
 *   dark -> light
 *   light -> dark
 * 
 * The next-themes library is kept in sync with the backgroundMode store value.
 * When in "backgroundImage" mode, the theme is set to the CMS-specified
 * homepageBackgroundImageTheme value.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme } = useTheme();
  const { backgroundMode, toggleTheme, backgroundImageData } = useAppModeStore();

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync next-themes with backgroundMode
  useEffect(() => {
    if (!mounted) return;
    if (backgroundMode === "backgroundImage") {
      setTheme(backgroundImageData?.theme ?? "dark");
    } else {
      setTheme(backgroundMode);
    }
  }, [backgroundMode, mounted, setTheme, backgroundImageData?.theme]);

  if (!mounted) {
    return null;
  }

  const isDark = backgroundMode === "dark" || 
    (backgroundMode === "backgroundImage" && (backgroundImageData?.theme ?? "dark") === "dark");

  return (
    <div className="safe-area-content fixed bottom-40 right-4 md:bottom-4 md:right-6 z-50 flex items-center gap-2 rounded-full py-2">
      <div
        onClick={toggleTheme}
        className="cursor-pointer"
      >
        {isDark ? <MoonIcon className="text-foreground" /> : <SunIcon className="text-foreground" />}
      </div>
    </div>
  );
}
