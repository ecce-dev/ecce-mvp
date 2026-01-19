"use client";

import { NumberOneIcon, NumberTwoIcon } from "@phosphor-icons/react";
import { useAppModeStore } from "@/lib/stores/appModeStore";

export function AnimationToggle() {
  const { selectionAnimationMode, setSelectionAnimationMode } = useAppModeStore();

  const isCarousel = selectionAnimationMode === "carousel";

  const handleToggle = () => {
    setSelectionAnimationMode(isCarousel ? "camera" : "carousel");
  };

  return (
    <div className="fixed bottom-48 md:bottom-4 right-6 md:right-14 z-50 hidden md:flex items-center gap-2 rounded-full py-2">
      <div
        onClick={handleToggle}
        className="cursor-pointer"
        aria-label={`Switch to ${isCarousel ? "camera" : "carousel"} animation mode`}
        title={`Current: ${selectionAnimationMode} mode`}
      >
        {!isCarousel ? <NumberTwoIcon /> : <NumberOneIcon />}
      </div>
    </div>
  );
}
