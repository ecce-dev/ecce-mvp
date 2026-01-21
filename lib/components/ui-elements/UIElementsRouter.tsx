"use client"

import { useEffect, useMemo } from "react"
import { useTransition, animated } from "@react-spring/web"
import { useAppModeStore, type UserRole } from "@/lib/stores/appModeStore"
import { useGarments } from "@/lib/context/GarmentsContext"
import { uiElementsTransitionConfig } from "@/lib/components/ecce-elements/transition-config"
import UIElements from "./UIElements"
import UIElementsGarment from "./UIElementsGarment"

interface UIElementsRouterProps {
  aboutContent: string | null
  contactContent: string | null
  legalRightsContent: string | null
  publicDomainTextContent: string | null
}

/** UI view state for transition management */
type UIViewState = "default" | "public" | "research"

/**
 * Routes between different UI element sets based on app state
 * with smooth animated transitions using react-spring
 * 
 * Views:
 * - default: No garment selected (About, Submit Request, Explore, Contact)
 * - public: Garment selected + Public mode
 * - research: Garment selected + Research mode
 * 
 * Also handles:
 * - Session initialization from HttpOnly cookie
 * - URL parameter sync with Zustand state
 */
export default function UIElementsRouter({
  aboutContent,
  contactContent,
  legalRightsContent,
  publicDomainTextContent,
}: UIElementsRouterProps) {
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

  // Determine current UI view state
  const currentView: UIViewState = useMemo(() => {
    if (!selectedGarment) return "default"
    return viewMode === "research" ? "research" : "public"
  }, [selectedGarment, viewMode])

  // Animated transition between UI views
  const transitions = useTransition(currentView, {
    ...uiElementsTransitionConfig,
    // Use view name as key for transition identity
    keys: (view) => view,
  })

  return transitions((styles, view) => (
    <animated.div
      style={{
        ...styles,
        // Position absolute to allow overlapping during transitions
        // z-index 100 to stay above the canvas
        position: "absolute",
        inset: 0,
        zIndex: 100,
        // Pointer events none on wrapper, components handle their own
        pointerEvents: "none",
      }}
    >
      {view === "default" && (
        <UIElements
          aboutContent={aboutContent}
          contactContent={contactContent}
          legalRightsContent={legalRightsContent}
        />
      )}
      <UIElementsGarment
        mode={view === "public" ? "public" : "research"}
        legalRightsContent={legalRightsContent}
        publicDomainTextContent={publicDomainTextContent ?? ""}
      />
    </animated.div>
  ))
}
