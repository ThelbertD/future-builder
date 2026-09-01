/**
 * Database row shapes and the mappers that turn them into domain records.
 *
 * Postgres columns are snake_case and nullable; the domain model in types/ is
 * camelCase and mostly non-nullable. Every conversion happens here so the rest
 * of the app never sees a raw row.
 */
import type {
  Activity,
  AIAnalysis,
  Appointment,
  AppNotification,
  Campaign,
  CampaignStep,
  Company,
  CompanySize,
  CompanyStatus,
  Contact,
  Conversation,
  ConversationChannel,
  ConversationMode,
  EngagementType,
  Integration,
  IntentLevel,
  JobPost,
  Lead,
  LeadSource,
  LeadStatus,
  Message,
  PipelineStage,
  SavedSearch,
} from "@/types";

/* ----------------------------------------------------------------- rows -- */

export interface CompanyRow {
  id: string;
  workspace_id: string;
  name: string;
  domain: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  country: string | null;
  size: string | null;
  employee_count: number | null;
  description: string | null;
  linkedin_url: string | null;
  status: string;
  lead_score: number;
  tags: string[] | null;
  created_at: string;
  last_activity_at: string;
}

export interface ContactRow {
  id: string;
  workspace_id: string;
  company_id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface JobPostRow {
  id: string;
  workspace_id: string;
  company_id: string;
  title: string;
  description: string | null;
  source: string;
  source_url: string | null;
  location: string | null;
  remote: boolean;
  engagement_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_period: string | null;
  skills: string[] | null;
  posted_at: string | null;
  captured_at: string;
}

export interface AIAnalysisRow {
  id: string;
  workspace_id: string;
  lead_id: string;
  score: number;
  intent: string;
  opportunity_type: string | null;
  recommended_services: string[] | null;
  reasoning: string | null;
  signals: string[] | null;
  risks: string[] | null;
  suggested_next_action: string | null;
  confidence: number | null;
  model: string | null;
  analyzed_at: string;
}

export interface LeadRow {
  id: string;
  workspace_id: string;
  company_id: string;
  contact_id: string | null;
  job_post_id: string | null;
  stage_id: string | null;
  status: string;
  score: number;
  score_breakdown: Record<string, number> | null;
  intent: string;
  owner_id: string | null;
  tags: string[] | null;
  estimated_value: number;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  stage_entered_at: string;
  /** Present when the query embeds related tables. */
  company?: CompanyRow | null;
  contact?: ContactRow | null;
  job_post?: JobPostRow | null;
  analysis?: AIAnalysisRow[] | AIAnalysisRow | null;
}

export interface PipelineStageRow {
  id: string;
  workspace_id: string;
  pipeline_id: string;
  name: string;
  color_token: string;
  position: number;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface MessageRow {
  id: string;
  workspace_id: string;
  conversation_id: string;
  author: string;
  author_name: string | null;
  body: string;
  channel: string;
  sent_at: string;
  read_at: string | null;
  ai_model: string | null;
  is_draft?: boolean | null;
}

export interface ConversationRow {
  id: string;
  workspace_id: string;
  lead_id: string;
  company_id: string;
  contact_id: string | null;
  channel: string;
  subject: string | null;
  mode: string;
  unread_count: number;
  needs_attention: boolean;
  assignee_id: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_at: string;
  messages?: MessageRow[] | null;
}

export interface AppointmentRow {
  id: string;
  workspace_id: string;
  lead_id: string;
  company_id: string;
  contact_id: string | null;
  title: string;
  meeting_type: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  notes: string | null;
  booked_by_ai: boolean;
  created_at: string;
}

export interface CampaignStepRow {
  id: string;
  campaign_id: string;
  day_offset: number;
  channel: string;
  name: string;
  subject: string | null;
  preview: string | null;
  sent: number;
  opened: number;
  replied: number;
}

export interface CampaignRow {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  audience_summary: string | null;
  min_score: number;
  services: string[] | null;
  stats: Campaign["stats"] | null;
  created_at: string;
  updated_at: string;
  steps?: CampaignStepRow[] | null;
}

export interface ActivityRow {
  id: string;
  workspace_id: string;
  type: string;
  actor: string;
  actor_name: string | null;
  summary: string;
  detail: string | null;
  lead_id: string | null;
  company_id: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  workspace_id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

export interface SavedSearchRow {
  id: string;
  workspace_id: string;
  name: string;
  keywords: string[] | null;
  location: string | null;
  industry: string | null;
  sources: string[] | null;
  min_score: number;
  cadence_hours: number;
  last_run_at: string | null;
  new_results: number;
}

export interface IntegrationRow {
  id: string;
  workspace_id: string;
  provider: string;
  status: string;
  connected_at: string | null;
}

/* -------------------------------------------------------------- mappers -- */

const EMPTY_STATS: Campaign["stats"] = {
  enrolled: 0,
  sent: 0,
  delivered: 0,
  opened: 0,
  replied: 0,
  interested: 0,
  booked: 0,
};

export function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    domain: row.domain ?? "",
    website: row.website ?? "",
    industry: row.industry ?? "",
    location: row.location ?? "",
    country: row.country ?? "",
    size: (row.size as CompanySize) ?? "1-10",
    employeeCount: row.employee_count ?? 0,
    description: row.description ?? "",
    linkedinUrl: row.linkedin_url ?? undefined,
    status: row.status as CompanyStatus,
    leadScore: row.lead_score,
    openOpportunities: 0,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
  };
}

export function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    fullName: row.full_name,
    title: row.title ?? "",
    email: row.email ?? "",
    phone: row.phone ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  };
}

