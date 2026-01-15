"use client"

import { EcceDialogProvider } from "@/lib/components/ecce-elements"

interface EcceDialogWrapperProps {
  children: React.ReactNode
}

/**
 * Client wrapper that provides dialog context to both the canvas and UI components.
 * This allows BlurredOverlay and Garments to access dialog state without Zustand syncing.
 */
export function EcceDialogWrapper({ children }: EcceDialogWrapperProps) {
  return (
    <EcceDialogProvider>
      {children}
    </EcceDialogProvider>
  )
}
