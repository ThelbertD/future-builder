"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Pause, Play, Plus, Send, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

import { createCampaignAction, setCampaignStatusAction } from "@/app/(dashboard)/outreach/actions";
import { AIBadge } from "@/components/ai/ai-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICES } from "@/lib/constants";
import { cn, formatNumber, formatPercent, formatRelative } from "@/lib/utils";
import type { Campaign, CampaignStatus } from "@/types";

const STATUS_VARIANTS: Record<CampaignStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  draft: "outline",
  active: "success",
  paused: "warning",
  completed: "default",
};

export function CampaignsView({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = React.useState(campaigns[0]?.id ?? "");
  const [creating, setCreating] = React.useState(false);

  const active = campaigns.find((campaign) => campaign.id === activeId) ?? campaigns[0];

  const toggleStatus = async (campaign: Campaign) => {
    const next: CampaignStatus = campaign.status === "active" ? "paused" : "active";
    const result = await setCampaignStatusAction({ campaignId: campaign.id, status: next });

    if (!result.ok) {
      toast.error("Could not update the campaign", { description: result.error });
      return;
    }

    toast.success(next === "active" ? "Campaign resumed" : "Campaign paused", {
      description:
        next === "active"
          ? "Enrolled leads will continue through the sequence."
          : "No further messages will send until you resume.",
    });
    router.refresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-muted-foreground">Campaigns</h2>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus />
            New
          </Button>
        </div>

        {campaigns.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => setActiveId(campaign.id)}
            className={cn(
              "w-full rounded-lg border p-3 text-left transition-colors",
              campaign.id === active?.id ? "border-primary/40 bg-primary/[0.05]" : "border-border hover:bg-accent/40",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="truncate text-[13px] font-medium">{campaign.name}</span>
              <Badge variant={STATUS_VARIANTS[campaign.status]} className="ml-auto capitalize">
                {campaign.status}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{campaign.audienceSummary}</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
              <span>{formatNumber(campaign.stats.enrolled)} enrolled</span>
              <span>{formatNumber(campaign.stats.replied)} replies</span>
              <span>{campaign.stats.booked} booked</span>
            </div>
          </button>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No campaigns yet"
          description="A campaign enrols qualified leads into a sequence that opens on the problem they named, and stops the moment someone replies."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus />
              Create your first campaign
            </Button>
          }
        />
      ) : null}

      {active ? (
        <div className="space-y-4">
          <Card className="p-0">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-tight">{active.name}</h2>
                  <Badge variant={STATUS_VARIANTS[active.status]} className="capitalize">
                    {active.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {active.audienceSummary} · updated {formatRelative(active.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleStatus(active)}>
                  {active.status === "active" ? <Pause /> : <Play />}
                  {active.status === "active" ? "Pause" : "Resume"}
                </Button>
                <Button variant="outline" size="sm">
                  Edit sequence
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 lg:grid-cols-7 lg:divide-y-0">
              {[
                ["Enrolled", active.stats.enrolled],
                ["Sent", active.stats.sent],
                ["Delivered", active.stats.delivered],
                ["Opened", active.stats.opened],
                ["Replied", active.stats.replied],
                ["Interested", active.stats.interested],
                ["Booked", active.stats.booked],
              ].map(([label, value]) => (
                <div key={label as string} className="p-3">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
                  <p className="mt-1 text-lg leading-none font-semibold tabular-nums">
                    {formatNumber(value as number)}
                  </p>
                  {label === "Replied" && active.stats.sent > 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatPercent((active.stats.replied / active.stats.sent) * 100)} of sent
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Sequence</h3>
                <p className="text-[12px] text-muted-foreground">
                  Every message is written for the specific opportunity — never a bulk blast.
                </p>
              </div>
              <AIBadge label="AI personalised" size="sm" />
            </div>

            <ol className="divide-y divide-border">
              {active.steps.map((step) => (
                <li key={step.id} className="flex gap-3 px-4 py-3">
                  <div className="w-14 shrink-0">
                    <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Day</p>
                    <p className="text-[15px] font-semibold tabular-nums">{step.dayOffset}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[13px] font-medium">
                      <Mail className="size-3 text-muted-foreground" />
                      {step.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Subject: {step.subject}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{step.preview}</p>
                  </div>
                  <div className="hidden w-40 shrink-0 space-y-1 text-right text-[11px] text-muted-foreground tabular-nums sm:block">
                    <p>{formatNumber(step.sent)} sent</p>
                    <p>{formatNumber(step.opened)} opened</p>
                    <p>{formatNumber(step.replied)} replied</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-[15px] font-semibold tracking-tight">Audience</h3>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Minimum AI score</p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px]">
                  <Target className="size-3 text-muted-foreground" />
                  {active.minScore}+
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Services positioned</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {active.services.map((service) => (
                    <Badge key={service} variant="primary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Sending stops automatically when a prospect replies or books.
            </div>
          </Card>
        </div>
      ) : null}

      <NewCampaignDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function NewCampaignDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [minScore, setMinScore] = React.useState("80");
  const [service, setService] = React.useState<string>(SERVICES[0]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    const result = await createCampaignAction({
      name,
      minScore: Number(minScore),
      services: [service],
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not create the campaign.");
      return;
    }

    onOpenChange(false);
    setName("");
    toast.success("Campaign created", {
      description: "It starts as a draft — review the sequence before activating.",
    });
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            Campaigns enrol leads that match your criteria and stop the moment someone replies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">Name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Agency Automation Partners"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-score">Minimum AI score</Label>
            <Input
              id="campaign-score"
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(event) => setMinScore(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Primary service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-[12px] text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={saving} disabled={!name.trim()}>
            Create campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
