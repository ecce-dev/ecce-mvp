"use client";

import Image from "next/image";
import { useAppModeStore } from "@/lib/stores/appModeStore";
import { useDevice } from "@/lib/hooks/useDevice";

/**
 * Background component that handles two visual layers:
 * 
 * 1. Logo: Always visible at the bottom center, themed by dark/light mode.
 * 2. Background image: Full-screen blurred image, only visible in "backgroundImage" mode.
 *    Uses object-fit: cover for responsive filling. Positioning is controlled via
 *    WordPress CMS values (object-position) with separate desktop/mobile support.
 * 
 * The logo sits on top of the blurred image via z-index layering.
 */
export default function Background() {
  const { backgroundMode, backgroundImageData, selectedGarment } = useAppModeStore();
  const { deviceType } = useDevice();

  // No background image when a garment is selected (encounter/engage mode)
  const showBackgroundImage =
    backgroundMode === "backgroundImage" && !!backgroundImageData?.imageUrl && !selectedGarment;

  const desktopPosition = backgroundImageData?.positioning ?? "center center";
  const mobilePosition = backgroundImageData?.positioningMobile ?? desktopPosition;

  // Use mobile positioning on mobile devices, desktop positioning otherwise
  const effectivePosition = deviceType === "mobile" ? mobilePosition : desktopPosition;

  return (
    <div className="safe-area-content fixed inset-0 z-1">
      {/* Blurred background image layer */}
      {showBackgroundImage && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={backgroundImageData.imageUrl!}
            alt={backgroundImageData.altText ?? ""}
            className="h-full w-full object-cover blur-lg scale-115"
            style={{ objectPosition: effectivePosition }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Logo layer - always visible on top */}
      <div className="relative z-10 h-full w-full flex flex-col justify-end items-center p-8">
        {/* Black logo - visible by default (light mode) - LCP element */}
        <Image
          src="/ecce_logo_black.svg"
          alt="ecce"
          width={420}
          height={420}
          priority
          loading="eager"
          fetchPriority="high"
          className="dark:hidden"
        />
        {/* White logo - for dark mode */}
        <Image
          src="/ecce_logo_white.svg"
          alt="ecce"
          width={420}
          height={420}
          loading="lazy"
          fetchPriority="low"
          className="hidden dark:block"
        />
      </div>
    </div>
  );
}
