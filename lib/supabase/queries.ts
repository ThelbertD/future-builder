import "server-only";

/**
 * Data access layer.
 *
 * Every page reads through these functions. They return records from the
 * bundled demo dataset while NEXT_PUBLIC_USE_MOCK_DATA is on, and query
 * Supabase once it is off — the return types are identical either way, so no
 * component changes when the source changes.
 *
 * Reads run as the signed-in user, so row level security is what actually
 * scopes the data; the explicit workspace filter is a second line of defence.
 */
import {
  ACTIVITIES,
  APPOINTMENTS,
  CAMPAIGNS,
  COMPANIES,
  CONTACTS,
  CONVERSATIONS,
  DASHBOARD_METRICS,
  HOT_LEADS,
  INTEGRATIONS,
  JOB_POSTS,
  LEADS_WITH_RELATIONS,
  NOTIFICATIONS,
  DEFAULT_PIPELINE,
  PIPELINE_STAGES,
  SAVED_SEARCHES,
  getCompanyById,
  getContactsByCompany,
  getJobPostsByCompany,
  getLeadById,
  getLeadsByCompany,
} from "@/lib/mock";
import { emailProviderStatus } from "@/lib/email/provider";
import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { isSupabaseConfigured, useMockData } from "@/lib/supabase/env";
import {
  firstAnalysis,
  mergeIntegration,
  toActivity,
  toAnalysis,
  toAppointment,
  toCampaign,
  toCompany,
  toContact,
  toConversation,
  toJobPost,
  toLead,
  toNotification,
  toSavedSearch,
  toStage,
  type ActivityRow,
  type AppointmentRow,
  type CampaignRow,
  type CompanyRow,
  type ContactRow,
  type ConversationRow,
  type IntegrationRow,
  type JobPostRow,
  type LeadRow,
  type NotificationRow,
  type PipelineStageRow,
  type SavedSearchRow,
} from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  Appointment,
  AppNotification,
  Campaign,
  Company,
  Contact,
  Conversation,
  Integration,
  JobPost,
  LeadWithRelations,
  MetricSummary,
  PipelineStage,
  PipelineSummary,
  SavedSearch,
} from "@/types";

/** Columns pulled whenever a lead is rendered with its related records. */
const LEAD_SELECT =
  "*, company:companies(*), contact:contacts(*), job_post:job_posts(*), analysis:ai_analyses(*)";

async function workspaceScope() {
  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  return { supabase, workspaceId };
}

function toLeadWithRelations(row: LeadRow): LeadWithRelations | null {
  if (!row.company) return null;
  const analysisRow = firstAnalysis(row.analysis);

  return {
    ...toLead(row),
    company: toCompany(row.company),
    contact: row.contact ? toContact(row.contact) : undefined,
    jobPost: row.job_post ? toJobPost(row.job_post) : undefined,
    analysis: analysisRow ? toAnalysis(analysisRow) : undefined,
  };
}

/* ------------------------------------------------------------------ leads */

export async function fetchLeads(): Promise<LeadWithRelations[]> {
  if (useMockData) return LEADS_WITH_RELATIONS;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("workspace_id", workspaceId)
    .order("score", { ascending: false })
    .returns<LeadRow[]>();

  return (data ?? []).map(toLeadWithRelations).filter((lead): lead is LeadWithRelations => lead !== null);
}

export async function fetchLead(id: string): Promise<LeadWithRelations | undefined> {
  if (useMockData) return getLeadById(id);

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return undefined;

  const { data } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle<LeadRow>();

  return data ? (toLeadWithRelations(data) ?? undefined) : undefined;
}

export async function fetchLeadsByCompany(companyId: string): Promise<LeadWithRelations[]> {
  if (useMockData) return getLeadsByCompany(companyId);

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("company_id", companyId)
    .order("score", { ascending: false })
    .returns<LeadRow[]>();

  return (data ?? []).map(toLeadWithRelations).filter((lead): lead is LeadWithRelations => lead !== null);
}

export async function fetchHotLeads(limit = 5): Promise<LeadWithRelations[]> {
  if (useMockData) return HOT_LEADS.slice(0, limit);

  const leads = await fetchLeads();
  return leads.filter((lead) => !["won", "lost"].includes(lead.status)).slice(0, limit);
}

/* -------------------------------------------------------------- companies */

export async function fetchCompanies(): Promise<Company[]> {
  if (useMockData) return COMPANIES;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const [companies, jobPosts] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("lead_score", { ascending: false })
      .returns<CompanyRow[]>(),
    supabase.from("job_posts").select("company_id").eq("workspace_id", workspaceId).returns<
      Array<{ company_id: string }>
    >(),
  ]);

  const openCounts = (jobPosts.data ?? []).reduce<Record<string, number>>((totals, row) => {
    totals[row.company_id] = (totals[row.company_id] ?? 0) + 1;
    return totals;
  }, {});

  return (companies.data ?? []).map((row) => ({
    ...toCompany(row),
    openOpportunities: openCounts[row.id] ?? 0,
  }));
}

