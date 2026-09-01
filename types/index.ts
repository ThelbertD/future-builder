/**
 * Future Builder AI — domain model.
 *
 * Every tenant-scoped entity carries `workspaceId` so the same types map 1:1 onto
 * Supabase tables protected by row level security (see database/migrations).
 */

export type UUID = string;
/** ISO-8601 timestamp. */
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Tenancy                                                            */
/* ------------------------------------------------------------------ */

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

/** Per-user notification toggles, keyed by notification kind. */
export type NotificationPrefs = Record<string, boolean>;

export interface User {
  id: UUID;
  email: string;
  fullName: string;
  avatarUrl?: string;
  jobTitle?: string;
  timezone: string;
  notificationPrefs: NotificationPrefs;
  createdAt: ISODate;
}

/** Model, prompt and automation rules for a workspace. */
export interface AISettings {
  provider?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  services?: string[];
  tone?: string;
  minQualifyScore?: number;
  autoBook?: boolean;
  handoffOnPricing?: boolean;
  handoffAfterReplies?: number;
  autoQualify?: boolean;
  autoDraft?: boolean;
  autoSend?: boolean;
  businessName?: string;
  targetCustomers?: string;
}

export interface Workspace {
  id: UUID;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "scale";
  logoUrl?: string;
  /** Public scheduling link handed to prospects, e.g. a Calendly URL. */
  bookingUrl?: string;
  aiSettings: AISettings;
  createdAt: ISODate;
}

