"use client"

import { useEffect, useRef } from "react"

/**
 * Valid dialog IDs used throughout the application
 * Used for URL parameter validation
 */
export const VALID_DIALOG_IDS = [
  "about",
  "contact",
  "submit-request",
  "description",
  "provenance",
  "construction",
  "analytics",
  "export",
  "licensed",
] as const

export type ValidDialogId = typeof VALID_DIALOG_IDS[number]

/**
 * Update the dialog query parameter in the URL
 * @param dialogId - The dialog ID to set, or null to remove the parameter
 */
function updateDialogUrlParam(dialogId: string | null) {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)

  if (dialogId) {
    url.searchParams.set("dialog", dialogId)
  } else {
    url.searchParams.delete("dialog")
  }

  window.history.replaceState({}, "", url.toString())
}

/**
 * Get the dialog ID from URL parameters
 * @returns The dialog ID if present and valid, null otherwise
 */
function getDialogIdFromUrl(): string | null {
  if (typeof window === "undefined") return null

  const url = new URL(window.location.href)
  const dialogId = url.searchParams.get("dialog")

  return dialogId
}

/**
 * Validates if a dialog ID is valid
 * @param dialogId - The dialog ID to validate
 * @returns true if valid, false otherwise
 */
function isValidDialogId(dialogId: string | null): dialogId is ValidDialogId {
  if (!dialogId) return false
  return VALID_DIALOG_IDS.includes(dialogId as ValidDialogId)
}

/**
 * Hook to sync dialog state with URL query parameters
 * 
 * Features:
 * - Updates URL when dialog opens/closes
 * - Initializes dialog from URL on mount
 * - Validates dialog IDs (logs warning for invalid IDs)
 * 
 * @param openDialogId - Current open dialog ID from context
 * @param openDialog - Function to open a dialog
 * @param closeDialog - Function to close a dialog
 */
export function useDialogUrlSync(
  openDialogId: string | null,
  openDialog: (id: string) => void,
  closeDialog: (id: string) => void
) {
  const hasInitialized = useRef(false)
  const skipNextSync = useRef(false)

  // Initialize from URL on mount (only once)
  useEffect(() => {
    if (hasInitialized.current) return
    
    const urlDialogId = getDialogIdFromUrl()
    
    if (urlDialogId) {
      if (isValidDialogId(urlDialogId)) {
        // Mark that we should skip the next sync since we're initializing from URL
        skipNextSync.current = true
        openDialog(urlDialogId)
      } else {
        console.warn(
          `Invalid dialog ID in URL: "${urlDialogId}". Valid IDs are: ${VALID_DIALOG_IDS.join(", ")}`
        )
        // Remove invalid dialog param from URL
        updateDialogUrlParam(null)
      }
    }
    
    hasInitialized.current = true
  }, [openDialog])

  // Sync dialog state to URL (skip during initialization)
  useEffect(() => {
    // Skip on initial mount or if we're skipping this sync (during initialization)
    if (!hasInitialized.current) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }

    updateDialogUrlParam(openDialogId)
  }, [openDialogId])
}