export function toJobPost(row: JobPostRow): JobPost {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    title: row.title,
    description: row.description ?? "",
    source: row.source as LeadSource,
    sourceUrl: row.source_url ?? "",
    location: row.location ?? "",
    remote: row.remote,
    engagementType: (row.engagement_type as EngagementType) ?? "Contract",
    budgetMin: row.budget_min ?? undefined,
    budgetMax: row.budget_max ?? undefined,
    budgetPeriod: (row.budget_period as JobPost["budgetPeriod"]) ?? undefined,
    skills: row.skills ?? [],
    postedAt: row.posted_at ?? row.captured_at,
    capturedAt: row.captured_at,
  };
}

export function toAnalysis(row: AIAnalysisRow): AIAnalysis {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    score: row.score,
    intent: row.intent as IntentLevel,
    opportunityType: (row.opportunity_type as AIAnalysis["opportunityType"]) ?? "Direct Client",
    recommendedServices: row.recommended_services ?? [],
    reasoning: row.reasoning ?? "",
    signals: row.signals ?? [],
    risks: row.risks ?? [],
    suggestedNextAction: row.suggested_next_action ?? "",
    confidence: row.confidence ?? 0,
    model: row.model ?? "",
    analyzedAt: row.analyzed_at,
  };
}

export function toLead(row: LeadRow): Lead {
  const breakdown = row.score_breakdown ?? {};
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    contactId: row.contact_id ?? undefined,
    jobPostId: row.job_post_id ?? undefined,
    stageId: row.stage_id ?? "",
    status: row.status as LeadStatus,
    score: row.score,
    scoreBreakdown: {
      intentSignals: breakdown.intentSignals ?? 0,
      budgetFit: breakdown.budgetFit ?? 0,
      serviceMatch: breakdown.serviceMatch ?? 0,
      companyFit: breakdown.companyFit ?? 0,
      timing: breakdown.timing ?? 0,
    },
    intent: row.intent as IntentLevel,
    ownerId: row.owner_id ?? undefined,
    tags: row.tags ?? [],
    estimatedValue: Number(row.estimated_value ?? 0),
    notes: row.notes ?? "",
    source: (row.source as LeadSource) ?? "LinkedIn",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
    stageEnteredAt: row.stage_entered_at,
  };
}

export function toStage(row: PipelineStageRow): PipelineStage {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    pipelineId: row.pipeline_id,
    name: row.name,
    colorToken: row.color_token,
    position: row.position,
    probability: row.probability,
    isWon: row.is_won,
    isLost: row.is_lost,
  };
}

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    author: row.author as Message["author"],
    authorName: row.author_name ?? "",
    body: row.body,
    channel: row.channel as ConversationChannel,
    sentAt: row.sent_at,
    readAt: row.read_at ?? undefined,
    aiModel: row.ai_model ?? undefined,
    isDraft: Boolean(row.is_draft),
  };
}

export function toConversation(row: ConversationRow): Conversation {
  const messages = (row.messages ?? [])
    .map(toMessage)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    companyId: row.company_id,
    contactId: row.contact_id ?? undefined,
    channel: row.channel as ConversationChannel,
    subject: row.subject ?? "",
    mode: row.mode as ConversationMode,
    unreadCount: row.unread_count,
    needsAttention: row.needs_attention,
    assigneeId: row.assignee_id ?? undefined,
    lastMessagePreview: row.last_message_preview ?? "",
    lastMessageAt: row.last_message_at ?? row.created_at,
    createdAt: row.created_at,
    messages,
  };
}

export function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    companyId: row.company_id,
    contactId: row.contact_id ?? undefined,
    title: row.title,
    meetingType: (row.meeting_type as Appointment["meetingType"]) ?? "Discovery Call",
    status: row.status as Appointment["status"],
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location ?? "",
    notes: row.notes ?? undefined,
    bookedByAI: row.booked_by_ai,
    createdAt: row.created_at,
  };
}

export function toCampaignStep(row: CampaignStepRow): CampaignStep {
  return {
    id: row.id,
    dayOffset: row.day_offset,
    channel: row.channel as ConversationChannel,
    name: row.name,
    subject: row.subject ?? "",
    preview: row.preview ?? "",
    sent: row.sent,
    opened: row.opened,
    replied: row.replied,
  };
}

export function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    status: row.status as Campaign["status"],
    audienceSummary: row.audience_summary ?? "",
    minScore: row.min_score,
    services: row.services ?? [],
    steps: (row.steps ?? []).map(toCampaignStep).sort((a, b) => a.dayOffset - b.dayOffset),
    stats: row.stats ?? EMPTY_STATS,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type as Activity["type"],
    actor: row.actor as Activity["actor"],
    actorName: row.actor_name ?? "",
    summary: row.summary,
    detail: row.detail ?? undefined,
    leadId: row.lead_id ?? undefined,
    companyId: row.company_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    kind: row.kind as AppNotification["kind"],
    title: row.title,
    body: row.body ?? "",
    href: row.href ?? "/dashboard",
    read: row.read,
    createdAt: row.created_at,
  };
}

export function toSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    keywords: row.keywords ?? [],
    location: row.location ?? "",
    industry: row.industry ?? "",
    sources: (row.sources ?? []) as LeadSource[],
    minScore: row.min_score,
    cadenceHours: row.cadence_hours,
    lastRunAt: row.last_run_at ?? row.id,
    newResults: row.new_results,
  };
}

/** Integration metadata is static; only status and connection time are stored. */
export function mergeIntegration(base: Integration, row?: IntegrationRow): Integration {
  if (!row) return base;
  return {
    ...base,
    status: row.status as Integration["status"],
    connectedAt: row.connected_at ?? undefined,
  };
}

/** Normalises the embedded analysis, which arrives as an array or a single row. */
export function firstAnalysis(value: LeadRow["analysis"]): AIAnalysisRow | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
