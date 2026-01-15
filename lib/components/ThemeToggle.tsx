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
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-card/80 px-3 py-2 shadow-lg backdrop-blur-sm">
        <span className="text-xs text-muted-foreground">Light</span>
        <Switch disabled />
        <span className="text-xs text-muted-foreground">Dark</span>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-3 py-2">
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
