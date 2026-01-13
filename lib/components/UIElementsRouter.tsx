"use client"

import { useEffect } from "react"
import { useAppModeStore, type UserRole } from "@/lib/stores/appModeStore"
import { useGarments } from "@/lib/context/GarmentsContext"
import UIElements from "./UIElements"
import UIElementsPublic from "./UIElementsPublic"
import UIElementsResearch from "./UIElementsResearch"

interface UIElementsRouterProps {
  aboutContent: string | null
  contactContent: string | null
}

/**
 * Routes between different UI element sets based on app state
 * 
 * - No garment selected: Default UIElements (About, Submit Request, Explore, Contact)
 * - Garment selected + Public mode: UIElementsPublic
 * - Garment selected + Research mode: UIElementsResearch
 * 
 * Also handles:
 * - Session initialization from HttpOnly cookie
 * - URL parameter sync with Zustand state
 */
export default function UIElementsRouter({ aboutContent, contactContent }: UIElementsRouterProps) {
  const { selectedGarment, viewMode, isAuthInitialized, setAuthenticated, setAuthInitialized, initializeFromUrl } = useAppModeStore()
  const { garments } = useGarments()

  // Initialize auth state from session cookie on mount
  useEffect(() => {
    if (isAuthInitialized) return

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session")
        const data = await response.json()
        
        if (data.authenticated && data.role) {
          setAuthenticated(true, data.role as UserRole)
        }
      } catch (error) {
        console.error("Session check failed:", error)
      } finally {
        setAuthInitialized()
      }
    }

    checkSession()
  }, [isAuthInitialized, setAuthenticated, setAuthInitialized])

  // Initialize state from URL parameters after auth is initialized
  useEffect(() => {
    if (!isAuthInitialized || garments.length === 0) return
    
    initializeFromUrl(garments)
  }, [isAuthInitialized, garments, initializeFromUrl])

  // Route to appropriate UI based on state
  if (selectedGarment) {
    if (viewMode === "research") {
      return <UIElementsResearch />
    }
    return <UIElementsPublic />
  }

  // Default: no garment selected
  return <UIElements aboutContent={aboutContent} contactContent={contactContent} />
}
