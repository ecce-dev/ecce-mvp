import posthog from "posthog-js"

// Initialize PostHog client
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com", // Required for session replay, surveys, etc.
  defaults: '2025-11-30',
  // capture_exceptions: true, // Enables capturing exceptions via Error Tracking
  // debug: process.env.NODE_ENV === "development",
  cookieless_mode: 'on_reject'
});