export async function fetchCompany(id: string): Promise<Company | undefined> {
  if (useMockData) return getCompanyById(id);

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return undefined;

  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle<CompanyRow>();

  return data ? toCompany(data) : undefined;
}

export async function fetchContacts(): Promise<Contact[]> {
  if (useMockData) return CONTACTS;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .returns<ContactRow[]>();

  return (data ?? []).map(toContact);
}

export async function fetchContactsByCompany(companyId: string): Promise<Contact[]> {
  if (useMockData) return getContactsByCompany(companyId);

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("company_id", companyId)
    .order("is_primary", { ascending: false })
    .returns<ContactRow[]>();

  return (data ?? []).map(toContact);
}

export async function fetchJobPostsByCompany(companyId: string): Promise<JobPost[]> {
  if (useMockData) return getJobPostsByCompany(companyId);

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("job_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("company_id", companyId)
    .order("posted_at", { ascending: false })
    .returns<JobPostRow[]>();

  return (data ?? []).map(toJobPost);
}

export async function fetchJobPosts(): Promise<JobPost[]> {
  if (useMockData) return JOB_POSTS;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("job_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("posted_at", { ascending: false })
    .returns<JobPostRow[]>();

  return (data ?? []).map(toJobPost);
}

/* --------------------------------------------------------------- pipeline */

export async function fetchPipelines(): Promise<PipelineSummary[]> {
  if (useMockData) {
    return [{ id: DEFAULT_PIPELINE.id, name: DEFAULT_PIPELINE.name, isDefault: DEFAULT_PIPELINE.isDefault }];
  }

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("pipelines")
    .select("id, name, is_default")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<Array<{ id: string; name: string; is_default: boolean }>>();

  return (data ?? []).map((row) => ({ id: row.id, name: row.name, isDefault: row.is_default }));
}

/** Stages for one pipeline, or every stage in the workspace when omitted. */
export async function fetchPipelineStages(pipelineId?: string): Promise<PipelineStage[]> {
  if (useMockData) return PIPELINE_STAGES;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  let query = supabase.from("pipeline_stages").select("*").eq("workspace_id", workspaceId);
  if (pipelineId) query = query.eq("pipeline_id", pipelineId);

  const { data } = await query.order("position", { ascending: true }).returns<PipelineStageRow[]>();

  return (data ?? []).map(toStage);
}

/* ---------------------------------------------------------- conversations */

export async function fetchConversations(): Promise<Conversation[]> {
  if (useMockData) return CONVERSATIONS;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("conversations")
    .select("*, messages(*)")
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false })
    .returns<ConversationRow[]>();

  return (data ?? []).map(toConversation);
}

export async function fetchConversationsByCompany(companyId: string): Promise<Conversation[]> {
  const conversations = await fetchConversations();
  return conversations.filter((conversation) => conversation.companyId === companyId);
}

/* ----------------------------------------------------------- appointments */

export async function fetchAppointments(): Promise<Appointment[]> {
  if (useMockData) return APPOINTMENTS;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("starts_at", { ascending: true })
    .returns<AppointmentRow[]>();

  return (data ?? []).map(toAppointment);
}

/* --------------------------------------------------------------- outreach */

export async function fetchCampaigns(): Promise<Campaign[]> {
  if (useMockData) return CAMPAIGNS;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("campaigns")
    .select("*, steps:campaign_steps(*)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .returns<CampaignRow[]>();

  return (data ?? []).map(toCampaign);
}

/* -------------------------------------------------- activity & signals --- */

export async function fetchActivities(limit = 20): Promise<Activity[]> {
  if (useMockData) return ACTIVITIES.slice(0, limit);

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ActivityRow[]>();

  return (data ?? []).map(toActivity);
}

export async function fetchActivitiesByLead(leadId: string, limit = 12): Promise<Activity[]> {
  if (useMockData) {
    const scoped = ACTIVITIES.filter((activity) => activity.leadId === leadId);
    return (scoped.length > 0 ? scoped : ACTIVITIES.slice(0, 4)).slice(0, limit);
  }

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ActivityRow[]>();

  return (data ?? []).map(toActivity);
}

export async function fetchNotifications(limit = 12): Promise<AppNotification[]> {
  if (useMockData) return NOTIFICATIONS;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<NotificationRow[]>();

  return (data ?? []).map(toNotification);
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  if (useMockData) return SAVED_SEARCHES;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true })
    .returns<SavedSearchRow[]>();

  return (data ?? []).map(toSavedSearch);
}

/**
 * Real connection status, resolved from what is actually configured on the
 * server rather than from stored flags. A card that claims a connection the
 * app cannot make is worse than one that admits it is not set up.
 */
