/**
 * PostHog utility with dynamic loading
 * 
 * Prevents PostHog from being bundled in the initial JavaScript bundle.
 * All PostHog functionality is loaded dynamically after initial page load.
 */

let posthogInstance: typeof import("posthog-js").default | null = null;
let loadPromise: Promise<typeof import("posthog-js").default> | null = null;

/**
 * Dynamically loads PostHog library
 * Returns a promise that resolves to the PostHog instance
 */
export async function loadPostHog(): Promise<typeof import("posthog-js").default> {
  if (posthogInstance) {
    return posthogInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = import("posthog-js").then((mod) => {
    posthogInstance = mod.default;
    return posthogInstance;
  });

  return loadPromise;
}

/**
 * Gets the PostHog instance, loading it if necessary
 * Use this for operations that require PostHog to be loaded
 */
export async function getPostHog() {
  return loadPostHog();
}

/**
 * Safely calls a PostHog method
 * If PostHog isn't loaded yet, it will be loaded first
 */
export async function callPostHog<T>(
  method: (posthog: typeof import("posthog-js").default) => T | Promise<T>
): Promise<T | null> {
  try {
    const posthog = await loadPostHog();
    return await method(posthog);
  } catch (error) {
    console.error("PostHog operation failed:", error);
    return null;
  }
}

/**
 * Fire-and-forget PostHog operations
 * These don't block and will execute when PostHog is loaded
 */
export function postHogCapture(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  // Defer until after initial render
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      callPostHog((posthog) => {
        posthog.capture(event, properties);
      });
    }, { timeout: 2000 });
  } else {
    setTimeout(() => {
      callPostHog((posthog) => {
        posthog.capture(event, properties);
      });
    }, 100);
  }
}
