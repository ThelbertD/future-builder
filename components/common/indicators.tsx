import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { INTENT_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { cn, formatDelta } from "@/lib/utils";
import type { IntentLevel, LeadStatus } from "@/types";

const INTENT_STYLES: Record<IntentLevel, string> = {
  hot: "border-priority-hot/30 bg-priority-hot/10 text-priority-hot",
  high: "border-priority-high/30 bg-priority-high/10 text-priority-high",
  medium: "border-priority-medium/30 bg-priority-medium/10 text-priority-medium",
  low: "border-border bg-muted text-muted-foreground",
};

export function IntentBadge({ intent, className }: { intent: IntentLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
        INTENT_STYLES[intent],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {INTENT_LABELS[intent]}
    </span>
  );
}

const STATUS_VARIANTS: Record<LeadStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  new: "outline",
  qualified: "primary",
  ready: "primary",
  contacted: "default",
  replied: "default",
  interested: "success",
  booked: "success",
  call_completed: "success",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "destructive",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={className}>
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Score with a hairline meter — reads faster than a number alone in a dense table. */
export function ScoreMeter({
  score,
  className,
  showBar = true,
}: {
  score: number;
  className?: string;
  showBar?: boolean;
}) {
  const tone =
    score >= 90 ? "bg-priority-hot" : score >= 78 ? "bg-priority-high" : score >= 64 ? "bg-primary" : "bg-muted-foreground";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="w-6 font-mono text-[13px] font-medium tabular-nums">{score}</span>
      {showBar ? (
        <span className="h-1 w-10 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className={cn("block h-full rounded-full", tone)} style={{ width: `${score}%` }} />
        </span>
      ) : null}
    </div>
  );
}

export function TrendIndicator({
  value,
  className,
  invert = false,
}: {
  value: number;
  className?: string;
  invert?: boolean;
}) {
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
        neutral ? "text-muted-foreground" : positive ? "text-success" : "text-destructive",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {formatDelta(value)}
    </span>
  );
}

export function StageDot({ colorToken, className }: { colorToken: string; className?: string }) {
  return (
    <span
      className={cn("size-1.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: `var(--${colorToken})` }}
      aria-hidden
    />
  );
}

export function SourceBadge({ source, className }: { source: string; className?: string }) {
  return (
    <span className={cn("text-[12px] text-muted-foreground", className)}>{source}</span>
  );
}
