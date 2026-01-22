import { cva, type VariantProps } from "class-variance-authority"

/**
 * Shared variant definitions for ECCE trigger components
 * Provides consistent styling across EcceDialogTrigger and EcceActionTrigger
 */
export const ecceTriggerVariants = cva(
  "px-4 py-1 md:py-2 text-sm md:text-md lg:text-xl border border-foreground cursor-pointer transition-colors duration-200 z-100 text-foreground",
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

export type EcceTriggerVariantProps = VariantProps<typeof ecceTriggerVariants>

/**
 * Shared positioning props interface
 */
export type EccePositioningProps = {
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
 * Determines if any position props are provided
 * @param props - Positioning props object
 * @returns true if any position prop is defined
 */
export function hasPositionProps(props: EccePositioningProps): boolean {
  return props.top !== undefined || 
         props.right !== undefined || 
         props.bottom !== undefined || 
         props.left !== undefined
}

/**
 * Extracts position styles from props
 * @param props - Positioning props object
 * @returns Style object with position values, or undefined if no positions provided
 */
export function getPositionStyles(props: EccePositioningProps): React.CSSProperties | undefined {
  if (!hasPositionProps(props)) {
    return undefined
  }
  
  return {
    top: props.top,
    right: props.right,
    bottom: props.bottom,
    left: props.left,
  }
}

/**
 * Gets the translate-y class for the inner span based on variant
 * @param variant - The trigger variant
 * @param offset - Optional offset override (default: 1px for primary, 2px for secondary)
 * @returns Tailwind class string for translate-y
 */
export function getTriggerSpanTranslateClass(
  variant: EcceTriggerVariantProps["variant"] = "primary",
  offset?: { mobile?: string; desktop?: string }
): string {
  if (variant === "primary") {
    const mobile = offset?.mobile ?? "2px"
    const desktop = offset?.desktop ?? "2px"
    return `translate-y-[${mobile}] md:translate-y-[${desktop}]`
  }
  // Secondary variant doesn't need translate by default, but can be customized
  if (offset) {
    const mobile = offset.mobile ?? "0px"
    const desktop = offset.desktop ?? "0px"
    return `translate-y-[${mobile}] md:translate-y-[${desktop}]`
  }
  return ""
}
