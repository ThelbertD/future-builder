import { BoardSkeleton } from "@/components/common/loading-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-48" />
      <BoardSkeleton />
    </PageContainer>
  );
}
