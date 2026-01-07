'use client';

import { useState, useEffect } from 'react';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Scale mode:
 * - 'fluid': Smooth interpolation based on viewport width
 * - 'stepped': Discrete scale values for mobile, tablet, desktop
 */
const SCALE_MODE: 'fluid' | 'stepped' = 'stepped';

// --- Stepped mode configuration ---
/** Viewport breakpoints (matches useDevice.ts) */
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/** Scale values for each device type */
const MOBILE_SCALE = 0.8;
const TABLET_SCALE = 0.9;
const DESKTOP_SCALE = 1.0;

// --- Fluid mode configuration ---
/** Viewport range for fluid interpolation */
const FLUID_MIN_VIEWPORT = 375;
const FLUID_MAX_VIEWPORT = 1024;

/** Scale range for fluid interpolation */
const FLUID_MIN_SCALE = 0.5;
const FLUID_MAX_SCALE = 1.0;

// ============================================

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get stepped scale based on viewport width
 */
function getSteppedScale(viewport: number): number {
  if (viewport < MOBILE_BREAKPOINT) {
    return MOBILE_SCALE;
  } else if (viewport < TABLET_BREAKPOINT) {
    return TABLET_SCALE;
  } else {
    return DESKTOP_SCALE;
  }
}

/**
 * Get fluid scale based on viewport width
 */
function getFluidScale(viewport: number): number {
  const t = (viewport - FLUID_MIN_VIEWPORT) / (FLUID_MAX_VIEWPORT - FLUID_MIN_VIEWPORT);
  const clampedT = clamp(t, 0, 1);
  return lerp(FLUID_MIN_SCALE, FLUID_MAX_SCALE, clampedT);
}

/**
 * Hook that provides a responsive scale factor based on viewport width.
 * 
 * Configure SCALE_MODE at the top of this file to switch between:
 * - 'stepped': Returns discrete values (MOBILE_SCALE, TABLET_SCALE, DESKTOP_SCALE)
 * - 'fluid': Returns smoothly interpolated value between FLUID_MIN_SCALE and FLUID_MAX_SCALE
 * 
 * Use this to multiply against desktop-sized values for responsive scaling.
 */
export function useResponsiveScale(): number {
  const [scale, setScale] = useState(DESKTOP_SCALE); // Default to desktop for SSR

  useEffect(() => {
    const updateScale = () => {
      const viewport = window.innerWidth;
      
      const newScale = SCALE_MODE === 'stepped' 
        ? getSteppedScale(viewport)
        : getFluidScale(viewport);
      
      setScale(newScale);
    };

    // Initial calculation
    updateScale();

    // Listen for resize events
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  return scale;
}
