import type { EngagementType, JobPost, LeadSource } from "@/types";
import { hoursAgo, seededRandom } from "@/lib/utils";
import { COMPANIES } from "./companies";
import { WORKSPACE_ID } from "./workspace";

interface RoleTemplate {
  title: string;
  /** Restricts the template to companies in these industries. */
  industries?: string[];
  description: string;
  skills: string[];
  engagement: EngagementType;
  budget: [number, number];
  period: "hour" | "month" | "project";
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    title: "GoHighLevel Automation Specialist",
    description:
      "We are looking for a specialist to rebuild our lead follow-up inside GoHighLevel. Right now enquiries sit in an inbox until someone gets to them, and we are losing deals to slower response times. You would own the workflow build, SMS and email sequences, calendar routing, and the reporting dashboard our leadership reviews weekly.",
    skills: ["GoHighLevel", "Workflow Automation", "SMS", "Email Sequences"],
    engagement: "Contract",
    budget: [45, 85],
    period: "hour",
  },
  {
    title: "CRM Specialist — Pipeline Rebuild",
    description:
      "Our sales team tracks opportunities across three spreadsheets and a shared inbox. We need someone to design a single pipeline, migrate historical records, define stage automation, and train the team on it. Experience with service businesses preferred.",
    skills: ["CRM", "Data Migration", "Pipeline Design", "Training"],
    engagement: "Contract",
    budget: [4000, 9000],
    period: "project",
  },
  {
    title: "AI Automation Engineer (Part-Time)",
    description:
      "Seeking an automation engineer to connect our intake forms, CRM, and scheduling tools, then layer an AI assistant that qualifies enquiries before they reach a human. Must be comfortable with API integrations and prompt design.",
    skills: ["AI Automation", "API Integration", "Prompt Design", "Make/Zapier"],
    engagement: "Part-time",
    budget: [3500, 6500],
    period: "month",
  },
  {
    title: "Funnel Builder for Lead Generation Campaign",
    description:
      "We are launching a new offer next quarter and need landing pages, a booking funnel, and the tracking behind it. Deliverables include page build, form logic, calendar integration, and conversion reporting.",
    skills: ["Funnel Building", "Landing Pages", "Conversion Tracking"],
    engagement: "Freelance",
    budget: [2500, 6000],
    period: "project",
  },
  {
    title: "Marketing Operations Contractor",
    description:
      "Support our marketing team with campaign operations: list segmentation, lifecycle email builds, attribution reporting, and keeping our CRM data clean. Ongoing engagement with room to expand.",
    skills: ["Marketing Ops", "Segmentation", "Reporting", "Email"],
    engagement: "Retainer",
    budget: [2800, 5200],
    period: "month",
  },
  {
    title: "Appointment Booking Automation Consultant",
    description:
      "Our show rate is under 60%. We need reminder sequences, rescheduling flows, and no-show recovery automation wired into our calendar so the front desk stops chasing confirmations by phone.",
    skills: ["Automation", "Calendar Integration", "SMS Reminders"],
    engagement: "Contract",
    budget: [2000, 4500],
    period: "project",
  },
  {
    title: "Web Developer — Marketing Site Rebuild",
    description:
      "Rebuild our marketing site with a modern stack, clean CMS handoff, and fast page loads. Bonus if you can wire form submissions directly into our CRM with proper source tracking.",
    skills: ["Web Development", "CMS", "Performance", "Forms"],
    engagement: "Contract",
    budget: [6000, 14000],
    period: "project",
  },
  {
    title: "WordPress Developer (Ongoing Support)",
    description:
      "Looking for ongoing WordPress support: landing page builds, plugin maintenance, speed optimisation, and integration work with our marketing tools. Roughly 20 hours per month.",
    skills: ["WordPress", "PHP", "Page Speed", "Integrations"],
    engagement: "Retainer",
    budget: [35, 60],
    period: "hour",
  },
  {
    title: "White-Label Automation Partner for Agency",
    industries: ["Marketing Agency"],
    description:
      "Our agency sells automation retainers but does not build them in-house. We are looking for a delivery partner to handle client builds under our brand, with clear SOPs and predictable turnaround.",
    skills: ["White Label", "GoHighLevel", "Client Delivery", "SOPs"],
    engagement: "Retainer",
    budget: [5000, 12000],
    period: "month",
  },
  {
    title: "Speed-to-Lead Systems Specialist",
    industries: ["Home Services", "Real Estate", "Construction", "Health & Wellness", "Financial Services"],
    description:
      "Every missed call is lost revenue for us. We want missed-call text-back, instant lead routing to the on-call tech, and a dashboard showing response times by team member.",
    skills: ["Speed to Lead", "Call Routing", "Automation", "Reporting"],
    engagement: "Contract",
    budget: [3000, 7000],
    period: "project",
  },
  {
    title: "Email Marketing & Lifecycle Specialist",
    industries: ["E-commerce", "Marketing Agency", "Education", "SaaS"],
    description:
      "Own our lifecycle programme end to end: welcome series, win-back, replenishment, and post-purchase. You will work from our existing brand voice guide and report on revenue per send.",
    skills: ["Email Marketing", "Lifecycle", "Klaviyo", "Copywriting"],
    engagement: "Part-time",
    budget: [3200, 5800],
    period: "month",
  },
  {
    title: "Sales Pipeline Automation Consultant",
    description:
      "Help us instrument our sales process: stage definitions, automated task creation, proposal follow-up, and forecast reporting the leadership team can trust.",
    skills: ["Sales Ops", "Automation", "Forecasting"],
    engagement: "Contract",
    budget: [4500, 9500],
    period: "project",
  },
  {
    title: "Client Onboarding Automation Builder",
    industries: ["Professional Services", "Financial Services", "SaaS", "Marketing Agency", "Education"],
    description:
      "New clients currently receive a manual welcome email and a PDF. We want an automated onboarding journey with document collection, kickoff scheduling, and internal handoff tasks.",
    skills: ["Onboarding", "Automation", "Document Workflow"],
    engagement: "Contract",
    budget: [3500, 8000],
    period: "project",
  },
  {
    title: "Paid Ads Manager with CRM Integration Experience",
    description:
      "Manage our paid search and social spend, and make sure conversions flow back into the CRM so we can optimise on booked appointments rather than form fills.",
    skills: ["Paid Ads", "Conversion API", "CRM", "Attribution"],
    engagement: "Retainer",
    budget: [2500, 6000],
    period: "month",
  },
  {
    title: "Reporting Dashboard Developer",
    description:
      "Build a leadership dashboard consolidating lead sources, pipeline movement, and revenue attribution. Data lives in our CRM, ad platforms, and a Postgres database.",
    skills: ["Dashboards", "SQL", "Data Integration"],
    engagement: "Freelance",
    budget: [3000, 7500],
    period: "project",
  },
];

