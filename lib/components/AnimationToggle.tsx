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
    <div className="fixed bottom-4 right-12 z-50 flex items-center gap-2 rounded-full px-3 py-2">
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
