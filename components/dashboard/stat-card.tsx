import * as React from "react";

import { TrendIndicator } from "@/components/common/indicators";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { MetricSummary } from "@/types";

function formatValue(metric: MetricSummary) {
  switch (metric.format) {
    case "percent":
      return formatPercent(metric.value);
    case "currency":
      return formatCurrency(metric.value);
    case "duration":
      return `${metric.value}d`;
    default:
      return formatNumber(metric.value);
  }
}

export function StatCard({
  metric,
  className,
  invertDelta = false,
}: {
  metric: MetricSummary;
  className?: string;
  invertDelta?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 border-border bg-card p-4 transition-colors hover:bg-accent/25",
        className,
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{metric.label}</p>
      <p className="text-[26px] leading-none font-semibold tracking-tight tabular-nums">{formatValue(metric)}</p>
      <div className="mt-auto flex items-center gap-2 pt-1">
        <TrendIndicator value={metric.deltaPct} invert={invertDelta} />
        <span className="truncate text-[12px] text-muted-foreground">{metric.context}</span>
      </div>
    </div>
  );
}

/** Metric row rendered as a single bordered strip rather than six floating cards. */
export function StatGrid({ metrics }: { metrics: MetricSummary[] }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
      {metrics.map((metric) => (
        <StatCard key={metric.key} metric={metric} invertDelta={metric.key === "time_to_close"} />
      ))}
    </div>
  );
}
