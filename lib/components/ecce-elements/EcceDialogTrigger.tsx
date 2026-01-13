"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/utils"
import { useEcceDialog } from "./EcceDialogContext"

const ecceDialogTriggerVariants = cva(
  "px-4 py-1 md:py-2 text-sm md:text-md lg:text-xl border border-black cursor-pointer transition-colors duration-200 z-100",
  {
    variants: {
      variant: {
        primary: "font-zangezi uppercase pt-1 pb-0 md:pt-3 ",
        secondary: "font-ibm-plex-mono",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

export type EcceDialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof ecceDialogTriggerVariants> & {
    /** Unique ID to link this trigger to its content */
    dialogId: string
    /** Fixed position from top (enables fixed positioning mode) */
    top?: string
    /** Fixed position from right */
    right?: string
    /** Fixed position from bottom */
    bottom?: string
    /** Fixed position from left */
    left?: string
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
  children,
  ...props
}: EcceDialogTriggerProps) {
  const { isDialogOpen, toggleDialog } = useEcceDialog()
  const isActive = isDialogOpen(dialogId)

  // Only apply fixed positioning if any position prop is provided
  const hasPositionProps = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined
  
  const positionStyles = hasPositionProps
    ? { top, right, bottom, left }
    : undefined

  return (
    <button
      type="button"
      onClick={() => toggleDialog(dialogId)}
      className={cn(
        ecceDialogTriggerVariants({ variant }),
        hasPositionProps && "fixed",
        isActive
          ? "bg-black text-white"
          : "bg-white/70 text-black hover:bg-white/90",
        className
      )}
      style={positionStyles}
      data-active={isActive}
      {...props}
    >
      <span className={cn("inline-block", variant === "primary" ? "translate-y-[0px] md:translate-y-[1px]" : "")}>
        {children}
      </span>
    </button>
  )
}

