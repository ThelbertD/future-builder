import { TableSkeleton } from "@/components/common/loading-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinderLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-56 w-full" />
      <TableSkeleton rows={6} columns={7} />
    </PageContainer>
  );
}
