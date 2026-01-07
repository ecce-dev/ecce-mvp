import Background from "@/lib/components/Background";
import GarmentsWrapper from "@/lib/components/GarmentsWrapper";
import PageContainer from "@/lib/components/PageContainer";
import UIElements from "@/lib/components/UIElements";


export default async function Home() {
  return (
    <PageContainer>
      <Background />
      <GarmentsWrapper />
      <UIElements />
    </PageContainer>
  );
}
