"use client"

import { createContext, useContext, useState, useCallback, useEffect, useTransition, useMemo, useRef, type ReactNode } from "react";
import { useDevice, type DeviceType } from "@/lib/hooks/useDevice";
import { getRandomGarments, type GarmentNode } from "@/lib/actions/getGarments";

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
 * Provider component for garments state management
 * 
 * Handles:
 * - Responsive garment count based on device type
 * - Random garment refresh via server action
 * - Loading states during transitions
 * - Tracking of previous garments for analytics
 * - Exclusion of previous garments from new selections (when possible)
 */
export function GarmentsProvider({ children, initialGarments }: GarmentsProviderProps) {
  const { deviceType } = useDevice();
  const [garments, setGarments] = useState<GarmentNode[]>(initialGarments);
  const [previousGarments, setPreviousGarments] = useState<GarmentTrackingData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use ref to track current garment slugs for exclusion without causing re-renders
  const currentSlugsRef = useRef<string[]>(extractSlugs(initialGarments));

  // Calculate target garment count based on device
  const targetCount = GARMENT_COUNT_BY_DEVICE[deviceType];

  /**
   * Fetch new random garments from server, excluding current garments when possible
   * Uses React transition for non-blocking updates
   * @param count - Number of garments to fetch
   * @param excludeSlugs - Slugs to exclude from selection
   * @returns Promise with previous and current tracking data
   */
  const fetchGarments = useCallback(async (
    count: number,
    excludeSlugs: string[] = []
  ): Promise<{ previous: GarmentTrackingData[]; current: GarmentTrackingData[] }> => {
    // Capture previous state before transition
    const previousTrackingData = extractTrackingData(garments);
    
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const newGarments = await getRandomGarments(count, excludeSlugs);
          setGarments(newGarments);
          setPreviousGarments(previousTrackingData);
          currentSlugsRef.current = extractSlugs(newGarments);
          
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
   * Refresh garments with new random selection
   * Excludes currently displayed garments to ensure variety
   * Called when user clicks "Explore" button
   * @returns Promise with previous and current tracking data for analytics
   */
  const refreshGarments = useCallback(async (): Promise<{ previous: GarmentTrackingData[]; current: GarmentTrackingData[] }> => {
    return fetchGarments(targetCount, currentSlugsRef.current);
  }, [fetchGarments, targetCount]);

  /**
   * Adjust garment count when device type changes
   * Only runs after initial hydration to prevent SSR mismatch
   * Note: Device change doesn't exclude current garments as it's not user-initiated
   */
  useEffect(() => {
    // Skip first effect to prevent SSR hydration mismatch
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    // Adjust garments if count differs from target
    if (garments.length !== targetCount) {
      // Don't exclude on device change - just adjust count
      fetchGarments(targetCount, []);
    }
  }, [targetCount, isInitialized, garments.length, fetchGarments]);

  const contextValue = useMemo<GarmentsContextValue>(() => ({
    garments,
    previousGarments,
    isLoading: isPending,
    deviceType,
    garmentCount: targetCount,
    refreshGarments,
  }), [garments, previousGarments, isPending, deviceType, targetCount, refreshGarments]);

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

