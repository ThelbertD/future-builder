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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [setup, setSetup] = React.useState<Integration | null>(null);

  const visible = integrations.filter(
    (integration) => category === "All" || integration.category === category,
  );

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
                  {integration.note ? (
                    <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/80">{integration.note}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                {integration.status === "connected" ? (
                  <>
                    <span className="text-[11px] text-muted-foreground">
                      {integration.connectedAt ? `Connected ${formatRelative(integration.connectedAt)}` : "Active"}
                    </span>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={() => setSetup(integration)}>
                      <Settings2 />
                      Settings
                    </Button>
                  </>
                ) : integration.status === "coming_soon" ? (
                  <Button variant="outline" size="sm" disabled className="ml-auto">
                    Coming soon
                  </Button>
                ) : (
                  <Button size="sm" className="ml-auto" onClick={() => setSetup(integration)}>
                    How to connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <SetupDialog integration={setup} onOpenChange={(open) => !open && setSetup(null)} />
    </div>
  );
}

/** Environment variables per integration, so the panel never invents a flow. */
const SETUP_STEPS: Record<string, { vars: string[]; help: string }> = {
  supabase: {
    vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    help: "Project dashboard → Settings → API Keys.",
  },
  openai: { vars: ["OPENAI_API_KEY"], help: "platform.openai.com → API keys." },
  anthropic: { vars: ["ANTHROPIC_API_KEY"], help: "console.anthropic.com → API keys." },
  "email-provider": {
    vars: ["RESEND_API_KEY", "EMAIL_FROM"],
    help: "resend.com → API keys. Verify your sending domain first, then set EMAIL_FROM to an address on it, for example \"Thelbert <hello@futurebuilder.ai>\".",
  },
};

function SetupDialog({
  integration,
  onOpenChange,
}: {
  integration: Integration | null;
  onOpenChange: (open: boolean) => void;
}) {
  const steps = integration ? SETUP_STEPS[integration.id] : undefined;

  return (
    <Dialog open={integration !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{integration?.name}</DialogTitle>
          <DialogDescription>
            Credentials are read from server-side environment variables. They are never stored in the database,
            where any workspace member could read them.
          </DialogDescription>
        </DialogHeader>

        {steps ? (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Environment variables
              </p>
              <ul className="mt-1.5 space-y-1">
                {steps.vars.map((name) => (
                  <li key={name} className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-[12px]">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">{steps.help}</p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Add them to <code className="font-mono text-[11px]">.env.local</code> for development, and to your
              hosting environment for production. A new build is required before they take effect.
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">This integration is not available yet.</p>
        )}

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
