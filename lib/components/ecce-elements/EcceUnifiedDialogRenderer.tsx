"use client"

import { type ReactNode } from "react"
import { useTransition, animated } from "@react-spring/web"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useEcceDialog } from "./EcceDialogContext"
import { transitionConfig } from "./transition-config"

export interface DialogConfig {
  /** Title for the dialog (optional, for accessibility) */
  title?: string
  /** Content to render inside the dialog */
  content: ReactNode
}

export type EcceUnifiedDialogRendererProps = {
  /** Map of dialogId to dialog configuration */
  dialogs: Record<string, DialogConfig>
  /** Additional class names for the dialog container */
  className?: string
  /** Fixed position from top (enables fixed positioning mode) */
  top?: string
  /** Fixed position from right */
  right?: string
  /** Fixed position from bottom */
  bottom?: string
  /** Fixed position from left */
  left?: string
  /** Max height before content becomes scrollable */
  maxHeight?: string
  /** Optional key to force content refresh (e.g., garment slug) */
  contentKey?: string
}

/**
 * ECCE Unified Dialog Renderer
 * 
 * Uses a SINGLE useTransition to manage all dialogs, ensuring:
 * - Only one dialog animates at a time
 * - Exit animation completes before enter animation starts
 * - No layout shifts when switching between dialogs
 * 
 * This replaces multiple independent EcceDialogContent components
 * with a single coordinated transition system.
 */
export function EcceUnifiedDialogRenderer({
  dialogs,
  className,
  top,
  right,
  bottom,
  left,
  maxHeight = "100%",
  contentKey,
}: EcceUnifiedDialogRendererProps) {
  const { openDialogId, closeDialog } = useEcceDialog()

  // Only apply fixed positioning if any position prop is provided
  const hasPositionProps = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  // Combine dialogId with contentKey to force re-render when content changes
  // This ensures the dialog content updates when switching garments
  const transitionKey = openDialogId ? (contentKey ? `${openDialogId}-${contentKey}` : openDialogId) : null

  // Single transition that manages ALL dialogs
  // The key includes contentKey so changing garments triggers a re-render
  const transitions = useTransition(transitionKey, transitionConfig)

  const positionStyles = hasPositionProps
    ? { top, right, bottom, left, maxHeight }
    : { maxHeight }

  return transitions((styles, compositeKey) => {
    // Don't render if no dialog is open
    if (!compositeKey) return null

    // Extract the dialogId from the composite key (format: "dialogId" or "dialogId-contentKey")
    const dialogId = contentKey && compositeKey.includes("-") 
      ? compositeKey.split("-")[0] 
      : compositeKey

    // Don't render if dialog doesn't exist
    if (!dialogs[dialogId]) return null

    const dialog = dialogs[dialogId]

    return (
      <animated.div
        style={{
          ...styles,
          ...positionStyles,
        }}
        className={cn(
          "z-100 max-w-[420px w-full bg-background/70 border border-foreground p-8 overflow-y-auto",
          hasPositionProps && "fixed",
          className
        )}
        role="dialog"
        aria-label={dialog.title}
      >
        {/* <button
          type="button"
          onClick={() => closeDialog(dialogId)}
          className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Close"
        >
          <XIcon className="size-5" />
        </button> */}
        <div className="w-full">{dialog.content}</div>
      </animated.div>
    )
  })
}
