import { getAboutContent, getContactContent } from "@/lib/actions/getGlobalSettings";
import Background from "@/lib/components/Background";
import { EcceDialogWrapper } from "@/lib/components/EcceDialogWrapper";
import GarmentsClient from "@/lib/components/GarmentsClient";
import GarmentsWrapper from "@/lib/components/GarmentsWrapper";
import PageContainer from "@/lib/components/PageContainer";
import UIElementsRouter from "@/lib/components/UIElementsRouter";


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
