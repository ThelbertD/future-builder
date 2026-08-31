import type { AIAnalysis, IntentLevel, Lead, LeadStatus, LeadWithRelations } from "@/types";
import { SERVICES } from "@/lib/constants";
import { hoursAgo, seededRandom } from "@/lib/utils";
import { COMPANIES, CONTACTS, getPrimaryContact } from "./companies";
import { JOB_POSTS } from "./jobs";
import { stageIdForStatus } from "./pipeline";
import { WORKSPACE_ID } from "./workspace";

/** Realistic status mix — most volume sits at the top of the funnel. */
const STATUS_MIX: LeadStatus[] = [
  ...Array<LeadStatus>(6).fill("new"),
  ...Array<LeadStatus>(5).fill("qualified"),
  ...Array<LeadStatus>(4).fill("ready"),
  ...Array<LeadStatus>(5).fill("contacted"),
  ...Array<LeadStatus>(4).fill("replied"),
  ...Array<LeadStatus>(4).fill("interested"),
  ...Array<LeadStatus>(3).fill("booked"),
  ...Array<LeadStatus>(2).fill("call_completed"),
  ...Array<LeadStatus>(2).fill("proposal"),
  ...Array<LeadStatus>(2).fill("negotiation"),
  ...Array<LeadStatus>(2).fill("won"),
  ...Array<LeadStatus>(1).fill("lost"),
];

function intentForScore(score: number): IntentLevel {
  if (score >= 90) return "hot";
  if (score >= 78) return "high";
  if (score >= 64) return "medium";
  return "low";
}

const REASONING_TEMPLATES = [
  (company: string, role: string) =>
    `${company} is actively recruiting for a ${role.toLowerCase()}, which signals they have already budgeted for the work and are comparing providers now. The posting describes manual follow-up as their bottleneck — the exact problem this workspace solves.`,
  (company: string, role: string) =>
    `The ${role.toLowerCase()} listing at ${company} names specific tools rather than general marketing help, so the buyer understands scope. Hiring a contractor rather than an employee suggests they would consider an agency retainer.`,
  (company: string, role: string) =>
    `${company} posted this ${role.toLowerCase()} role after two earlier attempts to hire in-house. Repeated posting for the same skillset usually means an unfilled, urgent need and a shorter sales cycle.`,
  (company: string, role: string) =>
    `Language in the ${role.toLowerCase()} post points to lost revenue from slow response times. The measurable pain and named budget range place this well inside the ideal customer profile.`,
  (company: string, role: string) =>
    `${company} is mid-expansion and the ${role.toLowerCase()} requirement is downstream of that growth. They need delivery capacity quickly, which favours a partner who can start inside two weeks.`,
  (company: string, role: string) =>
    `This ${role.toLowerCase()} opportunity at ${company} matches three prior closed-won engagements in the same industry. Positioning around a fixed-scope pilot has converted well with this profile.`,
];

const SIGNAL_POOL = [
  "Posted within the last 48 hours",
  "Budget range published in the listing",
  "Contract engagement rather than full-time hire",
  "Decision-maker identified on the listing",
  "Named the exact tool stack in the requirements",
  "Second posting for the same role this quarter",
  "Company headcount grew this year",
  "Explicitly mentions lead follow-up delays",
  "Requests a start date inside 30 days",
];

const RISK_POOL = [
  "May prefer an in-house hire over an agency",
  "Budget ceiling sits below the standard retainer",
  "Multiple providers likely already contacted",
  "Decision-maker not yet confirmed",
  "Long procurement process for this company size",
];

const NEXT_ACTIONS = [
  "Send a tailored first message referencing their follow-up delay.",
  "Offer a 20-minute audit call this week.",
  "Share the case study from the same industry, then propose a call.",
  "Follow up on the previous message with a specific time slot.",
  "Send the fixed-scope pilot proposal.",
];

const OPPORTUNITY_TYPES = ["Direct Client", "Agency Subcontract", "White Label", "Retainer"] as const;

/** Maps an opportunity title onto the workspace service catalogue. */
const SERVICE_MATCHERS: Array<[RegExp, (typeof SERVICES)[number]]> = [
  [/gohighlevel|ghl/i, "GoHighLevel Automation"],
  [/crm|pipeline|sales/i, "CRM Automation"],
  [/\bai\b|automation|speed|onboarding|appointment/i, "AI Automation"],
  [/funnel|landing/i, "Funnel Building"],
  [/web|wordpress|site/i, "Web Development"],
  [/ads|paid/i, "Paid Ads Management"],
  [/email|lifecycle|marketing operations/i, "Email Marketing"],
  [/dashboard|reporting|integration/i, "Workflow Integration"],
];

