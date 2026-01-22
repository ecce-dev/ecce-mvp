"use client"

import { useGarments } from "@/lib/context/GarmentsContext";
import { ContactShadows, Environment, useProgress } from "@react-three/drei";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import CanvasWrapper from "./CanvasWrapper";
import Garments from "./Garments";
import { DarkModeEffects } from "./DarkModeEffects";
import { DARK_MODE_EFFECTS, ENVIRONMENT_CONFIG } from "./darkModeEffectsConfig";
import * as THREE from 'three';
import { useDevice } from "../../hooks/useDevice";
import { useAppModeStore } from "../../stores/appModeStore";

interface GarmentsCanvasProps {
  /** Callback to notify parent of loading state changes */
  onLoadingStateChange?: (isLoading: boolean) => void;
}

/**
 * Heavy 3D canvas component that renders the Three.js scene.
 * This component is lazy-loaded to avoid blocking the initial bundle.
 * 
 * Uses useProgress to track when all assets are loaded (100% progress).
 * Communicates loading state to parent via callback.
 */
export default function GarmentsCanvas({ onLoadingStateChange }: GarmentsCanvasProps) {
  const { selectedGarment } = useAppModeStore();
  const { garments } = useGarments();
  const { active: isAssetsLoading, progress } = useProgress();
  const { deviceType } = useDevice();

  // Theme detection for dark mode effects
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  // For testing: disable garment rendering to test performance without 3D models
  const [shouldRenderGarments] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is active (default to light during SSR)
  const isDarkMode = mounted && resolvedTheme === "dark";

  // Track if we've marked all-models-loaded
  const hasMarkedModelsLoadedRef = useRef(false);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingStateChange?.(isAssetsLoading);
  }, [isAssetsLoading, onLoadingStateChange]);

  // Track when all models are loaded (100% progress)
  useEffect(() => {
    if (!isAssetsLoading && progress === 100 && !hasMarkedModelsLoadedRef.current && typeof window !== 'undefined') {
      hasMarkedModelsLoadedRef.current = true;
      
      // Mark when all models are loaded
      if (performance.mark) {
        performance.mark('all-models-loaded');
        
        // Measure time from page-ready to all-models-loaded
        // Only measure if page-ready mark exists
        try {
          const pageReadyMarks = performance.getEntriesByName('page-ready', 'mark');
          if (pageReadyMarks.length > 0) {
            performance.measure('models-loading-time', 'page-ready', 'all-models-loaded');
          }
        } catch (e) {
          // Mark might not exist yet, skip measurement
        }
      }
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('all-models-loaded'));
    }
  }, [isAssetsLoading, progress]);

  const shadowRadius = deviceType === 'desktop' ? 21 : deviceType === 'tablet' ? 15 : 8;

  // Select environment preset based on theme
  const environmentPreset = isDarkMode && DARK_MODE_EFFECTS.ENABLE_ENVIRONMENT_SWITCH
    ? ENVIRONMENT_CONFIG.darkModePreset
    : ENVIRONMENT_CONFIG.lightModePreset;

  return (
    <div className="fixed z-10 top-0 left-0 right-0 h-full w-full">
      <CanvasWrapper
        initialCameraPosition={new THREE.Vector3(0, -1, 19)}
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
          }
        }}
        enableLights={{
          ambient: false,
          directional: false
        }}
      >
        <Environment
          preset={environmentPreset}
        />
        {/* Dark mode visual effects */}
        <DarkModeEffects isDarkMode={isDarkMode} />
        {(!isDarkMode && !selectedGarment) && <ContactShadows scale={shadowRadius * 4} position={[0, -5, 0]} far={shadowRadius} blur={2} />}
        {/* Delay rendering Garments to ensure page-ready mark happens first */}
        {shouldRenderGarments && <Garments garments={garments} />}
      </CanvasWrapper>
    </div>
  );
}
