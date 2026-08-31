"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Building,
  CreditCard,
  KanbanSquare,
  Plug,
  Save,
  Shield,
  Sparkles,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { StageDot } from "@/components/common/indicators";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PipelineStage, User as UserRecord, Workspace, WorkspaceMember } from "@/types";
import { cn, formatDate, initials } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Panel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        <p className="text-[12px] text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4 p-4">{children}</div>
      {footer ? <div className="flex justify-end border-t border-border px-4 py-3">{footer}</div> : null}
    </Card>
  );
}

function SaveButton({ label = "Save changes" }: { label?: string }) {
  return (
    <Button size="sm" onClick={() => toast.success("Settings saved")}>
      <Save />
      {label}
    </Button>
  );
}

function ToggleRow({
  title,
  description,
  defaultChecked = true,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);
  return (
    <label className="flex items-center gap-3 p-3">
      <Switch checked={checked} onCheckedChange={setChecked} />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{title}</span>
        <span className="block text-[12px] text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

interface SettingsViewProps {
  user: UserRecord;
  workspace: Workspace | null;
  members: WorkspaceMember[];
  stages: PipelineStage[];
}

export function SettingsView({ user, workspace, members, stages }: SettingsViewProps) {
  const [section, setSection] = React.useState<SectionId>("profile");

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors",
                active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-4">
        {section === "profile" ? (
          <Panel title="Profile" description="How you appear to your team across the workspace." footer={<SaveButton />}>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="text-[15px]">{initials(user.fullName)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Change photo
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" defaultValue={user.fullName} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-title">Job title</Label>
                <Input id="job-title" defaultValue={user.jobTitle} />
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select defaultValue={user.timezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Asia/Manila">Asia/Manila</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Panel>
        ) : null}

        {section === "workspace" ? (
          <Panel
            title="Workspace"
            description="Workspace-level identity. Every record in the product is scoped to this workspace."
            footer={<SaveButton />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="workspace-name">Name</Label>
                <Input id="workspace-name" defaultValue={workspace?.name ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-slug">Slug</Label>
                <Input id="workspace-slug" defaultValue={workspace?.slug ?? ""} />
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
              Workspace ID <code className="font-mono text-[11px]">{workspace?.id ?? "—"}</code> · created{" "}
              {workspace ? formatDate(workspace.createdAt) : "—"}
            </div>
          </Panel>
        ) : null}

        {section === "team" ? (
          <Panel
            title="Team"
            description="Members inherit workspace access through row level security roles."
            footer={
              <Button size="sm" onClick={() => toast.success("Invitation sent")}>
                <UserPlus />
                Invite member
              </Button>
            }
          >
            <ul className="divide-y divide-border rounded-md border border-border">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 p-3">
                  <Avatar>
                    <AvatarFallback>{initials(member.user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{member.user.fullName}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{member.user.email}</p>
                  </div>
                  {member.status === "invited" ? <Badge variant="warning">Invited</Badge> : null}
                  <Select defaultValue={member.role}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {section === "notifications" ? (
          <Panel title="Notifications" description="What reaches you, and where." footer={<SaveButton />}>
            <div className="divide-y divide-border rounded-md border border-border">
              <ToggleRow title="High-intent leads" description="A new lead scores above your threshold." />
              <ToggleRow title="Prospect replies" description="Someone responds to outreach on any channel." />
              <ToggleRow title="Appointments booked" description="A call is confirmed on your calendar." />
              <ToggleRow
                title="Human intervention required"
                description="The assistant hits a rule it will not answer on its own."
              />
              <ToggleRow
                title="Weekly summary"
                description="Monday morning digest of pipeline movement."
                defaultChecked={false}
              />
            </div>
          </Panel>
        ) : null}

        {section === "pipeline" ? (
          <Panel
            title="Pipeline"
            description="Stages, probabilities, and the default board for new leads."
            footer={
              <Button asChild size="sm" variant="outline">
                <Link href="/pipeline">Open board</Link>
              </Button>
            }
          >
            <ul className="divide-y divide-border rounded-md border border-border">
              {stages.map((stage) => (
                <li key={stage.id} className="flex items-center gap-3 px-3 py-2">
                  <StageDot colorToken={stage.colorToken} />
                  <span className="flex-1 text-[13px]">{stage.name}</span>
                  <span className="text-[12px] text-muted-foreground tabular-nums">{stage.probability}%</span>
                  {stage.isWon ? <Badge variant="success">Won</Badge> : null}
                  {stage.isLost ? <Badge variant="destructive">Lost</Badge> : null}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {section === "ai" ? (
          <Panel
            title="AI"
            description="Model, prompt, and automation rules live on their own page."
            footer={
              <Button asChild size="sm">
                <Link href="/ai-settings">
                  <Sparkles />
                  Open AI settings
                </Link>
              </Button>
            }
          >
            <div className="divide-y divide-border rounded-md border border-border">
              <ToggleRow title="Auto-qualify new leads" description="Score every discovered opportunity on capture." />
              <ToggleRow title="Auto-draft outreach" description="Prepare a first message for qualified leads." />
              <ToggleRow
                title="Auto-send outreach"
                description="Send without review. Off by default."
                defaultChecked={false}
              />
            </div>
          </Panel>
        ) : null}

        {section === "integrations" ? (
          <Panel
            title="Integrations"
            description="Connected services and credentials."
            footer={
              <Button asChild size="sm">
                <Link href="/integrations">
                  <Plug />
                  Manage integrations
                </Link>
              </Button>
            }
          >
            <p className="text-[13px] text-muted-foreground">
              Supabase, OpenAI, and Google Calendar are connected. Credentials are held server-side; the browser only
              ever receives the public anon key.
            </p>
          </Panel>
        ) : null}

        {section === "security" ? (
          <Panel title="Security" description="Access, sessions, and data handling." footer={<SaveButton />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" defaultValue="••••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>Session length</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="divide-y divide-border rounded-md border border-border">
              <ToggleRow title="Two-factor authentication" description="Require a second factor at sign-in." />
              <ToggleRow
                title="Restrict exports to admins"
                description="Only owners and admins can export lead data."
              />
            </div>
          </Panel>
        ) : null}

        {section === "billing" ? (
          <Panel
            title="Billing"
            description="Plan, usage, and invoices."
            footer={
              <Button size="sm" variant="outline">
                View invoices
              </Button>
            }
          >
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
              <div>
                <p className="text-[13px] font-medium capitalize">{workspace?.plan ?? "starter"} plan</p>
                <p className="text-[12px] text-muted-foreground">Billed monthly · renews in 12 days</p>
              </div>
              <Button size="sm" className="ml-auto">
                Upgrade
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Leads this month", "1,284 / 2,500"],
                ["AI actions", "8,412 / 20,000"],
                ["Seats", "3 / 5"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border p-3">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
                  <p className="mt-1 text-[13px] font-medium tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
