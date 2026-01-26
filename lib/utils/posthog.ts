import posthog from "posthog-js";

// /**
//  * Safely calls a PostHog method
//  * If PostHog isn't loaded yet, it will be loaded first
//  */
// export async function callPostHog<T>(
//   method: (posthog: typeof import("posthog-js").default) => T | Promise<T>
// ): Promise<T | null> {
//   try {
//     return await method(posthog);
//   } catch (error) {
//     console.error("PostHog operation failed:", error);
//     return null;
//   }
// }

/**
 * Fire-and-forget PostHog operations
 * These don't block and will execute when PostHog is loaded
 */
export function postHogCapture(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
  
  // // Defer until after initial render
  // if (typeof requestIdleCallback !== 'undefined') {
  //   requestIdleCallback(() => {
  //     callPostHog((posthog) => {
  //       posthog.capture(event, properties);
  //     });
  //   }, { timeout: 2000 });
  // } else {
  //   setTimeout(() => {
  //     callPostHog((posthog) => {
  //       posthog.capture(event, properties);
  //     });
  //   }, 100);
  // }
}
