"use client"

import { useGarments } from "@/lib/context/GarmentsContext";
import { useCallback, useEffect, useRef, Suspense, lazy, useState, type ComponentType } from "react";
import LoadingScreen from "../shared/LoadingScreen";
import { BlurredOverlay } from "../shared/BlurredOverlay";
import { useDevice } from "../../hooks/useDevice";
import { CountdownProgress } from "../ui-elements/CountdownProgress";
// PostHog is dynamically imported to avoid bundling
import { postHogCapture } from "@/lib/utils/posthog";
import { ThemeToggle } from "../ui-elements/ThemeToggle";
import { useAppModeStore } from "../../stores/appModeStore";
import { useEcceDialog } from "@/lib/components/ecce-elements/EcceDialogContext"
// Lazy load react-spring to reduce initial bundle
import { useSpring, animated } from "@react-spring/web";
import { LegalRightsToggle } from "../ui-elements/LegalRightsToggle";
import Background from "../shared/Background";
import { GarmentCopyrightToggle } from "../ui-elements/GarmentCopyrightToggle";
import { ApertureToggle } from "../ui-elements/ApertureToggle";
import { BackgroundImageDetailOverlay } from "../shared/BackgroundImageDetailOverlay";

interface GarmentsCanvasProps {
  onLoadingStateChange?: (isLoading: boolean) => void;
}

// Lazy load the heavy 3D canvas component to avoid blocking initial bundle
const GarmentsCanvas: ComponentType<GarmentsCanvasProps> = lazy(() => 
  import("./GarmentsCanvas").then(module => ({ default: module.default }))
);

/**
 * Lightweight wrapper component that handles data loading and performance tracking.
 * The heavy 3D canvas is lazy-loaded to avoid blocking the initial bundle.
 * 
 * Architecture:
 * - This component handles: data fetching, performance marks, UI elements
 * - GarmentsCanvas (lazy-loaded): handles 3D rendering and model loading
 * 
 * Performance:
 * - Marks page as "ready" when data fetch completes (for PageSpeed Insights)
 * - 3D code is code-split and only loaded after data is ready
 * - Reduces Total Blocking Time by decoupling Three.js from initial bundle
 */
export default function GarmentsClient() {
  const { selectedGarment } = useAppModeStore();
  const { isLoading: isDataLoading, refreshGarments } = useGarments();
  const { deviceType } = useDevice();
  const { openDialogId } = useEcceDialog();

  // Track if we've marked page as ready for performance metrics
  const hasMarkedPageReadyRef = useRef(false);
  
  // Track if 3D canvas should be loaded
  // Canvas loads after page-ready mark to ensure it doesn't block initial page load
  const [shouldLoadCanvas, setShouldLoadCanvas] = useState(false);
  
  // Track loading state from canvas (set by GarmentsCanvas via callback)
  const [isModelsLoading, setIsModelsLoading] = useState(false);

  // Mark page as ready when data fetch completes (for PageSpeed Insights)
  // Then trigger lazy loading of 3D canvas
  useEffect(() => {
    if (!isDataLoading && !hasMarkedPageReadyRef.current && typeof window !== 'undefined') {
      hasMarkedPageReadyRef.current = true;
      
      // Mark page as ready using Performance API
      if (performance.mark) {
        performance.mark('page-ready');
        
        // Measure time from navigation start to page ready
        if (performance.getEntriesByType('navigation').length > 0) {
          try {
            performance.measure('page-ready-time', 'navigationStart', 'page-ready');
          } catch (e) {
            // navigationStart might not be available in all browsers
            // Fallback: measure from fetchStart or use current time
            const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navEntry?.fetchStart) {
              performance.measure('page-ready-time', { start: navEntry.fetchStart, end: Date.now() });
            }
          }
        }
      }
      
      // Dispatch custom event for other tools that might be listening
      window.dispatchEvent(new CustomEvent('page-ready'));
      
      // Load canvas after page-ready mark to ensure it doesn't block initial page load
      // Using setTimeout(0) ensures this happens in the next event loop tick
      // This allows the page-ready mark to complete before Three.js code loads
      setTimeout(() => {
        setShouldLoadCanvas(true);
      }, 0);
    }
  }, [isDataLoading]);



  /**
 * Handle auto-refresh from countdown timer
 * Tracks analytics with different trigger type
 */
  const handleAutoRefresh = useCallback(async () => {
    if (selectedGarment) return;
    const { previous, current } = await refreshGarments();
    // Use dynamic PostHog import - non-blocking
    postHogCapture('explore_clicked', {
      previousGarments: previous,
      newGarments: current,
      userType: 'visitor',
      trigger: 'auto',
    });
  }, [refreshGarments, selectedGarment]);


  const opacitySpring = useSpring({
    opacity: deviceType === 'mobile' && selectedGarment && openDialogId ? 0 : 1,
    config: { tension: 2100, friction: 210 },
  })
  return (
    <>
      {/* LoadingScreen shows while:
          1. Data is loading (initial load)
          2. 3D canvas is being lazy-loaded
          3. Models are loading (after canvas is loaded) */}
      <LoadingScreen isModelsLoading={isDataLoading || !shouldLoadCanvas || isModelsLoading} />
      <BlurredOverlay />

      {!(isDataLoading || !shouldLoadCanvas || isModelsLoading) && <Background />}

      {/* Auto-refresh countdown indicator - show when data is loaded, even if models are still loading */}
      {!isDataLoading && (
        <>
          {/* {selectedGarment ? null : (
            <CountdownProgress
              onComplete={handleAutoRefresh}
              resetTrigger={0}
              isPaused={isDataLoading || isModelsLoading}
            />
          )} */}
          <animated.div style={opacitySpring}>
            <ThemeToggle />
            <ApertureToggle />
            <LegalRightsToggle />
            <GarmentCopyrightToggle />
          </animated.div>
          <BackgroundImageDetailOverlay />
        </>
      )}

      {/* Lazy load 3D canvas only after data is ready */}
      {/* Suspense with null fallback ensures loading doesn't block rendering */}
      {shouldLoadCanvas && (
        <Suspense fallback={null}>
          <GarmentsCanvas onLoadingStateChange={setIsModelsLoading} />
        </Suspense>
      )}
    </>
  );
}
