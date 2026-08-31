import Link from "next/link";
import {
  CalendarCheck,
  FileText,
  MessageSquareReply,
  MoveRight,
  Radar,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { AIBadge } from "@/components/ai/ai-badge";
import { cn, formatRelative } from "@/lib/utils";
import type { Activity, ActivityType } from "@/types";

const ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  lead_discovered: Radar,
  ai_qualified: Sparkles,
  outreach_generated: FileText,
  message_sent: Send,
  reply_received: MessageSquareReply,
  intent_detected: Sparkles,
  stage_changed: MoveRight,
  appointment_booked: CalendarCheck,
  note_added: FileText,
  handoff_requested: TriangleAlert,
};

export function AIActivityFeed({ activities, limit = 8 }: { activities: Activity[]; limit?: number }) {
  const visible = activities.slice(0, limit);

  if (visible.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
        Nothing has happened yet. Activity appears here as the assistant works.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {visible.map((activity) => {
        const Icon = ICONS[activity.type] ?? Sparkles;
        const href = activity.leadId ? `/leads/${activity.leadId}` : "/leads";

        return (
          <li key={activity.id}>
            <Link href={href} className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border",
                  activity.actor === "ai"
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-3" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  {activity.actor === "ai" ? <AIBadge size="sm" /> : null}
                  <span className="truncate text-[13px]">{activity.summary}</span>
                </span>
                {activity.detail ? (
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{activity.detail}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(activity.createdAt)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
