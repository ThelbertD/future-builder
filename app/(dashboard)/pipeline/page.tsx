import type { Metadata } from "next";
import { Settings2 } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { Button } from "@/components/ui/button";
import { LEADS_WITH_RELATIONS, PIPELINE_STAGES } from "@/lib/mock";
import { formatCompact } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  const openLeads = LEADS_WITH_RELATIONS.filter((lead) => !["won", "lost"].includes(lead.status));
  const openValue = openLeads.reduce((total, lead) => total + lead.estimatedValue, 0);
  const weighted = openLeads.reduce((total, lead) => {
    const stage = PIPELINE_STAGES.find((item) => item.id === lead.stageId);
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
        <PipelineBoard stages={PIPELINE_STAGES} leads={LEADS_WITH_RELATIONS} />
      </div>
    </div>
  );
}
