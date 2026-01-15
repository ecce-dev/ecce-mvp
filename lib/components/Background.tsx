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

  // Use black logo as default during SSR, then switch based on theme
  const logoSrc = mounted && resolvedTheme === "dark" 
    ? "/ecce_logo_white.svg" 
    : "/ecce_logo_black.svg";

  return (
    <div className="safe-area-content fixed inset-0 z-1">
      <div className="h-full w-full flex flex-col justify-end items-center p-8">
        <Image
          src={logoSrc}
          alt="Background"
          width={420}
          height={420}
        />
      </div>
    </div>
  );
}