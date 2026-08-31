import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function OutreachLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-44" />
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </PageContainer>
  );
}
