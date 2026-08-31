import type { Metadata } from "next";
import { KanbanSquare, Settings2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { Button } from "@/components/ui/button";
import { getActiveWorkspace } from "@/lib/supabase/auth";
import { fetchLeads, fetchPipelineStages } from "@/lib/supabase/queries";
import { formatCompact } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const [stages, leads, workspace] = await Promise.all([
    fetchPipelineStages(),
    fetchLeads(),
    getActiveWorkspace(),
  ]);

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
            <Button variant="outline" size="sm">
              <Settings2 />
              Customise stages
            </Button>
          }
        />
      </div>
      <div className="min-h-0 flex-1">
        {stages.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyState
              icon={KanbanSquare}
              title="No pipeline stages"
              description="This workspace has no stages yet. They are created automatically when a workspace is provisioned."
            />
          </div>
        ) : (
          <PipelineBoard
            stages={stages}
            leads={leads}
            workspaceId={workspace?.id ?? ""}
            pipelineId={stages[0]?.pipelineId ?? ""}
          />
        )}
      </div>
    </div>
  );
}
