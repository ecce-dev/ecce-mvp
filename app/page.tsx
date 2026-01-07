import { getAboutContent, getContactContent } from "@/lib/actions/getGlobalSettings";
import Background from "@/lib/components/Background";
import GarmentsWrapper from "@/lib/components/GarmentsWrapper";
import PageContainer from "@/lib/components/PageContainer";
import UIElements from "@/lib/components/UIElements";


export default async function Home() {
  const aboutContent = await getAboutContent();
  const contactContent = await getContactContent();
  return (
    <PageContainer>
      <Background />
      <GarmentsWrapper />
      <UIElements
        aboutContent={aboutContent ?? null}
        contactContent={contactContent ?? null}
      />
    </PageContainer>
  );
}
