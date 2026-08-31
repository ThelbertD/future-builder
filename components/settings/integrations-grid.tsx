"use client";

import * as React from "react";
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  Database,
  Linkedin,
  Mail,
  MessageSquare,
  Settings2,
  Sparkles,
  TriangleAlert,
  Video,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatRelative } from "@/lib/utils";
import type { Integration, IntegrationStatus } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  Database,
  Sparkles,
  Brain,
  CalendarDays,
  Video,
  Mail,
  Webhook,
  MessageSquare,
  Linkedin,
};

const STATUS_META: Record<IntegrationStatus, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  connected: { label: "Connected", variant: "success" },
  available: { label: "Available", variant: "outline" },
  coming_soon: { label: "Coming soon", variant: "default" },
  error: { label: "Action needed", variant: "destructive" },
};

const CATEGORIES = ["All", "Data", "AI", "Calendar", "Email", "Developer"] as const;

export function IntegrationsGrid({ integrations }: { integrations: Integration[] }) {
  const [category, setCategory] = React.useState<string>("All");
  const [state, setState] = React.useState(integrations);

  const visible = state.filter((integration) => category === "All" || integration.category === category);

  const connect = (integration: Integration) => {
    setState((current) =>
      current.map((item) =>
        item.id === integration.id
          ? { ...item, status: "connected", connectedAt: new Date().toISOString() }
          : item,
      ),
    );
    toast.success(`${integration.name} connected`, {
      description: "Credentials are stored server-side and never sent to the browser.",
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          {CATEGORIES.map((item) => (
            <TabsTrigger key={item} value={item}>
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((integration) => {
          const Icon = ICONS[integration.icon] ?? Database;
          const meta = STATUS_META[integration.status];

          return (
            <Card key={integration.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    integration.status === "connected"
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium">{integration.name}</p>
                    <Badge variant={meta.variant} className="ml-auto">
                      {integration.status === "connected" ? <CheckCircle2 /> : null}
                      {integration.status === "error" ? <TriangleAlert /> : null}
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{integration.description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                {integration.status === "connected" ? (
                  <>
                    <span className="text-[11px] text-muted-foreground">
                      {integration.connectedAt ? `Connected ${formatRelative(integration.connectedAt)}` : "Connected"}
                    </span>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Settings2 />
                      Settings
                    </Button>
                  </>
                ) : integration.status === "coming_soon" ? (
                  <Button variant="outline" size="sm" disabled className="ml-auto">
                    Coming soon
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={integration.status === "error" ? "destructive" : "default"}
                    className="ml-auto"
                    onClick={() => connect(integration)}
                  >
                    {integration.status === "error" ? "Reconnect" : "Connect"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
