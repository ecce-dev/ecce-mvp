"use client";

import { useMemo } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  DARK_MODE_EFFECTS,
  RIM_LIGHTING_CONFIG,
  BLOOM_CONFIG,
} from "./darkModeEffectsConfig";

interface DarkModeEffectsProps {
  /** Whether dark mode is active */
  isDarkMode: boolean;
}

/**
 * Rim Lighting Component
 * Creates point lights positioned around the scene to highlight garment edges.
 */
function RimLighting() {
  const { intensity, color, radius, height, count } = RIM_LIGHTING_CONFIG;

  const lights = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI / count) * i;
      positions.push(
        new THREE.Vector3(
          radius * Math.sin(angle),
          height,
          radius * Math.cos(angle)
        )
      );
    }
    return positions;
  }, [count, radius, height]);

  return (
    <>
      {lights.map((position, index) => (
        <pointLight
          key={index}
          position={position}
          intensity={intensity}
          color={color}
          distance={radius * 2}
          decay={2}
        />
      ))}
      {/* Add a backlight for rim effect */}
      <pointLight
        position={[0, height * 0.5, -radius * 0.8]}
        intensity={intensity * 1.5}
        color={color}
        distance={radius * 2}
        decay={2}
      />
    </>
  );
}

/**
 * Bloom Post-Processing Component
 * Adds a subtle glow effect to bright areas.
 */
function BloomEffect() {
  const { intensity, luminanceThreshold, luminanceSmoothing, mipmapBlur } =
    BLOOM_CONFIG;

  return (
    <EffectComposer>
      <Bloom
        intensity={intensity}
        luminanceThreshold={luminanceThreshold}
        luminanceSmoothing={luminanceSmoothing}
        mipmapBlur={mipmapBlur}
      />
    </EffectComposer>
  );
}

/**
 * Dark Mode Effects Container
 * Renders all enabled dark mode visual effects.
 */
export function DarkModeEffects({ isDarkMode }: DarkModeEffectsProps) {
  if (!isDarkMode) return null;

  return (
    <>
      {DARK_MODE_EFFECTS.ENABLE_RIM_LIGHTING && <RimLighting />}
      {DARK_MODE_EFFECTS.ENABLE_BLOOM && <BloomEffect />}
    </>
  );
}

export default DarkModeEffects;