function servicesFor(title: string, index: number): string[] {
  const matched = SERVICE_MATCHERS.filter(([pattern]) => pattern.test(title)).map(([, service]) => service);
  const fallback = SERVICES[index % SERVICES.length];
  return Array.from(new Set([...matched, fallback])).slice(0, 3);
}

const rand = seededRandom(40404);

interface GeneratedLead {
  lead: Lead;
  analysis: AIAnalysis;
}

const GENERATED: GeneratedLead[] = STATUS_MIX.map((status, index) => {
  const job = JOB_POSTS[index];
  const company = COMPANIES.find((c) => c.id === job.companyId)!;
  const contact = getPrimaryContact(company.id);
  const progressBoost = Math.min(18, STATUS_MIX.indexOf(status) * 0.35);
  const score = Math.max(
    41,
    Math.min(98, Math.round(company.leadScore - 8 + progressBoost + rand() * 10)),
  );
  const intent = intentForScore(score);
  const stageAgeHours = 2 + Math.round(rand() * 120);
  const services = servicesFor(job.title, index);

  const lead: Lead = {
    id: `led_${index + 1}`,
    workspaceId: WORKSPACE_ID,
    companyId: company.id,
    contactId: contact?.id,
    jobPostId: job.id,
    stageId: stageIdForStatus(status),
    status,
    score,
    scoreBreakdown: {
      intentSignals: Math.round(score * 0.3),
      budgetFit: Math.round(score * 0.22),
      serviceMatch: Math.round(score * 0.24),
      companyFit: Math.round(score * 0.14),
      timing: Math.round(score * 0.1),
    },
    intent,
    ownerId: index % 4 === 0 ? "usr_marisol" : "usr_thelbert",
    tags: company.tags.slice(0, 2),
    estimatedValue: 2500 + Math.round(rand() * 21500),
    notes:
      index % 5 === 0
        ? "Referred by an existing client in the same vertical. Mention the shared connection in the first message."
        : "",
    source: job.source,
    createdAt: job.capturedAt,
    updatedAt: hoursAgo(1 + Math.round(rand() * 30)),
    lastActivityAt: hoursAgo(1 + Math.round(rand() * 48)),
    stageEnteredAt: hoursAgo(stageAgeHours),
  };

  const analysis: AIAnalysis = {
    id: `ana_${index + 1}`,
    workspaceId: WORKSPACE_ID,
    leadId: lead.id,
    score,
    intent,
    opportunityType: OPPORTUNITY_TYPES[index % OPPORTUNITY_TYPES.length],
    recommendedServices: services,
    reasoning: REASONING_TEMPLATES[index % REASONING_TEMPLATES.length](company.name, job.title),
    signals: [
      SIGNAL_POOL[index % SIGNAL_POOL.length],
      SIGNAL_POOL[(index + 3) % SIGNAL_POOL.length],
      SIGNAL_POOL[(index + 6) % SIGNAL_POOL.length],
    ],
    risks: [RISK_POOL[index % RISK_POOL.length]],
    suggestedNextAction: NEXT_ACTIONS[index % NEXT_ACTIONS.length],
    confidence: Math.round(72 + rand() * 26),
    model: "gpt-4.1",
    analyzedAt: hoursAgo(1 + Math.round(rand() * 20)),
  };

  return { lead, analysis };
});

export const LEADS: Lead[] = GENERATED.map((entry) => entry.lead);
export const AI_ANALYSES: AIAnalysis[] = GENERATED.map((entry) => entry.analysis);

export const LEADS_WITH_RELATIONS: LeadWithRelations[] = LEADS.map((lead) => ({
  ...lead,
  company: COMPANIES.find((company) => company.id === lead.companyId)!,
  contact: CONTACTS.find((contact) => contact.id === lead.contactId),
  jobPost: JOB_POSTS.find((post) => post.id === lead.jobPostId),
  analysis: AI_ANALYSES.find((analysis) => analysis.leadId === lead.id),
}));

export function getLeadById(id: string): LeadWithRelations | undefined {
  return LEADS_WITH_RELATIONS.find((lead) => lead.id === id);
}

export function getLeadsByCompany(companyId: string): LeadWithRelations[] {
  return LEADS_WITH_RELATIONS.filter((lead) => lead.companyId === companyId);
}

export function getLeadsByStage(stageId: string): LeadWithRelations[] {
  return LEADS_WITH_RELATIONS.filter((lead) => lead.stageId === stageId);
}

/** Highest-value opportunities surfaced on the dashboard. */
export const HOT_LEADS: LeadWithRelations[] = [...LEADS_WITH_RELATIONS]
  .filter((lead) => !["won", "lost"].includes(lead.status))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
