"use client"

import { createContext, useContext, useState, useCallback, useEffect, useTransition, useMemo, type ReactNode } from "react";
import { useDevice, type DeviceType } from "@/lib/hooks/useDevice";
import { getRandomGarments, type GarmentNode } from "@/lib/actions/getGarments";

/** Number of garments to display per device type */
const GARMENT_COUNT_BY_DEVICE: Record<DeviceType, number> = {
  desktop: 3,
  tablet: 2,
  mobile: 1,
} as const;

interface GarmentsContextValue {
  /** Currently displayed garments */
  garments: GarmentNode[];
  /** Whether garments are currently being fetched */
  isLoading: boolean;
  /** Current device type */
  deviceType: DeviceType;
  /** Number of garments being displayed based on device */
  garmentCount: number;
  /** Refresh garments with new random selection */
  refreshGarments: () => void;
}

const GarmentsContext = createContext<GarmentsContextValue | null>(null);

interface GarmentsProviderProps {
  children: ReactNode;
  /** Initial garments from server-side rendering */
  initialGarments: GarmentNode[];
}

/**
 * Provider component for garments state management
 * 
 * Handles:
 * - Responsive garment count based on device type
 * - Random garment refresh via server action
 * - Loading states during transitions
 */
export function GarmentsProvider({ children, initialGarments }: GarmentsProviderProps) {
  const { deviceType } = useDevice();
  const [garments, setGarments] = useState<GarmentNode[]>(initialGarments);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate target garment count based on device
  const targetCount = GARMENT_COUNT_BY_DEVICE[deviceType];

  /**
   * Fetch new random garments from server
   * Uses React transition for non-blocking updates
   */
  const fetchGarments = useCallback(async (count: number) => {
    startTransition(async () => {
      try {
        const newGarments = await getRandomGarments(count);
        setGarments(newGarments);
      } catch (error) {
        console.error("Failed to fetch garments:", error);
        // Keep existing garments on error
      }
    });
  }, []);

  /**
   * Refresh garments with new random selection
   * Called when user clicks "Explore" button
   */
  const refreshGarments = useCallback(() => {
    fetchGarments(targetCount);
  }, [fetchGarments, targetCount]);

  /**
   * Adjust garment count when device type changes
   * Only runs after initial hydration to prevent SSR mismatch
   */
  useEffect(() => {
    // Skip first effect to prevent SSR hydration mismatch
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    // Adjust garments if count differs from target
    if (garments.length !== targetCount) {
      fetchGarments(targetCount);
    }
  }, [targetCount, isInitialized, garments.length, fetchGarments]);

  const contextValue = useMemo<GarmentsContextValue>(() => ({
    garments,
    isLoading: isPending,
    deviceType,
    garmentCount: targetCount,
    refreshGarments,
  }), [garments, isPending, deviceType, targetCount, refreshGarments]);

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

