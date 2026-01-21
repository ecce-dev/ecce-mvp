"use client"

import { cn } from "@/lib/utils/utils"
import {
  ecceTriggerVariants,
  type EcceTriggerVariantProps,
  type EccePositioningProps,
  hasPositionProps,
  getPositionStyles,
  getTriggerSpanTranslateClass,
} from "./ecceTriggerVariants"

export type EcceActionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  EcceTriggerVariantProps &
  EccePositioningProps & {
    /** Action to perform on click */
    onAction?: () => void
  }

/**
 * ECCE Action Trigger button
 * A standalone button that fires an action without opening a dialog
 * 
 * Positioning modes:
 * - With position props (top/right/bottom/left): Uses fixed positioning
 * - Without position props: Uses static positioning (for flex/grid containers)
 */
export function EcceActionTrigger({
  className,
  variant,
  top,
  right,
  bottom,
  left,
  onAction,
  children,
  onClick,
  ...props
}: EcceActionTriggerProps) {
  const positionProps = { top, right, bottom, left }
  const hasPosition = hasPositionProps(positionProps)
  const positionStyles = getPositionStyles(positionProps)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onAction?.()
    onClick?.(e)
  }

  const extraClassesZangeziFont = getTriggerSpanTranslateClass(variant)

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        ecceTriggerVariants({ variant }),
        "bg-background/70 disabled:opacity-50 disabled:cursor-not-allowed",
        hasPosition && "fixed",
        className,
      )}
      style={positionStyles}
      {...props}
    >
      <span className={cn("inline-block", extraClassesZangeziFont)}>
        {children}
      </span>
    </button>
  )
}

