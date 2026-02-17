"use client";

import Image from "next/image";
import { useTransition, animated } from "@react-spring/web";
import { useAppModeStore } from "@/lib/stores/appModeStore";
import { addTargetBlankToLinks } from "@/lib/utils/utils";
import { transitionConfig } from "@/lib/components/ecce-elements/transition-config";

/**
 * Overlay that displays the background image without blur and its associated text.
 * Positioned bottom-right, to the left of the UI toggle buttons.
 * Only visible when in backgroundImage mode and the detail overlay is open.
 *
 * Layout:
 * - Image in a bordered frame (max-width constrained)
 * - Small gap between image and text (background visible through the gap)
 * - Text box below, can be wider than the image
 * - Both anchored to the bottom-right, no scrolling
 *
 * Styled consistently with EcceDialogContent:
 * - Sharp corners (no rounded)
 * - bg-background/70 semi-transparent background
 * - border border-foreground
 * - react-spring fade transition
 */
export function BackgroundImageDetailOverlay() {
  const { isDetailOverlayOpen, backgroundMode, backgroundImageData, selectedGarment } = useAppModeStore();

  // Hidden when a garment is selected (encounter/engage mode)
  const isVisible =
    isDetailOverlayOpen &&
    backgroundMode === "backgroundImage" &&
    !!backgroundImageData?.imageUrl &&
    !selectedGarment;

  const transitions = useTransition(isVisible, transitionConfig);

  return transitions(
    (styles, item) =>
      item &&
      backgroundImageData?.imageUrl && (
        <animated.div
          style={styles}
          className="safe-area-content fixed bottom-40 top-50 md:top-24 md:bottom-42 right-14 md:right-20 z-40 pointer-events-auto flex flex-col items-end justify-end gap-2"
        >
          {/* Image frame — image fits within max dimensions per breakpoint, preserving proportions */}
          <div className="max-w-[280px] max-h-[400px] md:max-w-[500px] lg:max-h-[600px] bg-background/70 border border-foreground flex items-center justify-center overflow-hidden">
            <Image
              src={backgroundImageData.imageUrl}
              alt={backgroundImageData.altText ?? "Background image"}
              width={0}
              height={0}
              sizes="(max-width: 768px) 260px, 320px"
              className="max-w-full max-h-full w-auto h-auto block object-contain"
            />
          </div>

          {/* Text caption — separate element, can be wider than the image */}
          {backgroundImageData.text && (
            <div className="max-w-[300px] max-h-16 overflow-y-auto md:max-h-none md:max-w-[700px] lg:max-w-[800px] bg-background/70 border border-foreground p-4">
              <div
                className="text-xs leading-relaxed text-foreground prose prose-sm wpAcfWysiwyg"
                dangerouslySetInnerHTML={{
                  __html: addTargetBlankToLinks(backgroundImageData.text),
                }}
              />
            </div>
          )}
        </animated.div>
      )
  );
}
