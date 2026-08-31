"use client";

import * as React from "react";
import { toast } from "sonner";

import { StageDot } from "@/components/common/indicators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PipelineStage } from "@/types";

export function LeadStageControl({
  leadId,
  stageId,
  stages,
}: {
  leadId: string;
  stageId: string;
  stages: PipelineStage[];
}) {
  const [value, setValue] = React.useState(stageId);

  const change = (next: string) => {
    setValue(next);
    const stage = stages.find((item) => item.id === next);
    toast.success("Stage updated", { description: `Lead moved to ${stage?.name ?? "a new stage"}.` });
  };

  return (
    <Select value={value} onValueChange={change} name={`stage-${leadId}`}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent>
        {stages.map((stage) => (
          <SelectItem key={stage.id} value={stage.id}>
            <span className="flex items-center gap-2">
              <StageDot colorToken={stage.colorToken} />
              {stage.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
