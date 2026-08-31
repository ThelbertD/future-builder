import Link from "next/link";

import { StageDot } from "@/components/common/indicators";
import { DASHBOARD_STAGE_NAMES } from "@/lib/constants";
import { formatCompact, formatPercent } from "@/lib/utils";
import type { LeadWithRelations, PipelineStage } from "@/types";

interface StageSummary {
  id: string;
  name: string;
  colorToken: string;
  count: number;
  value: number;
  conversion: number;
}

/** The dashboard strip shows the milestone stages rather than all twelve. */
function buildSummary(stages: PipelineStage[], leads: LeadWithRelations[]): StageSummary[] {
  const milestones = stages.filter((stage) => DASHBOARD_STAGE_NAMES.includes(stage.name));
  const selected = milestones.length > 0 ? milestones : stages.slice(0, 7);

  const summaries = selected.map((stage) => {
    const stageLeads = leads.filter((lead) => lead.stageId === stage.id);
    return {
      id: stage.id,
      name: stage.name,
      colorToken: stage.colorToken,
      count: stageLeads.length,
      value: stageLeads.reduce((total, lead) => total + lead.estimatedValue, 0),
      conversion: 0,
    };
  });

  return summaries.map((summary, index) => {
    const previous = summaries[index - 1];
    const conversion =
      index === 0 || !previous || previous.count === 0 ? 100 : (summary.count / previous.count) * 100;
    return { ...summary, conversion };
  });
}

export function PipelineOverview({
  stages,
  leads,
}: {
  stages: PipelineStage[];
  leads: LeadWithRelations[];
}) {
  const summaries = buildSummary(stages, leads);
  const max = Math.max(...summaries.map((summary) => summary.count), 1);

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 lg:grid-cols-7 lg:divide-y-0">
      {summaries.map((summary) => (
        <Link
          key={summary.id}
          href="/pipeline"
          className="group flex flex-col gap-2 p-3 transition-colors hover:bg-accent/30"
        >
          <span className="flex items-center gap-1.5">
            <StageDot colorToken={summary.colorToken} />
            <span className="truncate text-[11px] font-medium text-muted-foreground">{summary.name}</span>
          </span>
          <span className="text-xl leading-none font-semibold tabular-nums">{summary.count}</span>
          <span className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full transition-[width]"
              style={{
                width: `${(summary.count / max) * 100}%`,
                backgroundColor: `var(--${summary.colorToken})`,
              }}
            />
          </span>
          <span className="flex items-baseline justify-between text-[11px] text-muted-foreground">
            <span>{formatPercent(summary.conversion, 0)}</span>
            <span className="tabular-nums">${formatCompact(summary.value)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
