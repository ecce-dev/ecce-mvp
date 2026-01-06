import PageContainerWrapper from './PageContainerWrapper';

export default function PageContainer({ children, mainClassName }: { children: React.ReactNode, mainClassName?: string }) {
  return (
    <PageContainerWrapper>
      <main className={`flex w-full h-full flex-col items-center ${mainClassName}`}>
        {children}
      </main>
    </PageContainerWrapper>
  );
}