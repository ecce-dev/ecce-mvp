"use client"

import { createContext, useContext, useState, useCallback, useEffect, useTransition, useMemo, useRef, type ReactNode } from "react";
import { useDevice, type DeviceType } from "@/lib/hooks/useDevice";
import { getRandomGarments, getGarmentsBySlugs, type GarmentNode } from "@/lib/actions/getGarments";

/** Number of garments to display per device type */
const GARMENT_COUNT_BY_DEVICE: Record<DeviceType, number> = {
  desktop: 3,
  tablet: 2,
  mobile: 1,
} as const;

/** Simplified garment data for tracking purposes */
export interface GarmentTrackingData {
  slug: string;
  name: string;
}

interface GarmentsContextValue {
  /** Currently displayed garments */
  garments: GarmentNode[];
  /** Previously displayed garments (before last refresh) */
  previousGarments: GarmentTrackingData[];
  /** Whether garments are currently being fetched */
  isLoading: boolean;
  /** Current device type */
  deviceType: DeviceType;
  /** Number of garments being displayed based on device */
  garmentCount: number;
  /** Refresh garments with new random selection, returns tracking data for analytics */
  refreshGarments: () => Promise<{ previous: GarmentTrackingData[]; current: GarmentTrackingData[] }>;
  /** Re-fetch the same garments (e.g. after login to get private fields) */
  reloadGarments: () => Promise<GarmentNode[]>;
}

const GarmentsContext = createContext<GarmentsContextValue | null>(null);

interface GarmentsProviderProps {
  children: ReactNode;
  /** Initial garments from server-side rendering */
  initialGarments: GarmentNode[];
}

/**
 * Extract tracking data from garment nodes
 */
function extractTrackingData(garments: GarmentNode[]): GarmentTrackingData[] {
  return garments.map((garment) => ({
    slug: garment.slug ?? '',
    name: garment.garmentFields?.name ?? '',
  }));
}

/**
 * Extract slugs from garment nodes for exclusion
 */
function extractSlugs(garments: GarmentNode[]): string[] {
  return garments
    .map((garment) => garment.slug)
    .filter((slug): slug is string => Boolean(slug));
}

/**
 * Check if any new garments overlap with already shown garments
 * Used to detect when we've cycled through all available garments
 */
function hasOverlap(newSlugs: string[], shownSlugs: Set<string>): boolean {
  return newSlugs.some((slug) => shownSlugs.has(slug));
}

/**
 * Provider component for garments state management
 * 
 * Handles:
 * - Responsive garment count based on device type
 * - Random garment refresh via server action
 * - Loading states during transitions
 * - Tracking of previous garments for analytics
 * - Memory of all shown garments to prevent repetition until all have been shown
 */
