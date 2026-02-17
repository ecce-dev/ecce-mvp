"use client"

import { create } from "zustand"
import { GarmentNode } from "@/lib/actions/getGarments"
import type { BackgroundImageData } from "@/lib/actions/getGlobalSettings"

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

/**
 * Background mode state machine:
 * - 'backgroundImage': Full-screen blurred background image with logo, UI themed per CMS
 * - 'light': Standard light mode, no background image
 * - 'dark': Standard dark mode, no background image
 * 
 * Transitions:
 *   backgroundImage --[theme toggle]--> dark
 *   backgroundImage --[aperture toggle]--> toggles detail overlay (stays in backgroundImage)
 *   light --[theme toggle]--> dark
 *   light --[aperture toggle]--> backgroundImage
 *   dark --[theme toggle]--> light
 *   dark --[aperture toggle]--> backgroundImage
 */
export type BackgroundMode = "backgroundImage" | "light" | "dark"

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
  /** The submit request message (persisted in case dialog is closed) */
  submitRequestMessage: string | null
  /** The public domain text content - publicDomainTextContent is used for both licensedDialogContent as well as showing the license text on the garment model, hence storing it in the store*/
  publicDomainTextContent: string
  /** Whether to show the garment copyright */
  showGarmentCopyright: boolean
  /** Current background mode (backgroundImage, light, or dark) */
  backgroundMode: BackgroundMode
  /** Whether the background image detail overlay is visible */
  isDetailOverlayOpen: boolean
  /** Background image data from WordPress CMS */
  backgroundImageData: BackgroundImageData | null
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
  /** Update selected garment data without triggering camera animation or URL changes */
  updateSelectedGarmentData: (garment: GarmentNode) => void
  /** Initialize state from URL params */
  initializeFromUrl: (garments: GarmentNode[]) => void
  /** Set the selection animation mode */
  setSelectionAnimationMode: (mode: SelectionAnimationMode) => void
  /** Open/close the login modal */
  setLoginModalOpen: (open: boolean) => void
  /** Set the submit request message */
  setSubmitRequestMessage: (message: string | null) => void
  /** Set the public domain text content */
  setPublicDomainTextContent: (content: string) => void
  /** Set whether to show the garment copyright */
  setShowGarmentCopyright: (show: boolean) => void
  /** Handle aperture toggle: switches to backgroundImage mode or toggles detail overlay */
  toggleAperture: () => void
  /** Handle theme toggle: cycles between backgroundImage -> dark, light <-> dark */
  toggleTheme: () => void
  /** Set background image data from CMS */
  setBackgroundImageData: (data: BackgroundImageData) => void
  /** Set the background mode directly (used during initialization) */
  setBackgroundMode: (mode: BackgroundMode) => void
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
  selectionAnimationMode: "camera",
  isLoginModalOpen: false,
  submitRequestMessage: null,
  publicDomainTextContent: "",
  showGarmentCopyright: false,
  backgroundMode: "backgroundImage",
  isDetailOverlayOpen: false,
  backgroundImageData: null,

  // Actions
  selectGarment: (garment) => {
    const { viewMode, isAuthenticated } = get()
    // Default to public mode when selecting, unless authenticated
    const effectiveMode = isAuthenticated ? viewMode : "public"
    
    set({ selectedGarment: garment, viewMode: effectiveMode, isDetailOverlayOpen: false })
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

  updateSelectedGarmentData: (garment) => {
    set({ selectedGarment: garment })
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

  setSubmitRequestMessage: (message) => {
    set({ submitRequestMessage: message })
  },

  setPublicDomainTextContent: (content) => {
    set({ publicDomainTextContent: content })
  },
  setShowGarmentCopyright: (show) => {
    set({ showGarmentCopyright: show })
  },

  toggleAperture: () => {
    const { backgroundMode, isDetailOverlayOpen } = get()
    if (backgroundMode === "backgroundImage") {
      // In backgroundImage mode: toggle the detail overlay
      set({ isDetailOverlayOpen: !isDetailOverlayOpen })
    } else {
      // In light or dark mode: switch to backgroundImage mode
      set({ backgroundMode: "backgroundImage", isDetailOverlayOpen: false })
    }
  },

  toggleTheme: () => {
    const { backgroundMode, backgroundImageData } = get()
    if (backgroundMode === "backgroundImage") {
      // From backgroundImage: go to the opposite theme of the background image
      set({ backgroundMode: backgroundImageData?.theme === "dark" ? "light" : "dark", isDetailOverlayOpen: false })
    } else if (backgroundMode === "dark") {
      // From dark: go to light
      set({ backgroundMode: "light" })
    } else {
      // From light: go to dark
      set({ backgroundMode: "dark" })
    }
  },

  setBackgroundImageData: (data) => {
    set({ backgroundImageData: data })
  },

  setBackgroundMode: (mode) => {
    set({ backgroundMode: mode, isDetailOverlayOpen: false })
  },
}))
