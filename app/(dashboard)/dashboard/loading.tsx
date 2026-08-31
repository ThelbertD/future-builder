import { PageContainer } from "@/components/layout/page-container";
import { ChartSkeleton, StatCardSkeleton } from "@/components/common/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <ChartSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </PageContainer>
  );
}
