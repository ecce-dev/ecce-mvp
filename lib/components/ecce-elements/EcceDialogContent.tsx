"use client"

import { useTransition, animated } from "@react-spring/web"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useEcceDialog } from "./EcceDialogContext"
import { transitionConfig } from "./transition-config"
import {
  type EccePositioningProps,
  hasPositionProps,
  getPositionStyles,
} from "./ecceTriggerVariants"

export type EcceDialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Unique ID to link this content to its trigger */
  dialogId: string
  /** Whether to show the close icon */
  closeIcon?: boolean
  /** Max height before content becomes scrollable. Use "full" to inherit from parent container */
  maxHeight?: string
} & EccePositioningProps

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
  closeIcon = false,
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

  const positionProps = { top, right, bottom, left }
  const hasPosition = hasPositionProps(positionProps)
  const basePositionStyles = getPositionStyles(positionProps)

  const transitions = useTransition(isOpen, transitionConfig)

  const positionStyles = {
    ...basePositionStyles,
    maxHeight,
  }

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
            "z-100 max-w-[420px] bg-background/70 border border-foreground p-8 overflow-y-auto w-full",
            hasPosition && "fixed",
            className
          )}
          {...props}
        >
          {closeIcon && <>
            <button
              type="button"
              onClick={() => closeDialog(dialogId)}
              className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Close"
            >
              <XIcon className="size-5" size={20} />
            </button>
          </>}
          <div className="">{children}</div>
        </animated.div>
      )
  )
}

