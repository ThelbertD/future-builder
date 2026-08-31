"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PipelineCardContent } from "@/components/pipeline/pipeline-card";
import { PipelineColumn } from "@/components/pipeline/pipeline-column";
import { StageDialog } from "@/components/pipeline/stage-dialog";
import { PIPELINE_ID } from "@/lib/mock";
import type { LeadWithRelations, PipelineStage } from "@/types";

interface PipelineBoardProps {
  stages: PipelineStage[];
  leads: LeadWithRelations[];
}

export function PipelineBoard({ stages: initialStages, leads: initialLeads }: PipelineBoardProps) {
  const [stages, setStages] = React.useState(initialStages);
  const [leads, setLeads] = React.useState(initialLeads);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<PipelineStage | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<PipelineStage | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeLead = leads.find((lead) => lead.id === activeId);

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  /** Optimistic move — the card lands before any persistence round-trip. */
  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const stageId = String(over.id);
    const stage = stages.find((item) => item.id === stageId);
    const lead = leads.find((item) => item.id === active.id);
    if (!stage || !lead || lead.stageId === stageId) return;

    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id ? { ...item, stageId, stageEnteredAt: new Date().toISOString() } : item,
      ),
    );
    toast.success(`${lead.company.name} moved`, { description: `Now in ${stage.name}.` });
  };

  const saveStage = (stage: PipelineStage) => {
    setStages((current) => {
      const exists = current.some((item) => item.id === stage.id);
      return exists ? current.map((item) => (item.id === stage.id ? stage : item)) : [...current, stage];
    });
    setEditing(null);
    setCreating(false);
    toast.success("Stage saved");
  };

  const deleteStage = (stage: PipelineStage) => {
    const fallback = stages.find((item) => item.id !== stage.id);
    if (!fallback) return;
    setLeads((current) =>
      current.map((lead) => (lead.stageId === stage.id ? { ...lead, stageId: fallback.id } : lead)),
    );
    setStages((current) => current.filter((item) => item.id !== stage.id));
    toast.success("Stage deleted", { description: `Leads moved to ${fallback.name}.` });
  };

  const moveStage = (stage: PipelineStage, direction: -1 | 1) => {
    setStages((current) => {
      const index = current.findIndex((item) => item.id === stage.id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return next.map((item, position) => ({ ...item, position }));
    });
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex h-full gap-3 overflow-x-auto scrollbar-thin px-4 pb-4 lg:px-6">
          {stages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              leads={leads.filter((lead) => lead.stageId === stage.id)}
              onEdit={setEditing}
              onDelete={setDeleting}
              onMove={moveStage}
            />
          ))}

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-10 w-[200px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add stage
          </button>
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {activeLead ? (
            <div className="w-[256px] rotate-1">
              <PipelineCardContent lead={activeLead} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <StageDialog
        key={editing?.id ?? `new-stage-${stages.length}`}
        open={creating || editing !== null}
        stage={editing}
        position={stages.length}
        pipelineId={PIPELINE_ID}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSave={saveStage}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "stage"}?`}
        description="Leads in this stage move to the first remaining stage. This cannot be undone."
        confirmLabel="Delete stage"
        destructive
        onConfirm={() => deleting && deleteStage(deleting)}
      />

    </>
  );
}
