"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  updateAISettingsAction,
  updateMemberRoleAction,
  updateNotificationsAction,
  updatePasswordAction,
  updateProfileAction,
  updateWorkspaceAction,
  type SettingsResult,
} from "@/app/(dashboard)/settings/actions";
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
import { cn, formatDate, initials } from "@/lib/utils";
import type { PipelineStage, User as UserRecord, Workspace, WorkspaceMember } from "@/types";

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

const NOTIFICATIONS = [
  {
    key: "high_intent_lead",
    title: "High-intent leads",
    description: "A new lead scores above your threshold.",
    fallback: true,
  },
  {
    key: "prospect_replied",
    title: "Prospect replies",
    description: "Someone responds to outreach on any channel.",
    fallback: true,
  },
  {
    key: "appointment_booked",
    title: "Appointments booked",
    description: "A call is confirmed on your calendar.",
    fallback: true,
  },
  {
    key: "handoff_required",
    title: "Human intervention required",
    description: "The assistant hits a rule it will not answer on its own.",
    fallback: true,
  },
  {
    key: "weekly_summary",
    title: "Weekly summary",
    description: "Monday morning digest of pipeline movement.",
    fallback: false,
  },
];

const AI_TOGGLES = [
  {
    key: "autoQualify" as const,
    title: "Auto-qualify new leads",
    description: "Score every discovered opportunity on capture.",
    fallback: true,
  },
  {
    key: "autoDraft" as const,
    title: "Auto-draft outreach",
    description: "Prepare a first message for qualified leads.",
    fallback: true,
  },
  {
    key: "autoSend" as const,
    title: "Auto-send outreach",
    description: "Send without review. Off by default, deliberately.",
    fallback: false,
  },
];

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

interface SettingsViewProps {
  user: UserRecord;
  workspace: Workspace | null;
  members: WorkspaceMember[];
  stages: PipelineStage[];
}

