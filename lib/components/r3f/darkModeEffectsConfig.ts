/**
 * Dark Mode Visual Effects Configuration
 * 
 * Toggle these flags to test which effects work best for improving
 * garment visibility in dark mode.
 */

export const DARK_MODE_EFFECTS = {
  /**
   * 1. RIM LIGHTING / EDGE GLOW
   * Adds point lights positioned around the scene to create edge highlights
   * on dark garments, making their silhouettes more visible.
   */
  ENABLE_RIM_LIGHTING: false,

  /**
   * 2. SWITCH ENVIRONMENT PRESET
   * Changes the HDR environment from "studio" to a brighter/more contrasting
   * preset in dark mode for better garment visibility.
   */
  ENABLE_ENVIRONMENT_SWITCH: true,

  /**
   * 3. SUBTLE GLOW/BLOOM POST-PROCESSING
   * Adds a bloom effect that makes highlights on garments "pop" more,
   * improving visibility of specular/metallic materials.
   */
  ENABLE_BLOOM: false,
} as const;

// ============================================
// RIM LIGHTING CONFIGURATION
// ============================================

export const RIM_LIGHTING_CONFIG = {
  /** Intensity of rim lights (0-10) */
  intensity: 2.5,
  /** Color of rim lights */
  color: "#4488ff",
  /** Distance from center */
  radius: 15,
  /** Height of rim lights */
  height: 8,
  /** Number of rim lights around the scene */
  count: 3,
} as const;

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

export const ENVIRONMENT_CONFIG = {
  /** Environment preset for light mode */
  lightModePreset: "forest" as const,
  /** Environment preset for dark mode (options: "city", "dawn", "night", "warehouse", "forest", "apartment", "studio", "sunset", "park", "lobby") */
  darkModePreset: "city" as const,
} as const;

// ============================================
// BLOOM CONFIGURATION
// ============================================

export const BLOOM_CONFIG = {
  /** Bloom intensity (0-2) */
  intensity: 0.4,
  /** Luminance threshold - only pixels brighter than this will bloom */
  luminanceThreshold: 0.6,
  /** Smoothing for luminance threshold */
  luminanceSmoothing: 0.9,
  /** Mipmap blur - affects blur quality */
  mipmapBlur: true,
} as const;
