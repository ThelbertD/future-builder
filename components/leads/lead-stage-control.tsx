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
import { PIPELINE_STAGES } from "@/lib/mock";

export function LeadStageControl({ leadId, stageId }: { leadId: string; stageId: string }) {
  const [value, setValue] = React.useState(stageId);

  const change = (next: string) => {
    setValue(next);
    const stage = PIPELINE_STAGES.find((item) => item.id === next);
    toast.success("Stage updated", { description: `Lead moved to ${stage?.name ?? "a new stage"}.` });
  };

  return (
    <Select value={value} onValueChange={change} name={`stage-${leadId}`}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PIPELINE_STAGES.map((stage) => (
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
