import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppointmentsLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-[540px] w-full" />
    </PageContainer>
  );
}
