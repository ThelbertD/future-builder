import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe, Linkedin, Mail, MapPin, Users } from "lucide-react";

import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { IntentBadge, ScoreMeter, StatusBadge } from "@/components/common/indicators";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsListUnderline, TabsTriggerUnderline } from "@/components/ui/tabs";
import {
  fetchActivities,
  fetchCompany,
  fetchContactsByCompany,
  fetchConversationsByCompany,
  fetchJobPostsByCompany,
  fetchLeadsByCompany,
} from "@/lib/supabase/queries";
import { formatDate, formatRelative } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const company = await fetchCompany(id);
  return { title: company?.name ?? "Company" };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const company = await fetchCompany(id);

  if (!company) notFound();

  const [contacts, jobs, leads, conversations, allActivities] = await Promise.all([
    fetchContactsByCompany(company.id),
    fetchJobPostsByCompany(company.id),
    fetchLeadsByCompany(company.id),
    fetchConversationsByCompany(company.id),
    fetchActivities(50),
  ]);

  const activities = allActivities.filter((activity) => activity.companyId === company.id);

  return (
    <PageContainer>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/companies" aria-label="Back to companies">
            <ArrowLeft />
          </Link>
        </Button>
        <span className="text-[12px] text-muted-foreground">Companies</span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            <Badge variant={company.status === "client" ? "success" : "outline"} className="capitalize">
              {company.status}
            </Badge>
          </div>
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{company.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
            <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
              <Globe className="size-3" />
              {company.domain}
            </a>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {company.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              {company.employeeCount} employees
            </span>
            {company.linkedinUrl ? (
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <Linkedin className="size-3" />
                LinkedIn
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Lead score</p>
            <ScoreMeter score={company.leadScore} className="mt-1" />
          </div>
          <div>
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Open</p>
            <p className="mt-1 text-[15px] font-semibold tabular-nums">{company.openOpportunities}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsListUnderline>
          <TabsTriggerUnderline value="overview">Overview</TabsTriggerUnderline>
          <TabsTriggerUnderline value="contacts">Contacts ({contacts.length})</TabsTriggerUnderline>
          <TabsTriggerUnderline value="opportunities">Opportunities ({jobs.length})</TabsTriggerUnderline>
          <TabsTriggerUnderline value="conversations">Conversations ({conversations.length})</TabsTriggerUnderline>
          <TabsTriggerUnderline value="activity">Activity</TabsTriggerUnderline>
        </TabsListUnderline>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-2">
          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Leads</h2>
            </div>
            <ul className="divide-y divide-border">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px]">{lead.jobPost?.title}</p>
                      <p className="text-[11px] text-muted-foreground">{lead.source}</p>
                    </div>
                    <ScoreMeter score={lead.score} showBar={false} />
                    <IntentBadge intent={lead.intent} />
                    <StatusBadge status={lead.status} />
                  </Link>
                </li>
              ))}
              {leads.length === 0 ? (
                <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">No leads yet.</li>
              ) : null}
            </ul>
          </Card>

          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Details</h2>
            </div>
            <dl className="grid gap-4 p-4 sm:grid-cols-2">
              {[
                ["Industry", company.industry],
                ["Company size", company.size],
                ["Country", company.country],
                ["Added", formatDate(company.createdAt)],
                ["Last activity", formatRelative(company.lastActivityAt)],
                ["Tags", company.tags.join(", ") || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
                  <dd className="mt-0.5 text-[13px]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {contacts.map((contact) => (
                <li key={contact.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">
                      {contact.fullName}
                      {contact.isPrimary ? (
                        <Badge variant="primary" className="ml-2">
                          Primary
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{contact.title}</p>
                  </div>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary"
                  >
                    <Mail className="size-3" />
                    {contact.email}
                  </a>
                  <span className="text-[12px] text-muted-foreground">{contact.phone}</span>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {jobs.map((job) => (
                <li key={job.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">{job.title}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {job.source} · {job.engagementType} · posted {formatRelative(job.postedAt)}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <a href={job.sourceUrl} target="_blank" rel="noreferrer">
                        Source
                        <ExternalLink />
                      </a>
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <Link
                    href={`/conversations?c=${conversation.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px]">{conversation.subject}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{conversation.lastMessagePreview}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelative(conversation.lastMessageAt)}
                    </span>
                  </Link>
                </li>
              ))}
              {conversations.length === 0 ? (
                <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                  No conversations with this company yet.
                </li>
              ) : null}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-4">
            <ActivityTimeline activities={activities} />
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
