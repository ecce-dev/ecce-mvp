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
 * - Image in a bordered frame (max-width/max-height constrained per breakpoint)
 * - Small gap between image and text (background visible through the gap)
 * - Text box below, same width as image via flex layout (no JS sync)
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
          {/* Wrapper: width = image container; text box matches via w-full; align block to the right */}
          <div className="flex flex-col items-end gap-2 w-max max-w-[280px] md:max-w-[500px] self-end">
            {/* Image frame — shrink-wraps image exactly; max dimensions constrain the image; align right */}
            <div className="w-fit max-w-[280px] max-h-[400px] md:max-w-[500px] lg:max-h-[600px] bg-background/70 border border-foreground overflow-hidden ml-auto">
              <Image
                src={backgroundImageData.imageUrl}
                alt={backgroundImageData.altText ?? "Background image"}
                width={0}
                height={0}
                sizes="(max-width: 768px) 260px, 320px"
                className="max-w-[280px] max-h-[400px] md:max-w-[500px] lg:max-h-[600px] w-auto h-auto block object-contain"
              />
            </div>

            {/* Text caption — w-0 min-w-full so wrapper width = image only; text box then fills that width */}
            {backgroundImageData.text && (
              <div className="w-0 min-w-full max-h-18 overflow-y-auto overflow-x-hidden bg-background/70 border border-foreground p-4 break-words">
                <div
                  className="text-xs leading-relaxed text-foreground prose prose-sm wpAcfWysiwyg break-words"
                  dangerouslySetInnerHTML={{
                    __html: addTargetBlankToLinks(backgroundImageData.text),
                  }}
                />
              </div>
            )}
          </div>
        </animated.div>
      )
  );
}
