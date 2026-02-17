"use client";

import { useAppModeStore } from "@/lib/stores/appModeStore";
import { useEcceDialog } from "@/lib/components/ecce-elements/EcceDialogContext";
import { cn } from "@/lib/utils/utils";
import { ApertureIcon } from "@phosphor-icons/react";

export function ApertureToggle() {
  const { backgroundMode, isDetailOverlayOpen, showGarmentCopyright, selectedGarment, toggleAperture, setShowGarmentCopyright } = useAppModeStore();
  const { closeDialog } = useEcceDialog();

  // Hide aperture toggle when a garment is selected (encounter/engage mode)
  if (selectedGarment) return null;

  const isActive = backgroundMode === "backgroundImage" && isDetailOverlayOpen;

  const handleClick = () => {
    closeDialog("legalRights");
    if (showGarmentCopyright) setShowGarmentCopyright(false);
    toggleAperture();
  };

  return (
    <div className="safe-area-content fixed bottom-64 right-4 md:bottom-28 md:right-6 z-50 flex items-center gap-2 rounded-full py-2">
      <button
        onClick={handleClick}
        className={cn(
          "pointer-events-auto bg-transparent border-0 p-0 m-0 text-base text-foreground leading-none"
        )}
        aria-label="Toggle background image"
      >
        <ApertureIcon
          className={cn(
            "cursor-pointer rounded-full h-6 w-6 p-1 translate-x-1 translate-y-1",
            isActive && "bg-foreground text-background"
          )}
        />
      </button>
    </div>
  );
}
