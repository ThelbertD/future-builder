"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  Flame,
  MessageSquareReply,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShellData } from "@/components/layout/shell-data";
import { cn, formatRelative } from "@/lib/utils";
import type { NotificationKind } from "@/types";

const ICONS: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  high_intent_lead: Flame,
  ai_qualified: Sparkles,
  prospect_replied: MessageSquareReply,
  appointment_booked: CalendarCheck,
  intent_detected: Sparkles,
  handoff_required: TriangleAlert,
};

const TONES: Record<NotificationKind, string> = {
  high_intent_lead: "text-priority-hot",
  ai_qualified: "text-primary",
  prospect_replied: "text-success",
  appointment_booked: "text-success",
  intent_detected: "text-primary",
  handoff_required: "text-warning",
};

export function NotificationsMenu() {
  const router = useRouter();
  const { notifications } = useShellData();
  const [items, setItems] = React.useState(notifications);
  const unread = items.filter((item) => !item.read).length;

  const markAllRead = () => setItems((current) => current.map((item) => ({ ...item, read: true })));

  const open = (id: string, href: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    router.push(href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
          <Bell />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-[13px] font-medium">Notifications</p>
          <button
            type="button"
            onClick={markAllRead}
            className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
          {items.map((item) => {
            const Icon = ICONS[item.kind];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => open(item.id, item.href)}
                className={cn(
                  "flex w-full gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-accent/60",
                  !item.read && "bg-primary/[0.04]",
                )}
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", TONES[item.kind])} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium">{item.title}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {formatRelative(item.createdAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
