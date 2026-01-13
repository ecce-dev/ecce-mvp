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
}: EcceUnifiedDialogRendererProps) {
  const { openDialogId, closeDialog } = useEcceDialog()

  // Only apply fixed positioning if any position prop is provided
  const hasPositionProps = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  // Single transition that manages ALL dialogs
  // The key is the dialogId - when it changes, exit current, then enter new
  const transitions = useTransition(openDialogId, transitionConfig)

  const positionStyles = hasPositionProps
    ? { top, right, bottom, left, maxHeight }
    : { maxHeight }

  return transitions((styles, dialogId) => {
    // Don't render if no dialog is open or dialog doesn't exist
    if (!dialogId || !dialogs[dialogId]) return null

    const dialog = dialogs[dialogId]

    return (
      <animated.div
        style={{
          ...styles,
          ...positionStyles,
        }}
        className={cn(
          "z-100 max-w-[420px] bg-white/70 border border-black p-8 overflow-y-auto",
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
        <div className="pr-8">{dialog.content}</div>
      </animated.div>
    )
  })
}
