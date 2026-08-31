import type { Campaign, CampaignStatus } from "@/types";
import { daysAgo } from "@/lib/utils";
import { WORKSPACE_ID } from "./workspace";

interface CampaignSeed {
  name: string;
  status: CampaignStatus;
  audienceSummary: string;
  minScore: number;
  services: string[];
  enrolled: number;
  performance: [number, number, number, number, number, number];
}

const SEEDS: CampaignSeed[] = [
  {
    name: "Agency Automation Partners",
    status: "active",
    audienceSummary: "Marketing agencies hiring automation help · AI score above 80",
    minScore: 80,
    services: ["GoHighLevel Automation", "Workflow Integration"],
    enrolled: 148,
    performance: [412, 402, 233, 61, 24, 11],
  },
  {
    name: "Home Services — Speed to Lead",
    status: "active",
    audienceSummary: "Home service companies with missed-call pain · AI score above 72",
    minScore: 72,
    services: ["CRM Automation", "AI Automation"],
    enrolled: 96,
    performance: [268, 259, 141, 38, 15, 7],
  },
  {
    name: "Clinics & Practices Q4",
    status: "paused",
    audienceSummary: "Health and wellness practices posting intake roles · AI score above 75",
    minScore: 75,
    services: ["CRM Automation", "Funnel Building"],
    enrolled: 64,
    performance: [176, 170, 88, 21, 9, 4],
  },
  {
    name: "Real Estate Brokerages",
    status: "draft",
    audienceSummary: "Brokerages with 50+ agents · AI score above 78",
    minScore: 78,
    services: ["GoHighLevel Automation", "Email Marketing"],
    enrolled: 0,
    performance: [0, 0, 0, 0, 0, 0],
  },
];

const STEP_BLUEPRINT = [
  {
    dayOffset: 0,
    name: "Initial email",
    subject: "Saw your {role} posting",
    preview:
      "Opens with the specific problem named in their job post, then offers a fixed-scope alternative to hiring.",
    share: 1,
  },
  {
    dayOffset: 2,
    name: "Follow-up",
    subject: "Quick follow-up on your automation build",
    preview: "Short nudge with a comparable rollout from the same industry.",
    share: 0.78,
  },
  {
    dayOffset: 5,
    name: "Value follow-up",
    subject: "The two-week build outline",
    preview: "Sends the build outline and expected first-response improvement — no ask beyond a reply.",
    share: 0.56,
  },
  {
    dayOffset: 9,
    name: "Final follow-up",
    subject: "Closing the loop",
    preview: "Polite close-out that leaves the door open and asks whether the search is still active.",
    share: 0.38,
  },
];

export const CAMPAIGNS: Campaign[] = SEEDS.map((seed, index) => {
  const [sent, delivered, opened, replied, interested, booked] = seed.performance;

  return {
    id: `cmp_out_${index + 1}`,
    workspaceId: WORKSPACE_ID,
    name: seed.name,
    status: seed.status,
    audienceSummary: seed.audienceSummary,
    minScore: seed.minScore,
    services: seed.services,
    steps: STEP_BLUEPRINT.map((step, stepIndex) => ({
      id: `stp_${index + 1}_${stepIndex + 1}`,
      dayOffset: step.dayOffset,
      channel: "email" as const,
      name: step.name,
      subject: step.subject,
      preview: step.preview,
      sent: Math.round(sent * step.share * 0.25),
      opened: Math.round(opened * step.share * 0.25),
      replied: Math.round(replied * step.share * 0.25),
    })),
    stats: { enrolled: seed.enrolled, sent, delivered, opened, replied, interested, booked },
    createdAt: daysAgo(60 - index * 12),
    updatedAt: daysAgo(index + 1),
  };
});

export function getCampaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}
