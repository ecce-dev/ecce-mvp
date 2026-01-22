"use client"

import { GarmentsProvider } from "@/lib/context/GarmentsContext";

/**
 * Loading fallback for garments data.
 * Shows the page structure immediately while data streams in.
 * Uses empty array as initial garments to prevent errors.
 */
export default function GarmentsLoadingFallback({ children }: { children: React.ReactNode }) {
  return (
    <GarmentsProvider initialGarments={[]}>
      {children}
    </GarmentsProvider>
  );
}
