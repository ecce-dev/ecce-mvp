/**
 * Analytics module for PostHog tracking
 * 
 * See docs/analytics.md for full documentation
 */

// Tracking functions and types
export {
  trackGarmentSelected,
  trackGarmentSessionEnded,
  trackGarmentActionClicked,
  startGarmentSession,
  endGarmentSession,
  type AnalyticsMode,
  type AnalyticsUserRole,
  type GarmentActionType,
  type GarmentSession,
} from "./tracking"

// Hooks
export { useGarmentSessionTracking } from "./useGarmentSessionTracking"
