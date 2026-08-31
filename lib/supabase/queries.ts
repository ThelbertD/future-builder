/**
 * Data access layer.
 *
 * Every page reads through these functions instead of touching the mock module
 * or Supabase directly. When `NEXT_PUBLIC_USE_MOCK_DATA=false` and the Supabase
 * credentials are present, swap the mock branch for a query against the tables
 * created in database/migrations — the return types already match.
 */
import {
  APPOINTMENTS,
  CAMPAIGNS,
  COMPANIES,
  CONTACTS,
  CONVERSATIONS,
  DEFAULT_PIPELINE,
  INTEGRATIONS,
  JOB_POSTS,
  LEADS_WITH_RELATIONS,
  NOTIFICATIONS,
  PIPELINE_STAGES,
  SAVED_SEARCHES,
  getCompanyById,
  getLeadById,
} from "@/lib/mock";
import { useMockData } from "@/lib/supabase/env";
import type {
  Appointment,
  Campaign,
  Company,
  Contact,
  Conversation,
  Integration,
  JobPost,
  LeadWithRelations,
  Pipeline,
  PipelineStage,
  AppNotification,
  SavedSearch,
} from "@/types";

function notImplemented(resource: string): never {
  throw new Error(
    `Supabase reads for "${resource}" are not implemented yet. Keep NEXT_PUBLIC_USE_MOCK_DATA=true until the backend phase lands.`,
  );
}

export async function fetchLeads(): Promise<LeadWithRelations[]> {
  if (useMockData) return LEADS_WITH_RELATIONS;
  return notImplemented("leads");
}

export async function fetchLead(id: string): Promise<LeadWithRelations | undefined> {
  if (useMockData) return getLeadById(id);
  return notImplemented("lead");
}

export async function fetchCompanies(): Promise<Company[]> {
  if (useMockData) return COMPANIES;
  return notImplemented("companies");
}

export async function fetchCompany(id: string): Promise<Company | undefined> {
  if (useMockData) return getCompanyById(id);
  return notImplemented("company");
}

export async function fetchContacts(): Promise<Contact[]> {
  if (useMockData) return CONTACTS;
  return notImplemented("contacts");
}

export async function fetchJobPosts(): Promise<JobPost[]> {
  if (useMockData) return JOB_POSTS;
  return notImplemented("job_posts");
}

export async function fetchPipeline(): Promise<Pipeline> {
  if (useMockData) return DEFAULT_PIPELINE;
  return notImplemented("pipeline");
}

export async function fetchPipelineStages(): Promise<PipelineStage[]> {
  if (useMockData) return PIPELINE_STAGES;
  return notImplemented("pipeline_stages");
}

export async function fetchConversations(): Promise<Conversation[]> {
  if (useMockData) return CONVERSATIONS;
  return notImplemented("conversations");
}

export async function fetchAppointments(): Promise<Appointment[]> {
  if (useMockData) return APPOINTMENTS;
  return notImplemented("appointments");
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  if (useMockData) return CAMPAIGNS;
  return notImplemented("campaigns");
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  if (useMockData) return NOTIFICATIONS;
  return notImplemented("notifications");
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  if (useMockData) return SAVED_SEARCHES;
  return notImplemented("saved_searches");
}

export async function fetchIntegrations(): Promise<Integration[]> {
  if (useMockData) return INTEGRATIONS;
  return notImplemented("integrations");
}
