import { getRandomGarments } from "@/lib/actions/getGarments";
import { GarmentsProvider } from "@/lib/context/GarmentsContext";

/** Default garment count for SSR (desktop baseline) */
const DEFAULT_SSR_GARMENT_COUNT = 3;

/**
 * Garments data fetcher component wrapped in Suspense for streaming SSR.
 * This allows the page shell to render immediately while garments load.
 */
export default async function GarmentsDataLoader({ children }: { children: React.ReactNode }) {
  const initialGarments = await getRandomGarments(DEFAULT_SSR_GARMENT_COUNT);
  return (
    <GarmentsProvider initialGarments={initialGarments}>
      {children}
    </GarmentsProvider>
  );
}
