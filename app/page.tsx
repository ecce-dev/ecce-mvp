import { getAboutContent, getContactContent, getLegalRightsContent, getPublicDomainTextContent } from "@/lib/actions/getGlobalSettings";
import { getRandomGarments } from "@/lib/actions/getGarments";
import Background from "@/lib/components/shared/Background";
import { EcceDialogWrapper } from "@/lib/components/ecce-elements/EcceDialogWrapper";
import GarmentsClient from "@/lib/components/r3f/GarmentsClient";
import { GarmentsProvider } from "@/lib/context/GarmentsContext";
import PageContainer from "@/lib/components/shared/PageContainer";
import UIElementsRouter from "@/lib/components/ui-elements/UIElementsRouter";

/** Default garment count for SSR (desktop baseline) */
const DEFAULT_SSR_GARMENT_COUNT = 3;

export default async function Home() {
  // Parallelize ALL server actions including garments to avoid blocking SSR
  const [aboutContent, contactContent, legalRightsContent, publicDomainTextContent, initialGarments] = await Promise.all([
    getAboutContent(),
    getContactContent(),
    getLegalRightsContent(),
    getPublicDomainTextContent(),
    getRandomGarments(DEFAULT_SSR_GARMENT_COUNT),
  ]);
  
  return (
    <PageContainer>
      {/* GarmentsProvider provides context to both GarmentsClient and UIElementsRouter */}
      <GarmentsProvider initialGarments={initialGarments}>
        {/* EcceDialogWrapper provides dialog context to canvas and UI components */}
        <EcceDialogWrapper>
          <Background />
          <GarmentsClient />
          <UIElementsRouter
            aboutContent={aboutContent ?? null}
            contactContent={contactContent ?? null}
            legalRightsContent={legalRightsContent ?? null}
            publicDomainTextContent={publicDomainTextContent ?? null}
          />
        </EcceDialogWrapper>
      </GarmentsProvider>
    </PageContainer>
  );
}
