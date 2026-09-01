import type { ScrapedJob, SearchQuery } from "@/lib/scraper/types";
import type { IntentLevel, LeadScoreBreakdown } from "@/types";

export interface ScoredJob extends ScrapedJob {
  score: number;
  intent: IntentLevel;
  breakdown: LeadScoreBreakdown;
  signals: string[];
  risks: string[];
  reasoning: string;
  recommendedServices: string[];
  opportunityType: "Direct Client" | "Agency Subcontract" | "White Label" | "Retainer";
  confidence: number;
  estimatedValue: number;
}

/**
 * Deterministic, explainable scoring.
 *
 * Every point is traceable to something in the posting, which is what makes the
 * reasoning defensible. The AI provider replaces this in the qualification
 * phase; the output shape is already the one the lead detail page renders.
 */
const MAX = { intentSignals: 30, budgetFit: 22, serviceMatch: 24, companyFit: 14, timing: 10 };

const SERVICE_MATCHERS: Array<[RegExp, string]> = [
  [/gohighlevel|ghl\b/i, "GoHighLevel Automation"],
  [/\bcrm\b|hubspot|salesforce|pipedrive|pipeline/i, "CRM Automation"],
  [/\bai\b|automation|zapier|make\.com|n8n|workflow/i, "AI Automation"],
  [/funnel|landing page|clickfunnels/i, "Funnel Building"],
  [/web(site)? develop|wordpress|webflow|shopify|front.?end/i, "Web Development"],
  [/paid (ads|media)|google ads|meta ads|ppc/i, "Paid Ads Management"],
  [/email marketing|klaviyo|lifecycle|newsletter/i, "Email Marketing"],
  [/integrat|api|webhook|data pipeline/i, "Workflow Integration"],
];

/** Phrases that indicate the problem this product actually solves. */
const PAIN_SIGNALS: Array<[RegExp, string]> = [
  [/follow.?up/i, "Mentions follow-up as a problem"],
  [/manual(ly)?/i, "Describes a manual process"],
  [/lead(s)? (management|generation|routing|nurtur)/i, "Lead handling named explicitly"],
  [/response time|speed to lead|missed call/i, "Response time called out"],
  [/scal(e|ing) (our|the) (team|operations)/i, "Scaling operations"],
  [/urgent|asap|immediately|start (right away|immediately)/i, "Urgency in the wording"],
];

const CONTRACT_ENGAGEMENTS = new Set(["Contract", "Freelance", "Part-time", "Retainer"]);

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

function parseSalary(text?: string): number {
  if (!text) return 0;
  const numbers = text.replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
  if (!numbers) return 0;

  const values = numbers.map(Number).map((value) => (/k/i.test(text) && value < 1000 ? value * 1000 : value));
  const highest = Math.max(...values);
  return Number.isFinite(highest) ? highest : 0;
}

function intentForScore(score: number): IntentLevel {
  if (score >= 88) return "hot";
  if (score >= 74) return "high";
  if (score >= 58) return "medium";
  return "low";
}

export function scoreJob(job: ScrapedJob, query: SearchQuery): ScoredJob {
  const haystack = `${job.title} ${job.tags.join(" ")} ${job.description}`;
  const signals: string[] = [];
  const risks: string[] = [];

  /* Intent -------------------------------------------------------------- */
  let intentSignals = 0;
  const titleMatch = query.keywords.some((keyword) =>
    keyword
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 2)
      .some((token) => job.title.toLowerCase().includes(token)),
  );

  if (titleMatch) {
    intentSignals += 18;
    signals.push("Search keyword appears in the job title");
  }

  for (const [pattern, label] of PAIN_SIGNALS) {
    if (intentSignals >= MAX.intentSignals) break;
    if (pattern.test(haystack)) {
      intentSignals += 4;
      signals.push(label);
    }
  }
  intentSignals = Math.min(MAX.intentSignals, intentSignals);

  /* Budget -------------------------------------------------------------- */
  let budgetFit = 0;
  const salary = parseSalary(job.salaryText);

  if (salary > 0) {
    budgetFit += 12;
    signals.push(`Compensation published (${job.salaryText})`);
  } else {
    risks.push("No budget published in the listing");
  }

  if (CONTRACT_ENGAGEMENTS.has(job.engagementType)) {
    budgetFit += 10;
    signals.push(`${job.engagementType} engagement rather than a permanent hire`);
  } else {
    risks.push("Advertised as a permanent role, so may prefer an in-house hire");
  }
  budgetFit = Math.min(MAX.budgetFit, budgetFit);

  /* Service match -------------------------------------------------------- */
  const matchedServices = SERVICE_MATCHERS.filter(([pattern]) => pattern.test(haystack)).map(
    ([, service]) => service,
  );
  const recommendedServices = Array.from(new Set(matchedServices)).slice(0, 3);
  const serviceMatch = Math.min(MAX.serviceMatch, recommendedServices.length * 8);

  if (recommendedServices.length > 0) {
    signals.push(`Matches ${recommendedServices.length} of your services`);
  } else {
    risks.push("No clear overlap with your service catalogue");
  }

  /* Company fit ---------------------------------------------------------- */
  let companyFit = job.companyName ? 4 : 0;
  const wantsRemote = /remote/i.test(query.location);
  const locationMatch =
    query.location === "all" ||
    wantsRemote === job.remote ||
    job.location.toLowerCase().includes(query.location.toLowerCase());

  if (locationMatch) {
    companyFit += 10;
  } else {
    risks.push(`Located in ${job.location}, outside your search area`);
  }
  companyFit = Math.min(MAX.companyFit, companyFit);

  /* Timing --------------------------------------------------------------- */
  const age = daysSince(job.postedAt);
  let timing = 0;
  if (age <= 2) {
    timing = 10;
    signals.push("Posted within the last 48 hours");
  } else if (age <= 7) {
    timing = 7;
    signals.push("Posted this week");
  } else if (age <= 30) {
    timing = 3;
  } else {
    risks.push("Posting is over a month old");
  }

  const breakdown: LeadScoreBreakdown = { intentSignals, budgetFit, serviceMatch, companyFit, timing };
  const score = Math.min(
    100,
    intentSignals + budgetFit + serviceMatch + companyFit + timing,
  );

  const opportunityType = /agency|studio|consultancy|partner/i.test(job.companyName)
    ? "Agency Subcontract"
    : CONTRACT_ENGAGEMENTS.has(job.engagementType)
      ? "Direct Client"
      : "Retainer";

  const leadService = recommendedServices[0] ?? "workflow automation";
  const reasoning = `${job.companyName} is hiring for ${job.title.toLowerCase()} on ${job.sourceName}, posted ${
    age < 1 ? "today" : `${Math.round(age)} day${Math.round(age) === 1 ? "" : "s"} ago`
  }. ${
    signals.length > 0
      ? `The strongest signals are: ${signals.slice(0, 2).join(", ").toLowerCase()}.`
      : "The listing carries few explicit buying signals."
  } Lead with ${leadService.toLowerCase()}${
    salary > 0 ? ` and anchor against the published budget` : ` and qualify budget on the first call`
  }.`;

  return {
    ...job,
    score,
    intent: intentForScore(score),
    breakdown,
    signals: signals.slice(0, 5),
    risks: risks.slice(0, 3),
    reasoning,
    recommendedServices,
    opportunityType,
    // Confidence reflects how much the posting actually told us.
    confidence: Math.min(96, 55 + signals.length * 7),
    estimatedValue: salary > 0 ? Math.round(salary * 0.12) : 4000,
  };
}
