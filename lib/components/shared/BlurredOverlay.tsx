"use client"

import { useEcceDialog } from "@/lib/components/ecce-elements"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { cn } from "@/lib/utils/utils"

/**
 * Blurred overlay that appears when certain dialogs are open:
 * - Submit Request dialog
 * - Login (Research Access) modal
 * 
 * Positioned at z-75 (above canvas at z-10, below UI elements at z-100).
 * Uses backdrop blur and semi-transparent background for a glass effect.
 * 
 * Clicking on the overlay closes the dialog while preserving form state
 * (the form component stays mounted, so React Hook Form retains the values).
 */
export function BlurredOverlay() {
  const { isDialogOpen, closeDialog } = useEcceDialog()
  const isSubmitRequestOpen = isDialogOpen("submit-request")
  
  const isLoginModalOpen = useAppModeStore((state) => state.isLoginModalOpen)
  const setLoginModalOpen = useAppModeStore((state) => state.setLoginModalOpen)

  const isVisible = isSubmitRequestOpen || isLoginModalOpen

  const handleClick = () => {
    if (isSubmitRequestOpen) {
      closeDialog("submit-request")
    }
    if (isLoginModalOpen) {
      setLoginModalOpen(false)
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-75 transition-all duration-300",
        isVisible
          ? "opacity-100 backdrop-blur-sm bg-background/70 pointer-events-auto cursor-pointer"
          : "opacity-0 pointer-events-none"
      )}
      onClick={handleClick}
      aria-hidden="true"
    />
  )
}
