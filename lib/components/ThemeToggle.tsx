"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/lib/components/ui/switch";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className="fixed bottom-40 right-8 md:bottom-4 md:right-6 z-50 flex items-center gap-2 rounded-full py-2">
      {/* <span className="text-xs text-muted-foreground">Light</span> */}
      {/* <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      /> */}
      <div
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="cursor-pointer"
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </div>
      {/* <span className="text-xs text-muted-foreground">Dark</span> */}
    </div>
  );
}
