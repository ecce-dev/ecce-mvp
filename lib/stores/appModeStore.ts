"use client"

import { create } from "zustand"
import { GarmentNode } from "@/lib/actions/getGarments"

/** User role based on password config keys */
export type UserRole = "curator" | "designer" | "vc"

/** View mode for garment details */
export type ViewMode = "public" | "research"

/** 
 * Animation mode for garment selection:
 * - 'camera': Camera animates to view the selected garment (original behavior)
 * - 'carousel': Camera stays fixed, carousel rotates to bring garment to camera
 */
export type SelectionAnimationMode = "camera" | "carousel"

interface AppModeState {
  /** Currently selected garment, null if none */
  selectedGarment: GarmentNode | null
  /** Current view mode (public or research) */
  viewMode: ViewMode
  /** Whether user is authenticated for research mode */
  isAuthenticated: boolean
  /** User role after authentication */
  userRole: UserRole | null
  /** Whether auth state has been initialized from session */
  isAuthInitialized: boolean
  /** Animation mode for garment selection */
  selectionAnimationMode: SelectionAnimationMode
  /** Whether the login modal is open */
  isLoginModalOpen: boolean
}

interface AppModeActions {
  /** Select a garment and update URL */
  selectGarment: (garment: GarmentNode) => void
  /** Deselect current garment and clear URL params */
  deselectGarment: () => void
  /** Set the view mode */
  setViewMode: (mode: ViewMode) => void
  /** Set authentication state (called after API validation) */
  setAuthenticated: (authenticated: boolean, role: UserRole | null) => void
  /** Mark auth as initialized */
  setAuthInitialized: () => void
  /** Logout and clear session */
  logout: () => Promise<void>
  /** Initialize state from URL params */
  initializeFromUrl: (garments: GarmentNode[]) => void
  /** Set the selection animation mode */
  setSelectionAnimationMode: (mode: SelectionAnimationMode) => void
  /** Open/close the login modal */
  setLoginModalOpen: (open: boolean) => void
}

type AppModeStore = AppModeState & AppModeActions

/**
 * Clear the dialog query parameter from URL
 */
function clearDialogUrlParam() {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)
  url.searchParams.delete("dialog")
  window.history.replaceState({}, "", url.toString())
}

/**
 * Update URL query parameters without page reload
 */
function updateUrlParams(garmentSlug: string | null, mode: ViewMode | null) {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)

  if (garmentSlug) {
    url.searchParams.set("garment", garmentSlug)
    if (mode) {
      url.searchParams.set("mode", mode)
    }
  } else {
    url.searchParams.delete("garment")
    url.searchParams.delete("mode")
  }

  window.history.replaceState({}, "", url.toString())
}

/**
 * Zustand store for app mode management
 * 
 * Handles:
 * - Selected garment state
 * - View mode (public/research) switching
 * - Authentication state
 * - URL query parameter sync
 */
export const useAppModeStore = create<AppModeStore>((set, get) => ({
  // Initial state
  selectedGarment: null,
  viewMode: "public",
  isAuthenticated: false,
  userRole: null,
  isAuthInitialized: false,
  selectionAnimationMode: "carousel",
  isLoginModalOpen: false,

  // Actions
  selectGarment: (garment) => {
    const { viewMode, isAuthenticated } = get()
    // Default to public mode when selecting, unless authenticated
    const effectiveMode = isAuthenticated ? viewMode : "public"
    
    set({ selectedGarment: garment, viewMode: effectiveMode })
    updateUrlParams(garment.slug ?? null, effectiveMode)
    // Reset dialog param when selecting a new garment
    clearDialogUrlParam()
  },

  deselectGarment: () => {
    set({ selectedGarment: null })
    updateUrlParams(null, null)
    // Clear dialog param when deselecting garment
    clearDialogUrlParam()
  },

  setViewMode: (mode) => {
    const { selectedGarment, isAuthenticated } = get()
    
    // Only allow research mode if authenticated
    const effectiveMode = mode === "research" && !isAuthenticated ? "public" : mode
    
    set({ viewMode: effectiveMode })
    
    if (selectedGarment?.slug) {
      updateUrlParams(selectedGarment.slug, effectiveMode)
    }
  },

  setAuthenticated: (authenticated, role) => {
    set({ isAuthenticated: authenticated, userRole: role })
    
    // If logged out while in research mode, switch to public
    if (!authenticated) {
      const { selectedGarment } = get()
      set({ viewMode: "public", userRole: null })
      if (selectedGarment?.slug) {
        updateUrlParams(selectedGarment.slug, "public")
      }
    }
  },

  setAuthInitialized: () => {
    set({ isAuthInitialized: true })
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout failed:", error)
    }
    
    const { selectedGarment } = get()
    set({ isAuthenticated: false, userRole: null, viewMode: "public" })
    
    if (selectedGarment?.slug) {
      updateUrlParams(selectedGarment.slug, "public")
    }
  },

  initializeFromUrl: (garments) => {
    if (typeof window === "undefined") return

    const url = new URL(window.location.href)
    const garmentSlug = url.searchParams.get("garment")
    const mode = url.searchParams.get("mode") as ViewMode | null

    if (garmentSlug) {
      const garment = garments.find((g) => g.slug === garmentSlug)
      if (garment) {
        const { isAuthenticated } = get()
        // Only allow research mode from URL if authenticated
        const effectiveMode = mode === "research" && isAuthenticated ? "research" : "public"
        
        set({ selectedGarment: garment, viewMode: effectiveMode })
        
        // Update URL if mode was changed due to auth
        if (mode === "research" && !isAuthenticated) {
          updateUrlParams(garmentSlug, "public")
        }
      }
    }
  },

  setSelectionAnimationMode: (mode) => {
    set({ selectionAnimationMode: mode })
  },

  setLoginModalOpen: (open) => {
    set({ isLoginModalOpen: open })
  },
}))
