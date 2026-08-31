import type { LeadStatus, Pipeline, PipelineStage } from "@/types";
import { WORKSPACE_ID } from "./workspace";

export const PIPELINE_ID = "pip_default";

/** id | name | probability | colorToken | won | lost */
type StageSeed = [LeadStatus, string, number, string, boolean?, boolean?];

const STAGE_SEEDS: StageSeed[] = [
  ["new", "New", 5, "chart-5"],
  ["qualified", "AI Qualified", 15, "chart-1"],
  ["ready", "Ready to Contact", 20, "chart-1"],
  ["contacted", "Contacted", 30, "chart-1"],
  ["replied", "Replied", 40, "chart-3"],
  ["interested", "Interested", 55, "chart-3"],
  ["booked", "Appointment Booked", 65, "chart-2"],
  ["call_completed", "Call Completed", 72, "chart-2"],
  ["proposal", "Proposal Sent", 80, "chart-4"],
  ["negotiation", "Negotiation", 88, "chart-4"],
  ["won", "Won", 100, "chart-2", true],
  ["lost", "Lost", 0, "chart-5", false, true],
];

export const PIPELINE_STAGES: PipelineStage[] = STAGE_SEEDS.map(
  ([status, name, probability, colorToken, isWon, isLost], index) => ({
    id: `stg_${status}`,
    workspaceId: WORKSPACE_ID,
    pipelineId: PIPELINE_ID,
    name,
    colorToken,
    position: index,
    probability,
    isWon: Boolean(isWon),
    isLost: Boolean(isLost),
  }),
);

export const DEFAULT_PIPELINE: Pipeline = {
  id: PIPELINE_ID,
  workspaceId: WORKSPACE_ID,
  name: "Client Acquisition",
  isDefault: true,
  stages: PIPELINE_STAGES,
};

export function stageIdForStatus(status: LeadStatus): string {
  return `stg_${status}`;
}

export function getStageById(id: string): PipelineStage | undefined {
  return PIPELINE_STAGES.find((stage) => stage.id === id);
}

/** The compact stage set shown in the dashboard pipeline strip. */
export const DASHBOARD_STAGE_IDS = [
  "stg_new",
  "stg_qualified",
  "stg_contacted",
  "stg_replied",
  "stg_interested",
  "stg_booked",
  "stg_won",
];
