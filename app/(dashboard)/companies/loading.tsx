import { TableSkeleton } from "@/components/common/loading-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-48" />
      <TableSkeleton rows={10} columns={7} />
    </PageContainer>
  );
}
