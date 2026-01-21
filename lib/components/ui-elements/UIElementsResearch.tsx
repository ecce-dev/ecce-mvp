"use client"

import UIElementsGarment from "./UIElementsGarment"

/**
 * Research UI Elements for garment detail view
 * 
 * Wrapper component that uses the unified UIElementsGarment component
 * with mode="research" to maintain backward compatibility.
 * 
 * Extended fields compared to public view:
 * - name, description, provenance, construction
 * - analytics, export functionality
 * 
 * Layout:
 * - Top Left: Back button
 * - Top Right: Mode switch (Public/Research)
 * - Desktop: Two rows
 *   - Row 1: Description, Provenance, Construction, Analytics, Export
 *   - Row 2: Garment name (left), Version and Licensed (right)
 * - Mobile/Tablet: Wrapped flex row with all triggers
 */
export default function UIElementsResearch() {
  return <UIElementsGarment mode="research" />
}
