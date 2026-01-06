import { getGarments } from "@/lib/actions/getGarments";
import PageContainer from "@/lib/components/PageContainer";

export default async function Home() {
  const garments = await getGarments();
  console.log(garments);
  return (
    <PageContainer>
      <h1>ecce</h1>
      <p>Discover ecce.</p>
    </PageContainer>
  );
}
