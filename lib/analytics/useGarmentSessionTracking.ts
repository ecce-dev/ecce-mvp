"use client"

import { useEffect, useRef } from "react"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import {
  trackGarmentSelected,
  startGarmentSession,
  endGarmentSession,
  type GarmentSession,
  type AnalyticsMode,
  type AnalyticsUserRole,
} from "./tracking"

/**
 * Hook to track garment selection and session duration
 * 
 * Automatically:
 * - Tracks garment_selected when a garment is selected
 * - Tracks garment_session_ended when switching garments or deselecting
 * - Handles mode changes (updates session mode)
 * - Includes user_role for authenticated users
 * - Cleans up on unmount (tracks final session)
 * 
 * Usage: Call this hook once in the root garment view component
 */
export function useGarmentSessionTracking(): void {
  const selectedGarment = useAppModeStore((state) => state.selectedGarment)
  const viewMode = useAppModeStore((state) => state.viewMode)
  const userRole = useAppModeStore((state) => state.userRole)
  
  // Track current session
  const sessionRef = useRef<GarmentSession | null>(null)
  
  // Track previous garment slug to detect changes
  const prevGarmentSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const currentSlug = selectedGarment?.slug ?? null
    const currentName = selectedGarment?.garmentFields?.name ?? "Unknown"
    const mode = viewMode as AnalyticsMode
    const role = userRole as AnalyticsUserRole
    
    // Detect if garment selection changed
    const garmentChanged = currentSlug !== prevGarmentSlugRef.current
    
    if (garmentChanged) {
      // End previous session if exists
      if (sessionRef.current) {
        endGarmentSession(sessionRef.current)
        sessionRef.current = null
      }
      
      // Start new session if a garment is selected
      if (currentSlug) {
        // Track the selection event
        trackGarmentSelected(currentSlug, currentName, mode, role)
        
        // Start timing the session
        sessionRef.current = startGarmentSession(currentSlug, currentName, mode, role)
      }
      
      prevGarmentSlugRef.current = currentSlug
    } else if (sessionRef.current && currentSlug) {
      // Same garment but mode or role might have changed - update session
      sessionRef.current.mode = mode
      sessionRef.current.userRole = role
    }
  }, [selectedGarment, viewMode, userRole])

  // Cleanup on unmount - end any active session
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        endGarmentSession(sessionRef.current)
        sessionRef.current = null
      }
    }
  }, [])

  // Handle page visibility changes (track when user leaves tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && sessionRef.current) {
        // End session when page becomes hidden
        endGarmentSession(sessionRef.current)
        
        // Restart session when page becomes visible again
        const { garmentSlug, garmentName, mode, userRole: sessionUserRole } = sessionRef.current
        sessionRef.current = startGarmentSession(garmentSlug, garmentName, mode, sessionUserRole)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Handle page unload (track when user closes tab/navigates away)
  // Uses pagehide event (Page Lifecycle API) instead of deprecated beforeunload
  useEffect(() => {
    const handlePageHide = () => {
      if (sessionRef.current) {
        endGarmentSession(sessionRef.current)
      }
    }

    window.addEventListener("pagehide", handlePageHide)
    return () => {
      window.removeEventListener("pagehide", handlePageHide)
    }
  }, [])
}
