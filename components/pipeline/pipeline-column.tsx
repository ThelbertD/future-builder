"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { StageDot } from "@/components/common/indicators";
import { PipelineCard } from "@/components/pipeline/pipeline-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCompact } from "@/lib/utils";
import type { LeadWithRelations, PipelineStage } from "@/types";

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: LeadWithRelations[];
  onEdit: (stage: PipelineStage) => void;
  onDelete: (stage: PipelineStage) => void;
  onMove: (stage: PipelineStage, direction: -1 | 1) => void;
}

export function PipelineColumn({ stage, leads, onEdit, onDelete, onMove }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const value = leads.reduce((total, lead) => total + lead.estimatedValue, 0);

  return (
    <div className="flex w-[272px] shrink-0 flex-col">
      <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-border bg-muted/40 px-3 py-2">
        <StageDot colorToken={stage.colorToken} />
        <span className="truncate text-[12px] font-medium">{stage.name}</span>
        <span className="rounded-sm bg-background px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
          {leads.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label={`${stage.name} options`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(stage)}>
              <Pencil />
              Edit stage
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMove(stage, -1)}>Move left</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMove(stage, 1)}>Move right</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(stage)}>
              <Trash2 />
              Delete stage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between border-x border-border bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>{stage.probability}% probability</span>
        <span className="tabular-nums">${formatCompact(value)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[220px] flex-1 flex-col gap-2 rounded-b-lg border border-t-0 border-border p-2 transition-colors",
          isOver ? "bg-primary/[0.06]" : "bg-background",
        )}
      >
        {leads.map((lead) => (
          <PipelineCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-3 text-center text-[12px] text-muted-foreground">
            Drop a lead here
          </p>
        ) : null}
      </div>
    </div>
  );
}
