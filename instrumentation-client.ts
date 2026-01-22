import posthog from "posthog-js"

// Defer PostHog initialization to avoid blocking initial page load
// Initialize after page is marked as ready
if (typeof window !== 'undefined') {
  // Wait for page-ready event or initialize after a short delay
  const initPostHog = () => {
    if (posthog.__loaded) return; // Already initialized
    
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com", // Required for session replay, surveys, etc.
      defaults: '2025-11-30',
      // capture_exceptions: true, // Enables capturing exceptions via Error Tracking
      // debug: process.env.NODE_ENV === "development",
      cookieless_mode: 'on_reject',
      loaded: (posthog) => {
        // PostHog is loaded, can start tracking
      }
    });
  };

  // Listen for page-ready event, or initialize after delay as fallback
  if (window.document.readyState === 'complete') {
    // Page already loaded, initialize after a short delay
    setTimeout(initPostHog, 100);
  } else {
    // Wait for page-ready event
    window.addEventListener('page-ready', initPostHog, { once: true });
    // Fallback: initialize after 2 seconds if event hasn't fired
    setTimeout(() => {
      if (!posthog.__loaded) {
        initPostHog();
      }
    }, 2000);
  }
}
