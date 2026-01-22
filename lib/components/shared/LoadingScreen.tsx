"use client"

import { useEffect, useState } from "react"
import { EcceLogoBlack } from "../ecce-elements/EcceLogoSVG"
import EcceLoadingLottie from "../ecce-elements/EcceLoadingLottie"

interface LoadingScreenProps {
  /** Whether 3D models are still loading */
  isModelsLoading: boolean
  /** Minimum time to show the loading screen (ms) - prevents flash */
  minDisplayTime?: number
}

/**
 * Full-screen loading overlay with blur effect and animated text.
 * 
 * Features:
 * - Transparent backdrop with blur
 * - Smooth fade in/out transitions
 * - Animated loading text with glow effect
 * - Minimum display time to prevent jarring flashes
 * - Marks page as loaded for PageSpeed Insights when component mounts
 * 
 * Note: Animation keyframes are defined in globals.css
 * 
 * Performance:
 * - This component displays while 3D models are loading
 * - Page is marked as "ready" separately when data fetch completes (in GarmentsClient)
 * - "all-models-loaded" is tracked when models finish loading (in GarmentsClient)
 */
export default function LoadingScreen({ 
  isModelsLoading, 
  minDisplayTime = 0 // Reduced for testing - was 500ms
}: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(isModelsLoading)
  const [shouldRender, setShouldRender] = useState(isModelsLoading)

  useEffect(() => {
    let minTimeoutId: NodeJS.Timeout | null = null
    let hideTimeoutId: NodeJS.Timeout | null = null

    if (isModelsLoading) {
      // Show immediately when loading starts
      setShouldRender(true)
      setIsVisible(true)
    } else if (isVisible) {
      // When loading ends, wait for minimum display time before starting fade
      minTimeoutId = setTimeout(() => {
        setIsVisible(false)
        // Remove from DOM after fade animation completes
        hideTimeoutId = setTimeout(() => {
          setShouldRender(false)
        }, 500) // Match CSS transition duration
      }, minDisplayTime)
    }

    return () => {
      if (minTimeoutId) clearTimeout(minTimeoutId)
      if (hideTimeoutId) clearTimeout(hideTimeoutId)
    }
  }, [isModelsLoading, isVisible, minDisplayTime])

  if (!shouldRender) return null


  // bg-foreground/20 backdrop-blur-md
  return (
    <div
      className={`
        fixed inset-0 z-50
        flex items-center justify-center
        bg-background
        transition-opacity duration-500 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      aria-live="polite"
      aria-busy={isModelsLoading}
    >
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated loading text */}
        {/* <h2 
          className="
            font-ibm-plex-mono
            text-2xl md:text-3xl lg:text-4xl
            font-normal tracking-[0.3em] uppercase
            text-background/90
            animate-pulse
            drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]
          "
          style={{
            textShadow: '0 0 40px rgba(255,255,255,0.2), 0 0 80px rgba(255,255,255,0.1)',
          }}
        >
          Loading
        </h2> */}
        {/* <EcceLogoBlack 
          width={100} 
          height={100} 
          className="w-24 h-24 invert loading-logo" 
        /> */}
        <div className="dark:invert">
          <EcceLoadingLottie />
        </div>

        {/* Subtle animated dots */}
        {/* <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="loading-dot w-2 h-2 rounded-full bg-white/60"
              style={{
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div> */}
      </div>
    </div>
  )
}

