"use client"

import { useTransition, animated } from "@react-spring/web"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useEcceDialog } from "./EcceDialogContext"
import { transitionConfig } from "./transition-config"

export type EcceDialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Unique ID to link this content to its trigger */
  dialogId: string
  /** Fixed position from top (enables fixed positioning mode) */
  top?: string
  /** Fixed position from right */
  right?: string
  /** Fixed position from bottom */
  bottom?: string
  /** Fixed position from left */
  left?: string
  /** Max height before content becomes scrollable. Use "full" to inherit from parent container */
  maxHeight?: string
}

/**
 * ECCE Dialog Content
 * Displays content with react-spring animations
 * 
 * Positioning modes:
 * - With position props (top/right/bottom/left): Uses fixed positioning
 * - Without position props: Uses static positioning (for flex/grid containers)
 */
export function EcceDialogContent({
  className,
  dialogId,
  top,
  right,
  bottom,
  left,
  maxHeight = "100%",
  children,
  ...props
}: EcceDialogContentProps) {
  const { isDialogOpen, closeDialog } = useEcceDialog()
  const isOpen = isDialogOpen(dialogId)

  // Only apply fixed positioning if any position prop is provided
  const hasPositionProps = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  const transitions = useTransition(isOpen, transitionConfig)

  const positionStyles = hasPositionProps
    ? { top, right, bottom, left, maxHeight }
    : { maxHeight }

  return transitions(
    (styles, item) =>
      item && (
        <animated.div
          style={{ 
            ...styles, 
            ...positionStyles,
          }}
          className={cn(
            // Base styles
            "z-100 max-w-[420px] bg-white/70 border border-black p-8 overflow-y-auto",
            hasPositionProps && "fixed",
            className
          )}
          {...props}
        >
          {/* <button
            type="button"
            onClick={() => closeDialog(dialogId)}
            className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Close"
          >
            <XIcon className="size-5" size={20} />
          </button> */}
          <div className="">{children}</div>
        </animated.div>
      )
  )
}