export interface WorkspaceMember {
  id: UUID;
  workspaceId: UUID;
  userId: UUID;
  role: WorkspaceRole;
  user: Pick<User, "id" | "fullName" | "email" | "avatarUrl" | "jobTitle">;
  status: "active" | "invited" | "suspended";
  joinedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Companies & contacts                                               */
/* ------------------------------------------------------------------ */

export type CompanyStatus = "prospect" | "engaged" | "client" | "archived";
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

export interface Company {
  id: UUID;
  workspaceId: UUID;
  name: string;
  domain: string;
  website: string;
  industry: string;
  location: string;
  country: string;
  size: CompanySize;
  employeeCount: number;
  description: string;
  linkedinUrl?: string;
  status: CompanyStatus;
  leadScore: number;
  openOpportunities: number;
  tags: string[];
  createdAt: ISODate;
  lastActivityAt: ISODate;
}

export interface Contact {
  id: UUID;
  workspaceId: UUID;
  companyId: UUID;
  fullName: string;
  title: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  isPrimary: boolean;
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Job posts (the raw signal)                                         */
/* ------------------------------------------------------------------ */

export type LeadSource =
  | "LinkedIn"
  | "Indeed"
  | "Upwork"
  | "AngelList"
  | "Facebook Groups"
  | "Company Site"
  | "Reddit"
  | "Referral";

export type EngagementType = "Full-time" | "Part-time" | "Contract" | "Freelance" | "Retainer";

export interface JobPost {
  id: UUID;
  workspaceId: UUID;
  companyId: UUID;
  title: string;
  description: string;
  source: LeadSource;
  sourceUrl: string;
  location: string;
  remote: boolean;
  engagementType: EngagementType;
  budgetMin?: number;
  budgetMax?: number;
  budgetPeriod?: "hour" | "month" | "project";
  skills: string[];
  postedAt: ISODate;
  capturedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Leads                                                              */
/* ------------------------------------------------------------------ */

export type IntentLevel = "hot" | "high" | "medium" | "low";
export type LeadStatus =
  | "new"
  | "qualified"
  | "ready"
  | "contacted"
  | "replied"
  | "interested"
  | "booked"
  | "call_completed"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface AIAnalysis {
  id: UUID;
  workspaceId: UUID;
  leadId: UUID;
  score: number;
  intent: IntentLevel;
  opportunityType: "Direct Client" | "Agency Subcontract" | "White Label" | "Retainer";
  recommendedServices: string[];
  reasoning: string;
  signals: string[];
  risks: string[];
  suggestedNextAction: string;
  confidence: number;
  model: string;
  analyzedAt: ISODate;
}

export interface LeadScoreBreakdown {
  intentSignals: number;
  budgetFit: number;
  serviceMatch: number;
  companyFit: number;
  timing: number;
}

export interface Lead {
  id: UUID;
  workspaceId: UUID;
  companyId: UUID;
  contactId?: UUID;
  jobPostId?: UUID;
  stageId: UUID;
  status: LeadStatus;
  score: number;
  scoreBreakdown: LeadScoreBreakdown;
  intent: IntentLevel;
  ownerId?: UUID;
  tags: string[];
  estimatedValue: number;
  notes: string;
  source: LeadSource;
  createdAt: ISODate;
  updatedAt: ISODate;
  lastActivityAt: ISODate;
  stageEnteredAt: ISODate;
}

/** A lead joined with the records the UI always renders alongside it. */
export interface LeadWithRelations extends Lead {
  company: Company;
  contact?: Contact;
  jobPost?: JobPost;
  analysis?: AIAnalysis;
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                           */
/* ------------------------------------------------------------------ */

export interface PipelineStage {
  id: UUID;
  workspaceId: UUID;
  pipelineId: UUID;
  name: string;
  /** Token name, e.g. "chart-1" — never a raw hex value. */
  colorToken: string;
  position: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

export interface Pipeline {
  id: UUID;
  workspaceId: UUID;
  name: string;
  isDefault: boolean;
  stages: PipelineStage[];
}

/* ------------------------------------------------------------------ */
/* Conversations                                                      */
/* ------------------------------------------------------------------ */

export type MessageAuthor = "ai" | "human" | "prospect" | "system";
export type ConversationChannel = "email" | "linkedin" | "sms" | "web";
export type ConversationMode = "ai" | "human";

export interface Message {
  id: UUID;
  workspaceId: UUID;
  conversationId: UUID;
  author: MessageAuthor;
  authorName: string;
  body: string;
  channel: ConversationChannel;
  sentAt: ISODate;
  readAt?: ISODate;
  aiModel?: string;
  /** A generated draft awaiting review. Never sent. */
  isDraft: boolean;
}

export interface Conversation {
  id: UUID;
  workspaceId: UUID;
  leadId: UUID;
  companyId: UUID;
  contactId?: UUID;
  channel: ConversationChannel;
  subject: string;
  mode: ConversationMode;
  unreadCount: number;
  needsAttention: boolean;
  assigneeId?: UUID;
  lastMessagePreview: string;
  lastMessageAt: ISODate;
  createdAt: ISODate;
  messages: Message[];
}

/* ------------------------------------------------------------------ */
/* Appointments                                                       */
/* ------------------------------------------------------------------ */

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
export type MeetingType = "Discovery Call" | "Strategy Session" | "Demo" | "Proposal Review" | "Kickoff";

export interface Appointment {
  id: UUID;
  workspaceId: UUID;
  leadId: UUID;
  companyId: UUID;
  contactId?: UUID;
  title: string;
  meetingType: MeetingType;
  status: AppointmentStatus;
  startsAt: ISODate;
  endsAt: ISODate;
  location: string;
  notes?: string;
  bookedByAI: boolean;
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Outreach                                                           */
/* ------------------------------------------------------------------ */

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface CampaignStep {
  id: UUID;
  dayOffset: number;
  channel: ConversationChannel;
  name: string;
  subject: string;
  preview: string;
  sent: number;
  opened: number;
  replied: number;
}

export interface Campaign {
  id: UUID;
  workspaceId: UUID;
  name: string;
  status: CampaignStatus;
  audienceSummary: string;
  minScore: number;
  services: string[];
  steps: CampaignStep[];
  stats: {
    enrolled: number;
    sent: number;
    delivered: number;
    opened: number;
    replied: number;
    interested: number;
    booked: number;
  };
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Activity, notifications, integrations                              */
/* ------------------------------------------------------------------ */

export type ActivityType =
  | "lead_discovered"
  | "ai_qualified"
  | "outreach_generated"
  | "message_sent"
  | "reply_received"
  | "intent_detected"
  | "stage_changed"
  | "appointment_booked"
  | "note_added"
  | "handoff_requested";

export interface Activity {
  id: UUID;
  workspaceId: UUID;
  type: ActivityType;
  actor: "ai" | "human" | "system";
  actorName: string;
  summary: string;
  detail?: string;
  leadId?: UUID;
  companyId?: UUID;
  createdAt: ISODate;
}

export type NotificationKind =
  | "high_intent_lead"
  | "ai_qualified"
  | "prospect_replied"
  | "appointment_booked"
  | "intent_detected"
  | "handoff_required";

export interface AppNotification {
  id: UUID;
  workspaceId: UUID;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: ISODate;
}

export type IntegrationStatus = "connected" | "available" | "coming_soon" | "error";
export type IntegrationCategory = "Data" | "AI" | "Calendar" | "Email" | "Developer";

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  /** Lucide icon name resolved through components/common/icon.tsx */
  icon: string;
  docsUrl?: string;
  connectedAt?: ISODate;
  /** Why it is not connected, or what it needs. Shown on the card. */
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Saved searches & analytics                                         */
/* ------------------------------------------------------------------ */

export interface SavedSearch {
  id: UUID;
  workspaceId: UUID;
  name: string;
  keywords: string[];
  location: string;
  industry: string;
  sources: LeadSource[];
  minScore: number;
  cadenceHours: number;
  lastRunAt: ISODate;
  newResults: number;
}

export interface FunnelPoint {
  stage: string;
  value: number;
  rate: number;
}

export interface TimeSeriesPoint {
  date: string;
  discovered: number;
  qualified: number;
  contacted: number;
  responses: number;
  appointments: number;
}

export interface SourcePerformance {
  source: LeadSource;
  leads: number;
  qualified: number;
  replies: number;
  booked: number;
  won: number;
  avgScore: number;
}

export interface MetricSummary {
  key: string;
  label: string;
  value: number;
  format: "number" | "percent" | "currency" | "duration";
  deltaPct: number;
  context: string;
}

/** Lightweight pipeline record for switchers and lists. */
export type PipelineSummary = Pick<Pipeline, "id" | "name" | "isDefault">;
