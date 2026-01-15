"use client"

import posthog from "posthog-js"

// ============================================
// ANALYTICS EVENT TYPES
// See docs/analytics.md for full documentation
// ============================================

/**
 * View mode for garment interactions
 */
export type AnalyticsMode = "public" | "research"

/**
 * User role types (matches UserRole from appModeStore)
 */
export type AnalyticsUserRole = "curator" | "designer" | "vc" | null

/**
 * Action types tracked for garment interactions
 */
export type GarmentActionType = 
  | "description"
  | "tiktok"
  | "provenance"
  | "construction"
  | "analytics"
  | "export"

/**
 * Properties for garment_selected event
 */
interface GarmentSelectedProperties {
  garment_slug: string
  garment_name: string
  mode: AnalyticsMode
  user_role: AnalyticsUserRole
}

/**
 * Properties for garment_session_ended event
 */
interface GarmentSessionEndedProperties {
  garment_slug: string
  garment_name: string
  mode: AnalyticsMode
  user_role: AnalyticsUserRole
  duration_seconds: number
}

/**
 * Properties for garment_action_clicked event
 */
interface GarmentActionClickedProperties {
  garment_slug: string
  garment_name: string
  mode: AnalyticsMode
  user_role: AnalyticsUserRole
  action_type: GarmentActionType
}

// ============================================
// TRACKING FUNCTIONS
// ============================================

/**
 * Track when a user selects/clicks on a garment
 * 
 * @param garmentSlug - Unique identifier for the garment
 * @param garmentName - Display name of the garment
 * @param mode - Current view mode (public or research)
 * @param userRole - User role if authenticated (curator, designer, vc, or null)
 * 
 * PostHog automatically captures:
 * - $geoip_country_code
 * - $geoip_country_name
 * - Device info, browser, etc.
 */
export function trackGarmentSelected(
  garmentSlug: string,
  garmentName: string,
  mode: AnalyticsMode,
  userRole: AnalyticsUserRole = null
): void {
  const properties: GarmentSelectedProperties = {
    garment_slug: garmentSlug,
    garment_name: garmentName,
    mode,
    user_role: userRole,
  }
  
  posthog.capture("garment_selected", properties)
}

/**
 * Track when a user ends their session with a garment
 * (switches to another garment or deselects)
 * 
 * @param garmentSlug - Unique identifier for the garment
 * @param garmentName - Display name of the garment
 * @param mode - View mode during the session
 * @param userRole - User role if authenticated
 * @param durationSeconds - Time spent viewing this garment in seconds
 */
export function trackGarmentSessionEnded(
  garmentSlug: string,
  garmentName: string,
  mode: AnalyticsMode,
  userRole: AnalyticsUserRole,
  durationSeconds: number
): void {
  const properties: GarmentSessionEndedProperties = {
    garment_slug: garmentSlug,
    garment_name: garmentName,
    mode,
    user_role: userRole,
    duration_seconds: Math.round(durationSeconds * 100) / 100, // Round to 2 decimals
  }
  
  posthog.capture("garment_session_ended", properties)
}

/**
 * Track when a user clicks on a specific action/CTA for a garment
 * 
 * @param garmentSlug - Unique identifier for the garment
 * @param garmentName - Display name of the garment
 * @param mode - Current view mode
 * @param userRole - User role if authenticated
 * @param actionType - Type of action clicked
 */
export function trackGarmentActionClicked(
  garmentSlug: string,
  garmentName: string,
  mode: AnalyticsMode,
  userRole: AnalyticsUserRole,
  actionType: GarmentActionType
): void {
  const properties: GarmentActionClickedProperties = {
    garment_slug: garmentSlug,
    garment_name: garmentName,
    mode,
    user_role: userRole,
    action_type: actionType,
  }
  
  posthog.capture("garment_action_clicked", properties)
}

// ============================================
// SESSION TIMING UTILITIES
// ============================================

/**
 * Session tracker for measuring time spent on a garment
 */
export interface GarmentSession {
  garmentSlug: string
  garmentName: string
  mode: AnalyticsMode
  userRole: AnalyticsUserRole
  startTime: number
}

/**
 * Start tracking a garment session
 */
export function startGarmentSession(
  garmentSlug: string,
  garmentName: string,
  mode: AnalyticsMode,
  userRole: AnalyticsUserRole = null
): GarmentSession {
  return {
    garmentSlug,
    garmentName,
    mode,
    userRole,
    startTime: Date.now(),
  }
}

/**
 * End a garment session and track the duration
 */
export function endGarmentSession(session: GarmentSession | null): void {
  if (!session) return
  
  const durationMs = Date.now() - session.startTime
  const durationSeconds = durationMs / 1000
  
  // Only track if session was at least 0.5 seconds (avoid accidental clicks)
  if (durationSeconds >= 0.5) {
    trackGarmentSessionEnded(
      session.garmentSlug,
      session.garmentName,
      session.mode,
      session.userRole,
      durationSeconds
    )
  }
}
