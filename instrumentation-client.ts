// Defer PostHog initialization to avoid blocking initial page load
// Use dynamic import to prevent PostHog from being bundled in initial load
// Initialize after page is marked as ready
if (typeof window !== 'undefined') {
  let posthogInstance: typeof import("posthog-js").default | null = null;
  let isInitializing = false;

  // Dynamically load PostHog
  const loadPostHog = async () => {
    if (posthogInstance) return posthogInstance;
    if (isInitializing) {
      // Wait for ongoing initialization
      return new Promise<typeof import("posthog-js").default>((resolve) => {
        const checkInterval = setInterval(() => {
          if (posthogInstance) {
            clearInterval(checkInterval);
            resolve(posthogInstance);
          }
        }, 50);
      });
    }
    
    isInitializing = true;
    try {
      const posthog = await import("posthog-js");
      posthogInstance = posthog.default;
      return posthogInstance;
    } finally {
      isInitializing = false;
    }
  };

  // Wait for page-ready event or initialize after delay as fallback
  const initPostHog = async () => {
    const posthog = await loadPostHog();
    if ((posthog as any).__loaded) return; // Already initialized
    
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
    // Page already loaded, defer initialization until browser is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initPostHog, { timeout: 2000 });
    } else {
      setTimeout(initPostHog, 100);
    }
  } else {
    // Wait for page-ready event
    window.addEventListener('page-ready', () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initPostHog, { timeout: 2000 });
      } else {
        setTimeout(initPostHog, 100);
      }
    }, { once: true });
    // Fallback: initialize after 2 seconds if event hasn't fired
    setTimeout(() => {
      const posthog = posthogInstance;
      if (posthog && !(posthog as any).__loaded) {
        initPostHog();
      }
    }, 2000);
  }
}
