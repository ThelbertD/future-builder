import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PipelineSwitcher } from "@/components/pipeline/pipeline-switcher";
import { getActiveWorkspace } from "@/lib/supabase/auth";
import { fetchLeads, fetchPipelines, fetchPipelineStages } from "@/lib/supabase/queries";
import { formatCompact } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline" };

interface PageProps {
  searchParams: Promise<{ p?: string }>;
}

export default async function PipelinePage({ searchParams }: PageProps) {
  const [{ p }, pipelines, allLeads, workspace] = await Promise.all([
    searchParams,
    fetchPipelines(),
    fetchLeads(),
    getActiveWorkspace(),
  ]);

  const activePipeline = pipelines.find((pipeline) => pipeline.id === p) ?? pipelines[0];
  const stages = await fetchPipelineStages(activePipeline?.id);

  // Leads live on a stage, so a board only shows the leads in its own stages.
  const stageIds = new Set(stages.map((stage) => stage.id));
  const leads = allLeads.filter((lead) => stageIds.has(lead.stageId));

  const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.status));
  const openValue = openLeads.reduce((total, lead) => total + lead.estimatedValue, 0);
  const weighted = openLeads.reduce((total, lead) => {
    const stage = stages.find((item) => item.id === lead.stageId);
    return total + (lead.estimatedValue * (stage?.probability ?? 0)) / 100;
  }, 0);

  return (
    <div className="flex h-[calc(100svh-108px)] flex-col lg:h-[calc(100svh-52px)]">
      <div className="shrink-0 px-4 py-5 lg:px-6">
        <PageHeader
          title="Pipeline"
          description={`${openLeads.length} open opportunities · $${formatCompact(openValue)} open value · $${formatCompact(weighted)} weighted`}
          actions={
            pipelines.length > 0 && activePipeline ? (
              <PipelineSwitcher pipelines={pipelines} activePipelineId={activePipeline.id} />
            ) : null
          }
        />
      </div>
      <div className="min-h-0 flex-1">
        <PipelineBoard
          key={activePipeline?.id ?? "none"}
          stages={stages}
          leads={leads}
          workspaceId={workspace?.id ?? ""}
          pipelineId={activePipeline?.id ?? ""}
        />
      </div>
    </div>
  );
}