function resolveStatus(integration: Integration): Integration {
  switch (integration.id) {
    case "supabase":
      return isSupabaseConfigured
        ? { ...integration, status: "connected" }
        : { ...integration, note: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." };

    case "openai":
      return process.env.OPENAI_API_KEY
        ? { ...integration, status: "connected" }
        : { ...integration, note: "Set OPENAI_API_KEY on the server." };

    case "anthropic":
      return process.env.ANTHROPIC_API_KEY
        ? { ...integration, status: "connected" }
        : { ...integration, note: "Set ANTHROPIC_API_KEY on the server." };

    case "email-provider": {
      const email = emailProviderStatus();
      if (email.configured) {
        return { ...integration, status: "connected", note: `Sending as ${email.from}` };
      }
      return { ...integration, note: `Set ${email.missing.join(" and ")} on the server.` };
    }

    default:
      return integration;
  }
}

export async function fetchIntegrations(): Promise<Integration[]> {
  const resolved = INTEGRATIONS.map(resolveStatus);

  if (useMockData) return resolved;

  const { supabase, workspaceId } = await workspaceScope();
  if (!workspaceId) return resolved;

  // Stored rows only ever carry connection time and per-workspace overrides;
  // credentials never live in the database.
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .returns<IntegrationRow[]>();

  const byProvider = new Map((data ?? []).map((row) => [row.provider, row]));

  return resolved.map((integration) => {
    const row = byProvider.get(integration.id);
    if (!row || integration.status === "connected") return integration;
    return mergeIntegration(integration, row);
  });
}

/* ---------------------------------------------------------------- metrics */

const QUALIFIED_STATUSES = new Set([
  "qualified",
  "ready",
  "contacted",
  "replied",
  "interested",
  "booked",
  "call_completed",
  "proposal",
  "negotiation",
  "won",
]);

const CONTACTED_STATUSES = new Set([
  "contacted",
  "replied",
  "interested",
  "booked",
  "call_completed",
  "proposal",
  "negotiation",
  "won",
]);

const REPLIED_STATUSES = new Set([
  "replied",
  "interested",
  "booked",
  "call_completed",
  "proposal",
  "negotiation",
  "won",
]);

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

/**
 * Headline dashboard counters.
 *
 * In demo mode these are the curated figures from the mock dataset. Against
 * Supabase they are counted from the workspace's own records, with the trend
 * comparing the last seven days to the seven before it.
 */
export async function fetchDashboardMetrics(): Promise<MetricSummary[]> {
  if (useMockData) return DASHBOARD_METRICS;

  const [leads, appointments] = await Promise.all([fetchLeads(), fetchAppointments()]);

  const now = Date.now();
  const week = 7 * 86_400_000;
  const inLastWeek = (iso: string) => now - new Date(iso).getTime() <= week;
  const inPriorWeek = (iso: string) => {
    const age = now - new Date(iso).getTime();
    return age > week && age <= week * 2;
  };

  const qualified = leads.filter((lead) => QUALIFIED_STATUSES.has(lead.status));
  const contacted = leads.filter((lead) => CONTACTED_STATUSES.has(lead.status));
  const replied = leads.filter((lead) => REPLIED_STATUSES.has(lead.status));
  const won = leads.filter((lead) => lead.status === "won");

  const recent = leads.filter((lead) => inLastWeek(lead.createdAt)).length;
  const prior = leads.filter((lead) => inPriorWeek(lead.createdAt)).length;
  const share = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100);

  return [
    {
      key: "leads_found",
      label: "Leads found",
      value: leads.length,
      format: "number",
      deltaPct: percentChange(recent, prior),
      context: `${recent} added this week`,
    },
    {
      key: "ai_qualified",
      label: "AI qualified",
      value: qualified.length,
      format: "number",
      deltaPct: percentChange(qualified.filter((lead) => inLastWeek(lead.updatedAt)).length, prior),
      context: `${share(qualified.length, leads.length).toFixed(1)}% of all leads`,
    },
    {
      key: "contacted",
      label: "Contacted",
      value: contacted.length,
      format: "number",
      deltaPct: percentChange(contacted.filter((lead) => inLastWeek(lead.lastActivityAt)).length, prior),
      context: `${share(contacted.length, qualified.length).toFixed(1)}% of qualified`,
    },
    {
      key: "responses",
      label: "Responses",
      value: replied.length,
      format: "number",
      deltaPct: percentChange(replied.filter((lead) => inLastWeek(lead.lastActivityAt)).length, prior),
      context: `${share(replied.length, contacted.length).toFixed(1)}% reply rate`,
    },
    {
      key: "appointments",
      label: "Appointments",
      value: appointments.filter((appointment) => appointment.status !== "cancelled").length,
      format: "number",
      deltaPct: percentChange(appointments.filter((a) => inLastWeek(a.createdAt)).length, prior),
      context: `${appointments.filter((a) => a.bookedByAI).length} booked by AI`,
    },
    {
      key: "clients_won",
      label: "Clients won",
      value: won.length,
      format: "number",
      deltaPct: percentChange(won.filter((lead) => inLastWeek(lead.updatedAt)).length, prior),
      context: `${share(won.length, replied.length).toFixed(1)}% of responders`,
    },
  ];
}
