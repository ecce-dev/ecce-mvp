import { getRandomGarments } from "../../actions/getGarments";
import { GarmentsProvider } from "../../context/GarmentsContext";

/** Default garment count for SSR (desktop baseline) */
const DEFAULT_SSR_GARMENT_COUNT = 3;

interface GarmentsWrapperProps {
  children: React.ReactNode;
}

/**
 * Server component that handles initial garment data fetching and context provision
 * 
 * Architecture:
 * - Server: Fetches random garments for initial render (SSR optimized)
 * - Client: GarmentsProvider manages state and responsive updates
 * - Children: Both GarmentsClient and UIElements can access the context
 * 
 * Performance:
 * - Initial data fetched server-side (fast first paint)
 * - Garment list cached for 5 minutes on server
 * - Only GLB files for displayed garments are loaded
 * 
 * Responsive behavior:
 * - SSR uses desktop count (3) as baseline
 * - Client adjusts count after hydration based on actual device
 */
export default async function GarmentsWrapper({ children }: GarmentsWrapperProps) {
  // Fetch random garments server-side for initial render
  // Uses desktop count as baseline; client will adjust if needed
  const initialGarments = await getRandomGarments(DEFAULT_SSR_GARMENT_COUNT);
  
  return (
    <GarmentsProvider initialGarments={initialGarments}>
      {children}
    </GarmentsProvider>
  );
}
