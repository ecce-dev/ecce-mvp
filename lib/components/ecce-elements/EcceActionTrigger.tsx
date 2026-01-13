"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/utils"

const ecceActionTriggerVariants = cva(
  "px-4 pt-1 md:py-2 text-sm md:text-md lg:text-xl border border-black cursor-pointer transition-colors duration-200 z-100 bg-white/70 text-black disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "font-zangezi uppercase",
        secondary: "font-ibm-plex-mono py-1",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

export type EcceActionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof ecceActionTriggerVariants> & {
    /** Fixed position from top (enables fixed positioning mode) */
    top?: string
    /** Fixed position from right */
    right?: string
    /** Fixed position from bottom */
    bottom?: string
    /** Fixed position from left */
    left?: string
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
  // Only apply fixed positioning if any position prop is provided
  const hasPositionProps = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  const positionStyles = hasPositionProps
    ? { top, right, bottom, left }
    : undefined

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onAction?.()
    onClick?.(e)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        ecceActionTriggerVariants({ variant }),
        hasPositionProps && "fixed",
        className,
      )}
      style={positionStyles}
      {...props}
    >
      <span className={cn("inline-block", variant === "primary" ? "translate-y-[0px] md:translate-y-[2px]" : "")}>
        {children}
      </span>
    </button>
  )
}

