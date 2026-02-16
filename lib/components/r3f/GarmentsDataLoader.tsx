import { getRandomGarments, getGarmentBySlug } from "@/lib/actions/getGarments";
import { GarmentsProvider } from "@/lib/context/GarmentsContext";

/** Default garment count for SSR (desktop baseline) */
const DEFAULT_SSR_GARMENT_COUNT = 3;

interface GarmentsDataLoaderProps {
  children: React.ReactNode;
  garmentSlug?: string;
}

/**
 * Garments data fetcher component wrapped in Suspense for streaming SSR.
 * This allows the page shell to render immediately while garments load.
 *
 * When a garmentSlug is provided (from URL), ensures that garment is included
 * in the initial set even if it has excludeOnHomepage set to true.
 */
export default async function GarmentsDataLoader({ children, garmentSlug }: GarmentsDataLoaderProps) {
  const initialGarments = await getRandomGarments(DEFAULT_SSR_GARMENT_COUNT);

  // If a specific garment is requested via URL and not already in the initial set,
  // replace the first random garment to keep the count consistent with DEFAULT_SSR_GARMENT_COUNT.
  // This prevents the device count adjustment from replacing all garments and losing the linked one.
  if (garmentSlug && !initialGarments.some((g) => g.slug === garmentSlug)) {
    const linkedGarment = await getGarmentBySlug(garmentSlug);
    if (linkedGarment) {
      initialGarments[0] = linkedGarment;
    }
  }

  return (
    <GarmentsProvider initialGarments={initialGarments}>
      {children}
    </GarmentsProvider>
  );
}
