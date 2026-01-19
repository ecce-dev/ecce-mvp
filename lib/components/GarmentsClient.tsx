"use client"

import { useGarments } from "@/lib/context/GarmentsContext";
import { ContactShadows, Environment, useProgress } from "@react-three/drei";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import CanvasWrapper from "./r3f/CanvasWrapper";
import Garments from "./r3f/Garments";
import LoadingScreen from "./LoadingScreen";
import { BlurredOverlay } from "./BlurredOverlay";
import { DarkModeEffects } from "./r3f/DarkModeEffects";
import { DARK_MODE_EFFECTS, ENVIRONMENT_CONFIG } from "./r3f/darkModeEffectsConfig";
import * as THREE from 'three';
import { useDevice } from "../hooks/useDevice";
import { CountdownProgress } from "./CountdownProgress";
import posthog from "posthog-js";
import { ThemeToggle } from "./ThemeToggle";
import { AnimationToggle } from "./AnimationToggle";
import { useAppModeStore } from "../stores/appModeStore";
import LogoutButton from "./LogoutButton";
import { useEcceDialog } from "@/lib/components/ecce-elements/EcceDialogContext"
import { useSpring, animated } from "@react-spring/web";

/**
 * Client component that renders the 3D garments canvas
 * 
 * Subscribes to GarmentsContext to receive:
 * - Current garments to display
 * - Loading state for visual feedback
 * 
 * The garments are automatically updated when:
 * - User clicks "Explore" button
 * - Device type changes (responsive count adjustment)
 * 
 * Shows a loading overlay when:
 * - Garment data is being fetched (isLoading from context)
 * - GLB 3D files are being loaded (active from useProgress)
 * 
 * Features:
 * - Selection animation: Clicking a garment rotates camera to face it
 * - Opacity fade: Non-selected garments fade out when one is selected
 */
export default function GarmentsClient() {
  const { viewMode, selectedGarment } = useAppModeStore()

  const { garments, isLoading: isDataLoading, refreshGarments } = useGarments();
  const { active: isAssetsLoading } = useProgress();
  const { deviceType } = useDevice();
  const { openDialogId } = useEcceDialog()

  // Trigger to reset countdown when user manually explores
  const [manualRefreshCount, setManualRefreshCount] = useState(0);

  // Theme detection for dark mode effects
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is active (default to light during SSR)
  const isDarkMode = mounted && resolvedTheme === "dark";

  // Combined loading state: data fetching OR GLB files loading
  const isLoading = isDataLoading || isAssetsLoading;

  const shadowRadius = deviceType === 'desktop' ? 21 : deviceType === 'tablet' ? 15 : 8;

  // Select environment preset based on theme
  const environmentPreset = isDarkMode && DARK_MODE_EFFECTS.ENABLE_ENVIRONMENT_SWITCH
    ? ENVIRONMENT_CONFIG.darkModePreset
    : ENVIRONMENT_CONFIG.lightModePreset;


  /**
 * Handle auto-refresh from countdown timer
 * Tracks analytics with different trigger type
 */
  const handleAutoRefresh = useCallback(async () => {
    if (selectedGarment) return;
    const { previous, current } = await refreshGarments();
    posthog.capture('explore_clicked', {
      previousGarments: previous,
      newGarments: current,
      userType: 'visitor',
      trigger: 'auto',
    });
  }, [refreshGarments]);


  
  const opacitySpring = useSpring({
    opacity: openDialogId ? 0 : 1,
    config: { tension: 2100, friction: 210 },
  })
  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <BlurredOverlay />

      {/* Auto-refresh countdown indicator */}
      {!isLoading && (
        <>
          {selectedGarment ? null : (
          <CountdownProgress
              onComplete={handleAutoRefresh}
              resetTrigger={manualRefreshCount}
              isPaused={isLoading}
            />
          )}
          <animated.div style={opacitySpring}>
            <ThemeToggle />
            <AnimationToggle />
            {viewMode === "research" && <LogoutButton />}
          </animated.div>
        </>
      )}

      <div className="fixed z-10 top-0 left-0 right-0 h-full w-full">
        <CanvasWrapper
          initialCameraPosition={new THREE.Vector3(0, 2, 19)}
          maxCameraDistance={42}
          minCameraDistance={4.2}
          controls={{
            orbitControls: {
              target: new THREE.Vector3(0, 0, 0),
              dampingFactor: 0.05,
              panSpeed: 1,
              rotateSpeed: 1,
              enableZoom: true,
              enablePan: true,
              enableRotate: true,
              // maxPolarAngle: Math.PI / 2,
              // minPolarAngle: 0,
            }
          }}
          enableLights={{
            ambient: false,
            directional: false
          }}
        >
          <Environment
            preset={environmentPreset}
            background={isDarkMode ? false : undefined}
          />
          {/* Dark mode visual effects */}
          <DarkModeEffects isDarkMode={isDarkMode} />
          <ContactShadows scale={shadowRadius * 4} position={[0, -5, 0]} far={shadowRadius} blur={2} />
          <Garments garments={garments} />
        </CanvasWrapper>
      </div>
    </>
  );
}