export function SettingsView({ user, workspace, members, stages }: SettingsViewProps) {
  const router = useRouter();
  const [section, setSection] = React.useState<SectionId>("profile");
  const [saving, setSaving] = React.useState<string | null>(null);

  const [fullName, setFullName] = React.useState(user.fullName);
  const [jobTitle, setJobTitle] = React.useState(user.jobTitle ?? "");
  const [timezone, setTimezone] = React.useState(user.timezone || "UTC");

  const [workspaceName, setWorkspaceName] = React.useState(workspace?.name ?? "");
  const [bookingUrl, setBookingUrl] = React.useState(workspace?.bookingUrl ?? "");

  const [prefs, setPrefs] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NOTIFICATIONS.map((item) => [item.key, user.notificationPrefs[item.key] ?? item.fallback]),
    ),
  );

  const [aiToggles, setAiToggles] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      AI_TOGGLES.map((item) => [item.key, workspace?.aiSettings[item.key] ?? item.fallback]),
    ),
  );

  const [password, setPassword] = React.useState("");

  /** One helper for every panel: run, report, refresh. */
  const run = async (key: string, action: () => Promise<SettingsResult>, success: string) => {
    setSaving(key);
    const result = await action();
    setSaving(null);

    if (!result.ok) {
      toast.error("Not saved", { description: result.error });
      return false;
    }

    toast.success(success);
    router.refresh();
    return true;
  };

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
          <Panel
            title="Profile"
            description="How you appear to your team across the workspace."
            footer={
              <Button
                size="sm"
                loading={saving === "profile"}
                onClick={() =>
                  void run(
                    "profile",
                    () => updateProfileAction({ fullName, jobTitle, timezone }),
                    "Profile saved",
                  )
                }
              >
                <Save />
                Save changes
              </Button>
            }
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="text-[15px]">{initials(fullName || user.email)}</AvatarFallback>
              </Avatar>
              <p className="text-[12px] text-muted-foreground">
                Avatars come from your account provider. Uploads arrive with file storage.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email} readOnly disabled />
                <p className="text-[11px] text-muted-foreground">
                  Your sign-in address. Changing it requires re-verification.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-title">Job title</Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Founder"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Asia/Manila">Asia/Manila</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
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
            footer={
              <Button
                size="sm"
                loading={saving === "workspace"}
                onClick={() =>
                  void run(
                    "workspace",
                    () => updateWorkspaceAction({ name: workspaceName, bookingUrl }),
                    "Workspace saved",
                  )
                }
              >
                <Save />
                Save changes
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="workspace-name">Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-slug">Slug</Label>
                <Input id="workspace-slug" defaultValue={workspace?.slug ?? ""} readOnly disabled />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="booking-url">Booking link</Label>
              <Input
                id="booking-url"
                value={bookingUrl}
                onChange={(event) => setBookingUrl(event.target.value)}
                placeholder="https://calendly.com/your-handle/30min"
              />
              <p className="text-[11px] text-muted-foreground">
                Appended to every outreach draft so a prospect can book without a reply.
              </p>
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
            description="Roles are enforced by row level security, not just the interface. Changes save immediately."
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
                  <Select
                    defaultValue={member.role}
                    onValueChange={(role) =>
                      void run(
                        `role-${member.id}`,
                        () =>
                          updateMemberRoleAction({
                            memberId: member.id,
                            role: role as WorkspaceMember["role"],
                          }),
                        `${member.user.fullName} is now ${role}`,
                      )
                    }
                  >
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

            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
              Invitations need an email sender bound to the workspace and are not wired up yet. For now, ask a
              teammate to sign up, then assign their role here.
            </p>
          </Panel>
        ) : null}

        {section === "notifications" ? (
          <Panel
            title="Notifications"
            description="What reaches you, and where."
            footer={
              <Button
                size="sm"
                loading={saving === "notifications"}
                onClick={() =>
                  void run(
                    "notifications",
                    () => updateNotificationsAction({ prefs }),
                    "Notification settings saved",
                  )
                }
              >
                <Save />
                Save changes
              </Button>
            }
          >
            <div className="divide-y divide-border rounded-md border border-border">
              {NOTIFICATIONS.map((item) => (
                <label key={item.key} className="flex items-center gap-3 p-3">
                  <Switch
                    checked={prefs[item.key] ?? item.fallback}
                    onCheckedChange={(checked) =>
                      setPrefs((current) => ({ ...current, [item.key]: checked }))
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">{item.title}</span>
                    <span className="block text-[12px] text-muted-foreground">{item.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </Panel>
        ) : null}

        {section === "pipeline" ? (
          <Panel
            title="Pipeline"
            description="Stages, probabilities, and the default board for new leads."
            footer={
              <Button asChild size="sm">
                <Link href="/pipeline">
                  <KanbanSquare />
                  Edit on the board
                </Link>
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
              {stages.length === 0 ? (
                <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">No stages yet.</li>
              ) : null}
            </ul>
            <p className="text-[12px] text-muted-foreground">
              Stages are created, renamed, reordered and deleted on the board itself, where you can see the
              leads they hold.
            </p>
          </Panel>
        ) : null}

        {section === "ai" ? (
          <Panel
            title="AI"
            description="What the assistant does on its own. Model and prompt live on their own page."
            footer={
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/ai-settings">
                    <Sparkles />
                    Model and prompt
                  </Link>
                </Button>
                <Button
                  size="sm"
                  loading={saving === "ai"}
                  onClick={() => void run("ai", () => updateAISettingsAction(aiToggles), "AI settings saved")}
                >
                  <Save />
                  Save changes
                </Button>
              </div>
            }
          >
            <div className="divide-y divide-border rounded-md border border-border">
              {AI_TOGGLES.map((item) => (
                <label key={item.key} className="flex items-center gap-3 p-3">
                  <Switch
                    checked={aiToggles[item.key] ?? item.fallback}
                    onCheckedChange={(checked) =>
                      setAiToggles((current) => ({ ...current, [item.key]: checked }))
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">{item.title}</span>
                    <span className="block text-[12px] text-muted-foreground">{item.description}</span>
                  </span>
                </label>
              ))}
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
              Credentials are read from server-side environment variables and never stored in the database,
              where any workspace member could read them. The integrations page shows what is actually
              configured.
            </p>
          </Panel>
        ) : null}

        {section === "security" ? (
          <Panel
            title="Security"
            description="Access and credentials."
            footer={
              <Button
                size="sm"
                loading={saving === "password"}
                disabled={password.length < 8}
                onClick={async () => {
                  const done = await run(
                    "password",
                    () => updatePasswordAction({ password }),
                    "Password changed",
                  );
                  if (done) setPassword("");
                }}
              >
                <Save />
                Change password
              </Button>
            }
          >
            <div className="space-y-1.5 sm:max-w-sm">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <p className="text-[11px] text-muted-foreground">
                Takes effect immediately. Other sessions stay signed in.
              </p>
            </div>

            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
              Two-factor authentication is not wired up yet. It needs an enrolment and challenge flow, not just
              a toggle, so it is absent rather than fake.
            </div>
          </Panel>
        ) : null}

        {section === "billing" ? (
          <Panel title="Billing" description="Plan and usage.">
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
              <div>
                <p className="text-[13px] font-medium capitalize">{workspace?.plan ?? "starter"} plan</p>
                <p className="text-[12px] text-muted-foreground">No payment provider is connected.</p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Billing needs a payment provider with plans, a checkout session and a webhook to keep the plan in
              sync. Until that exists, an upgrade button that charges nothing would be worse than none.
            </p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
