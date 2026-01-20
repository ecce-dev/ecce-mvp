"use client"

import UIElementsGarment from "./UIElementsGarment"

/**
 * Public UI Elements for garment detail view
 * 
 * Wrapper component that uses the unified UIElementsGarment component
 * with mode="public" to maintain backward compatibility.
 * 
 * Layout:
 * - Top Left: Back button, Description trigger, TikTok button
 * - Top Center: Garment name
 * - Top Right: Mode switch (Public/Research)
 */
export default function UIElementsPublic() {
  return <UIElementsGarment mode="public" />
}