export function GarmentsProvider({ children, initialGarments }: GarmentsProviderProps) {
  const { deviceType } = useDevice();
  const [garments, setGarments] = useState<GarmentNode[]>(initialGarments);
  const [previousGarments, setPreviousGarments] = useState<GarmentTrackingData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track all shown garment slugs to implement "deck shuffle" behavior
  // Uses Set for O(1) lookup performance and useRef to avoid re-renders
  const shownSlugsRef = useRef<Set<string>>(new Set(extractSlugs(initialGarments)));

  // Calculate target garment count based on device
  const targetCount = GARMENT_COUNT_BY_DEVICE[deviceType];

  /**
   * Fetch new random garments from server, excluding all previously shown garments
   * Uses React transition for non-blocking updates
   *
   * Memory behavior (deck shuffle without replacement):
   * - Excludes all garments that have been shown since last reset
   * - When new garments include already-shown ones, the deck has cycled through
   * - Memory resets to only the new garments when a cycle is detected
   *
   * @param count - Number of garments to fetch
   * @param excludeSlugs - All slugs to exclude from selection (soft constraint)
   * @param currentSlugs - Slugs currently on screen (hard constraint — never returned)
   * @param shouldUpdateMemory - Whether to update shown garments memory (false for device changes)
   * @returns Promise with previous and current tracking data
   */
  const fetchGarments = useCallback(async (
    count: number,
    excludeSlugs: string[] = [],
    currentSlugs: string[] = [],
    shouldUpdateMemory: boolean = true
  ): Promise<{ previous: GarmentTrackingData[]; current: GarmentTrackingData[] }> => {
    // Capture previous state before transition
    const previousTrackingData = extractTrackingData(garments);

    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const newGarments = await getRandomGarments(count, excludeSlugs, currentSlugs);
          const newSlugs = extractSlugs(newGarments);

          setGarments(newGarments);
          setPreviousGarments(previousTrackingData);

          // Update memory if this is a user-initiated refresh
          if (shouldUpdateMemory) {
            const currentShown = shownSlugsRef.current;

            // Check if any new garments were already shown (cycle completed)
            if (hasOverlap(newSlugs, currentShown)) {
              // Reset memory - start fresh with only the new garments
              shownSlugsRef.current = new Set(newSlugs);
            } else {
              // Add new garments to memory
              newSlugs.forEach((slug) => currentShown.add(slug));
            }
          }

          resolve({
            previous: previousTrackingData,
            current: extractTrackingData(newGarments),
          });
        } catch (error) {
          console.error("Failed to fetch garments:", error);
          // Keep existing garments on error, return empty tracking data
          resolve({
            previous: previousTrackingData,
            current: extractTrackingData(garments),
          });
        }
      });
    });
  }, [garments]);

  /**
   * Refresh garments with new random selection (deck shuffle behavior)
   * 
   * Excludes all previously shown garments to ensure no garment repeats
   * until all available garments have been displayed once.
   * 
   * Called when user clicks "Explore" button
   * @returns Promise with previous and current tracking data for analytics
   */
  const refreshGarments = useCallback(async (): Promise<{ previous: GarmentTrackingData[]; current: GarmentTrackingData[] }> => {
    // Convert Set to array for the server action
    const excludeSlugs = Array.from(shownSlugsRef.current);
    // Pass currently displayed slugs as hard exclusion so the server never returns them
    const currentSlugs = extractSlugs(garments);
    return fetchGarments(targetCount, excludeSlugs, currentSlugs, true);
  }, [fetchGarments, targetCount, garments]);

  /**
   * Re-fetch the same garments by their slugs
   * Used after login/logout to get updated field visibility
   */
  const reloadGarments = useCallback(async (): Promise<GarmentNode[]> => {
    const currentSlugs = extractSlugs(garments);
    const reloaded = await getGarmentsBySlugs(currentSlugs);
    setGarments(reloaded);
    return reloaded;
  }, [garments]);

  /**
   * Adjust garment count when device type changes
   * Only runs after initial hydration to prevent SSR mismatch
   * Note: Device change doesn't update shown memory as it's not user-initiated
   */
  useEffect(() => {
    // Skip first effect to prevent SSR hydration mismatch
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    // Adjust garments if count differs from target
    if (garments.length > targetCount) {
      // Too many garments - slice to preserve existing garments (especially URL-linked ones at index 0)
      const sliced = garments.slice(0, targetCount);
      setGarments(sliced);
      // Reset shown memory to only the actually displayed garments
      // Without this, SSR garments that were never shown on mobile pollute the exclusion list
      shownSlugsRef.current = new Set(extractSlugs(sliced));
    } else if (garments.length < targetCount) {
      // Too few garments - fetch more, don't exclude or update memory on device change
      fetchGarments(targetCount, [], [], false);
    }
  }, [targetCount, isInitialized, garments.length, fetchGarments]);

  const contextValue = useMemo<GarmentsContextValue>(() => ({
    garments,
    previousGarments,
    isLoading: isPending,
    deviceType,
    garmentCount: targetCount,
    refreshGarments,
    reloadGarments,
  }), [garments, previousGarments, isPending, deviceType, targetCount, refreshGarments, reloadGarments]);

  return (
    <GarmentsContext.Provider value={contextValue}>
      {children}
    </GarmentsContext.Provider>
  );
}

/**
 * Hook to access garments context
 * Must be used within a GarmentsProvider
 */
export function useGarments(): GarmentsContextValue {
  const context = useContext(GarmentsContext);
  
  if (!context) {
    throw new Error("useGarments must be used within a GarmentsProvider");
  }
  
  return context;
}

/**
 * Get garment count for a given device type
 * Useful for server-side rendering decisions
 */
export function getGarmentCountForDevice(deviceType: DeviceType): number {
  return GARMENT_COUNT_BY_DEVICE[deviceType];
}

