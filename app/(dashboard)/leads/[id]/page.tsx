import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { IntentBadge, ScoreMeter, StatusBadge } from "@/components/common/indicators";
import { PageContainer } from "@/components/layout/page-container";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadStageControl } from "@/components/leads/lead-stage-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchActivitiesByLead, fetchLead, fetchPipelineStages } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, formatRelative } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lead = await fetchLead(id);
  return { title: lead ? `${lead.company.name} — Lead` : "Lead" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [lead, stages, user] = await Promise.all([fetchLead(id), fetchPipelineStages(), getCurrentUser()]);

  if (!lead) notFound();

  const activities = await fetchActivitiesByLead(lead.id);

  const { company, contact, jobPost, analysis } = lead;

  return (
    <PageContainer>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/leads" aria-label="Back to leads">
            <ArrowLeft />
          </Link>
        </Button>
        <span className="text-[12px] text-muted-foreground">Leads</span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            <StatusBadge status={lead.status} />
            <IntentBadge intent={lead.intent} />
          </div>
          <p className="text-[13px] text-muted-foreground">
            {jobPost?.title} · {company.industry} · {company.location}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/companies/${company.id}`}>
              <Building2 />
              Company
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/appointments">
              <CalendarPlus />
              Book call
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/conversations">
              <MessageSquarePlus />
              Contact
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left column — the facts */}
        <div className="space-y-4">
          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Company</h2>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Company">{company.name}</Field>
              <Field label="Website">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="size-3" />
                  {company.domain}
                </a>
              </Field>
              <Field label="Industry">{company.industry}</Field>
              <Field label="Location">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 text-muted-foreground" />
                  {company.location}
                </span>
              </Field>
              <Field label="Company size">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground" />
                  {company.size} · {company.employeeCount} employees
                </span>
              </Field>
              <Field label="Estimated value">{formatCurrency(lead.estimatedValue)}</Field>
            </div>

            <Separator />

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Primary contact">{contact?.fullName ?? "Not identified"}</Field>
              <Field label="Title">{contact?.title ?? "—"}</Field>
              <Field label="Email">
                {contact ? (
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                    <Mail className="size-3 text-muted-foreground" />
                    {contact.email}
                  </a>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Phone">
                {contact?.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground" />
                    {contact.phone}
                  </span>
                ) : (
                  "—"
                )}
              </Field>
            </div>
          </Card>

          {jobPost ? (
            <Card className="p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-[15px] font-semibold tracking-tight">Opportunity</h2>
                <Button asChild variant="ghost" size="sm">
                  <a href={jobPost.sourceUrl} target="_blank" rel="noreferrer">
                    View source
                    <ExternalLink />
                  </a>
                </Button>
              </div>
              <div className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Job title">{jobPost.title}</Field>
                  <Field label="Engagement">{jobPost.engagementType}</Field>
                  <Field label="Source">{jobPost.source}</Field>
                  <Field label="Posted">
                    {formatDate(jobPost.postedAt)} · {formatRelative(jobPost.postedAt)}
                  </Field>
                  <Field label="Budget">
                    {jobPost.budgetMin && jobPost.budgetMax
                      ? `${formatCurrency(jobPost.budgetMin)} – ${formatCurrency(jobPost.budgetMax)} per ${jobPost.budgetPeriod}`
                      : "Not published"}
                  </Field>
                  <Field label="Work type">{jobPost.remote ? "Remote" : "On site"}</Field>
                </div>

                <div>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Description</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{jobPost.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {jobPost.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Notes</h2>
            </div>
            <div className="p-4">
              <LeadNotes initialNote={lead.notes || undefined} authorName={user?.fullName ?? "You"} />
            </div>
          </Card>

          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Activity</h2>
            </div>
            <div className="p-4">
              <ActivityTimeline activities={activities} />
            </div>
          </Card>
        </div>

        {/* Right column — the intelligence */}
        <div className="space-y-4">
          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Pipeline</h2>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Stage</p>
                <LeadStageControl leadId={lead.id} stageId={lead.stageId} stages={stages} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Score">
                  <ScoreMeter score={lead.score} />
                </Field>
                <Field label="Time in stage">{formatRelative(lead.stageEnteredAt).replace(" ago", "")}</Field>
                <Field label="Owner">{user?.fullName ?? "Unassigned"}</Field>
                <Field label="Last activity">{formatRelative(lead.lastActivityAt)}</Field>
              </div>
              {lead.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          {analysis ? (
            <AIInsightCard analysis={analysis} breakdown={lead.scoreBreakdown} />
          ) : (
            <Card className="flex flex-col items-center gap-2 p-6 text-center">
              <Sparkles className="size-4 text-muted-foreground" />
              <p className="text-[13px] font-medium">Not analysed yet</p>
              <p className="text-[12px] text-muted-foreground">
                Run qualification to score this opportunity and draft an opening message.
              </p>
              <Button size="sm" className="mt-1">
                <Sparkles />
                Qualify with AI
              </Button>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
