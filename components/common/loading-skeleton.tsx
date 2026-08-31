import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-3 h-3 w-24" />
    </Card>
  );
}

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-4 border-b border-border px-3 py-2.5">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b border-border px-3 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className={cn("h-3 flex-1", colIndex === 0 && "flex-[1.6]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <Skeleton className="h-3 w-32" />
      <div className="mt-6 flex h-48 items-end gap-2">
        {Array.from({ length: 16 }).map((_, index) => (
          <Skeleton key={index} className="flex-1" style={{ height: `${30 + ((index * 37) % 65)}%` }} />
        ))}
      </div>
    </Card>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 5 }).map((_, columnIndex) => (
        <div key={columnIndex} className="w-72 shrink-0 space-y-2">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <Skeleton key={cardIndex} className="h-28 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Skeleton className="h-7 w-64" />
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
        </Card>
        <Card className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
        </Card>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export function ConversationsSkeleton() {
  return (
    <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
      <Skeleton className="h-full min-h-96" />
      <Skeleton className="h-full min-h-96" />
      <Skeleton className="hidden h-full min-h-96 lg:block" />
    </div>
  );
}
