import type { Integration, SavedSearch } from "@/types";
import { hoursAgo } from "@/lib/utils";
import { WORKSPACE_ID } from "./workspace";

/**
 * Integration catalogue.
 *
 * This is metadata only. Real status is resolved server-side in
 * lib/supabase/queries.ts from what is actually configured, so a card never
 * claims a connection that does not exist.
 */
export const INTEGRATIONS: Integration[] = [
  {
    id: "supabase",
    name: "Supabase",
    category: "Data",
    description: "Primary database, authentication, and row level security for every workspace.",
    status: "available",
    icon: "Database",
    docsUrl: "https://supabase.com/docs",
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "AI",
    description: "Lead qualification, outreach drafting, and conversation summarisation.",
    status: "available",
    icon: "Sparkles",
    docsUrl: "https://platform.openai.com/docs",
  },
  {
    id: "anthropic",
    name: "Claude",
    category: "AI",
    description: "Alternative reasoning model for qualification and long-context thread analysis.",
    status: "available",
    icon: "Brain",
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "email-provider",
    name: "Email (Resend)",
    category: "Email",
    description: "Sends outreach from your own domain. Drafts stay unsent until this is connected.",
    status: "available",
    icon: "Mail",
    docsUrl: "https://resend.com/docs",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Calendar",
    description: "Two-way sync for availability, booked calls, and reschedules.",
    status: "coming_soon",
    icon: "CalendarDays",
  },
  {
    id: "google-meet",
    name: "Google Meet",
    category: "Calendar",
    description: "Generates a meeting link automatically on every booked appointment.",
    status: "coming_soon",
    icon: "Video",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    category: "Developer",
    description: "Push lead, stage, and appointment events into any external system.",
    status: "coming_soon",
    icon: "Webhook",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Developer",
    description: "Post high-intent lead alerts and handoff requests into a channel.",
    status: "coming_soon",
    icon: "MessageSquare",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "Data",
    description: "Discover hiring signals and enrich company records from public listings.",
    status: "coming_soon",
    icon: "Linkedin",
  },
];

export const SAVED_SEARCHES: SavedSearch[] = [
  {
    id: "sch_1",
    workspaceId: WORKSPACE_ID,
    name: "Companies Hiring GHL Experts",
    keywords: ["GoHighLevel Specialist", "GHL Expert"],
    location: "United States",
    industry: "Marketing Agency",
    sources: ["LinkedIn", "Upwork"],
    minScore: 80,
    cadenceHours: 6,
    lastRunAt: hoursAgo(2),
    newResults: 14,
  },
  {
    id: "sch_2",
    workspaceId: WORKSPACE_ID,
    name: "Home Services — Missed Call Pain",
    keywords: ["CRM Specialist", "Automation Specialist"],
    location: "United States",
    industry: "Home Services",
    sources: ["Indeed", "Facebook Groups"],
    minScore: 72,
    cadenceHours: 12,
    lastRunAt: hoursAgo(7),
    newResults: 6,
  },
  {
    id: "sch_3",
    workspaceId: WORKSPACE_ID,
    name: "Agencies Needing White Label",
    keywords: ["White Label Automation", "Agency Partner"],
    location: "Remote",
    industry: "Marketing Agency",
    sources: ["LinkedIn", "Reddit"],
    minScore: 85,
    cadenceHours: 24,
    lastRunAt: hoursAgo(19),
    newResults: 3,
  },
];
