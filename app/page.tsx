import { Suspense } from "react";
import dynamic from "next/dynamic";
import Background from "@/lib/components/shared/Background";
import GarmentsDataLoader from "@/lib/components/r3f/GarmentsDataLoader";
import GarmentsLoadingFallback from "@/lib/components/r3f/GarmentsLoadingFallback";
import PageContainer from "@/lib/components/shared/PageContainer";

// Lazy load ALL client components to reduce initial bundle size
// These are not needed for LCP and can load after initial render
const EcceDialogWrapper = dynamic(
  () => import("@/lib/components/ecce-elements/EcceDialogWrapper").then(mod => ({ default: mod.EcceDialogWrapper }))
);

const GarmentsClient = dynamic(
  () => import("@/lib/components/r3f/GarmentsClient")
);

const UIContentLoader = dynamic(
  () => import("@/lib/components/ui-elements/UIContentLoader")
);

/**
 * Home page with optimized performance:
 * - Background renders FIRST, completely outside any client components (LCP element)
 * - Garments data streams in via Suspense (non-blocking)
 * - ALL client components lazy load after initial render
 * - Minimal fallback that doesn't block rendering
 * 
 * CRITICAL: Background is rendered FIRST and independently to ensure fast LCP
 */
export default function Home() {
  return (
    <>
      {/* Background renders FIRST - completely independent of any client components */}
      {/* This ensures it can render immediately without waiting for hydration or data */}
      {/* This is the LCP element and must render as fast as possible */}
      <Background />

      {/* Page content wrapped in container - loads after Background */}
      {/* This is deferred and won't block the Background/LCP */}
      {/* Stream garments data with Suspense - page shell renders immediately */}
      {/* Minimal fallback - no heavy components loaded */}
      <Suspense fallback={<GarmentsLoadingFallback>{null}</GarmentsLoadingFallback>}>
        <PageContainer>
          <GarmentsDataLoader>
            {/* Lazy load dialog wrapper and client components after data is ready */}
            <Suspense fallback={null}>
              <EcceDialogWrapper>
                <GarmentsClient />
                {/* UI content lazy loads separately - not blocking */}
                <Suspense fallback={null}>
                  <UIContentLoader />
                </Suspense>
              </EcceDialogWrapper>
            </Suspense>
          </GarmentsDataLoader>
        </PageContainer>
      </Suspense>
    </>
  );
}
