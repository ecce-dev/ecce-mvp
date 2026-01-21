import { getAboutContent, getContactContent } from "@/lib/actions/getGlobalSettings";
import Background from "@/lib/components/shared/Background";
import { EcceDialogWrapper } from "@/lib/components/ecce-elements/EcceDialogWrapper";
import GarmentsClient from "@/lib/components/r3f/GarmentsClient";
import GarmentsWrapper from "@/lib/components/r3f/GarmentsWrapper";
import PageContainer from "@/lib/components/shared/PageContainer";
import UIElementsRouter from "@/lib/components/ui-elements/UIElementsRouter";


export default async function Home() {
  const aboutContent = await getAboutContent();
  const contactContent = await getContactContent();
  
  return (
    <PageContainer>
      {/* GarmentsWrapper provides context to both GarmentsClient and UIElementsRouter */}
      <GarmentsWrapper>
        {/* EcceDialogWrapper provides dialog context to canvas and UI components */}
        <EcceDialogWrapper>
          <Background />
          <GarmentsClient />
          <UIElementsRouter
            aboutContent={aboutContent ?? null}
            contactContent={contactContent ?? null}
          />
        </EcceDialogWrapper>
      </GarmentsWrapper>
    </PageContainer>
  );
}
