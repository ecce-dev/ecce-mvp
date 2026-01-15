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
  trackRequestSubmitted,
  startGarmentSession,
  endGarmentSession,
  type AnalyticsMode,
  type AnalyticsUserRole,
  type GarmentActionType,
  type GarmentSession,
} from "./tracking"

// Hooks
export { useGarmentSessionTracking } from "./useGarmentSessionTracking"
