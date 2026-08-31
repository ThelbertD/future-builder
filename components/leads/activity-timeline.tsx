import { AIBadge } from "@/components/ai/ai-badge";
import { formatRelative } from "@/lib/utils";
import type { Activity } from "@/types";

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-[13px] text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-4">
      {activities.map((activity) => (
        <li key={activity.id} className="relative">
          <span className="absolute top-1.5 -left-[21px] size-1.5 rounded-full bg-border ring-4 ring-card" />
          <div className="flex items-center gap-2">
            {activity.actor === "ai" ? <AIBadge size="sm" /> : null}
            <p className="text-[13px]">{activity.summary}</p>
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
              {formatRelative(activity.createdAt)}
            </span>
          </div>
          {activity.detail ? (
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{activity.detail}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
