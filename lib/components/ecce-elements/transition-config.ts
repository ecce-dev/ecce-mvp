export const transitionConfig = {
  // Removed scale() to prevent position shifts when switching between dialogs
  // Scale causes layout shifts when multiple dialogs transition simultaneously
  from: { opacity: 0, transform: "translateY(-0px)" },
  enter: { opacity: 1, transform: "translateY(0px)" },
  leave: { opacity: 0, transform: "translateY(-0px)" },
  config: { tension: 2400, friction: 70 },
  // Clean up finished transitions to prevent interference
  exitBeforeEnter: true,
  expires: true,
}

/**
 * Transition config for switching between UI element views
 * (UIElements ↔ UIElementsPublic ↔ UIElementsResearch)
 * 
 * Uses crossfade with subtle vertical movement for elegant transitions
 */
export const uiElementsTransitionConfig = {
  from: { opacity: 0.2, transform: "translateY(0px)" },
  enter: { opacity: 1, transform: "translateY(0px)" },
  leave: { opacity: 0.2, transform: "translateY(-0px)" },
  // config: { tension: 280, friction: 26 },
  config: { tension: 2400, friction: 70 },
  exitBeforeEnter: true,
  expires: true,
}