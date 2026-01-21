"use client"

import { cn } from "@/lib/utils/utils"
import { useEcceDialog } from "./EcceDialogContext"
import {
  ecceTriggerVariants,
  type EcceTriggerVariantProps,
  type EccePositioningProps,
  hasPositionProps,
  getPositionStyles,
  getTriggerSpanTranslateClass,
} from "./ecceTriggerVariants"

export type EcceDialogTriggerProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> &
  EcceTriggerVariantProps &
  EccePositioningProps & {
    /** Unique ID to link this trigger to its content */
    dialogId: string
    /** Optional callback when trigger is clicked (in addition to toggle) */
    onClick?: () => void
    /** Whether to render as a child component */
    asChild?: boolean
  }

/**
 * ECCE Dialog Trigger button
 * Toggles the associated dialog content on click
 * Active state shows inverted colors (black bg, white text)
 * 
 * Positioning modes:
 * - With position props (top/right/bottom/left): Uses fixed positioning
 * - Without position props: Uses static positioning (for flex/grid containers)
 */
export function EcceDialogTrigger({
  className,
  variant,
  dialogId,
  top,
  right,
  bottom,
  left,
  onClick,
  children,
  asChild = false,
  ...props
}: EcceDialogTriggerProps) {
  const { isDialogOpen, toggleDialog } = useEcceDialog()
  const isActive = isDialogOpen(dialogId)

  const positionProps = { top, right, bottom, left }
  const hasPosition = hasPositionProps(positionProps)
  const positionStyles = getPositionStyles(positionProps)

  const handleClick = () => {
    // Call optional onClick callback first (for analytics, etc.)
    onClick?.()
    // Then toggle the dialog
    toggleDialog(dialogId)
  }

  const extraClassesZangeziFont = getTriggerSpanTranslateClass(variant)

  return (<>
    {!asChild ? (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          ecceTriggerVariants({ variant }),
          hasPosition && "fixed",
          isActive
            ? "bg-foreground text-background"
            : "bg-background/70 text-foreground hover:bg-background/90",
          className
        )}
        style={positionStyles}
        data-active={isActive}
        {...props}
      >
        <span className={cn("inline-block", extraClassesZangeziFont)}>
          {children}
        </span>
      </button>
    ) : (
      <div
        onClick={handleClick}
      >
        {children}
      </div>
    )}
  </>
  )
}
