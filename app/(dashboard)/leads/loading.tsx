import { TableSkeleton } from "@/components/common/loading-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-full" />
      <TableSkeleton rows={10} columns={8} />
    </PageContainer>
  );
}