const SOURCES: LeadSource[] = [
  "LinkedIn",
  "Indeed",
  "Upwork",
  "Facebook Groups",
  "Company Site",
  "AngelList",
  "Reddit",
  "Referral",
];

const rand = seededRandom(77712);

/** 75 opportunities spread across the company set. */
export const JOB_POSTS: JobPost[] = Array.from({ length: 75 }, (_, index) => {
  const company = COMPANIES[index % COMPANIES.length];
  // Pick the first template that fits the company industry, starting from a
  // deterministic offset so the same company does not repeat one role.
  const offset = (index * 7 + Math.floor(index / COMPANIES.length)) % ROLE_TEMPLATES.length;
  const template =
    ROLE_TEMPLATES.map((_, position) => ROLE_TEMPLATES[(offset + position) % ROLE_TEMPLATES.length]).find(
      (candidate) => !candidate.industries || candidate.industries.includes(company.industry),
    ) ?? ROLE_TEMPLATES[offset];
  const source = SOURCES[(index * 3) % SOURCES.length];
  const spread = rand();
  const budgetMin = Math.round(template.budget[0] * (0.9 + spread * 0.2));
  const budgetMax = Math.round(template.budget[1] * (0.9 + spread * 0.25));

  return {
    id: `job_${index + 1}`,
    workspaceId: WORKSPACE_ID,
    companyId: company.id,
    title: template.title,
    description: template.description,
    source,
    sourceUrl: `https://${source.toLowerCase().replace(/\s+/g, "")}.com/jobs/${company.domain.split(".")[0]}-${index + 1}`,
    location: company.location,
    remote: index % 3 !== 0,
    engagementType: template.engagement,
    budgetMin,
    budgetMax,
    budgetPeriod: template.period,
    skills: template.skills,
    postedAt: hoursAgo(2 + index * 9 + Math.floor(spread * 6)),
    capturedAt: hoursAgo(1 + index * 9),
  };
});

export function getJobPostById(id: string): JobPost | undefined {
  return JOB_POSTS.find((post) => post.id === id);
}

export function getJobPostsByCompany(companyId: string): JobPost[] {
  return JOB_POSTS.filter((post) => post.companyId === companyId);
}
