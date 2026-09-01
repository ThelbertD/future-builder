"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

import {
  deleteStageAction,
  moveLeadAction,
  reorderStagesAction,
  saveStageAction,
} from "@/app/(dashboard)/pipeline/actions";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { PipelineCardContent } from "@/components/pipeline/pipeline-card";
import { PipelineColumn } from "@/components/pipeline/pipeline-column";
import { StageDialog } from "@/components/pipeline/stage-dialog";
import { nowIso } from "@/lib/utils";
import type { LeadWithRelations, PipelineStage } from "@/types";

interface PipelineBoardProps {
  stages: PipelineStage[];
  leads: LeadWithRelations[];
  workspaceId: string;
  pipelineId: string;
}

export function PipelineBoard({
  stages: initialStages,
  leads: initialLeads,
  workspaceId,
  pipelineId,
}: PipelineBoardProps) {
  const router = useRouter();
  const [stages, setStages] = React.useState(initialStages);
  const [leads, setLeads] = React.useState(initialLeads);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<PipelineStage | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<PipelineStage | null>(null);
  const [addingTo, setAddingTo] = React.useState<PipelineStage | null>(null);

  // The server is the source of truth. When a refresh brings different records,
  // adopt them during render rather than in an effect, which would cost an
  // extra pass. This is React's documented "adjusting state on prop change".
  const signature = `${initialStages.map((stage) => `${stage.id}:${stage.position}:${stage.name}`).join("|")}#${initialLeads
    .map((lead) => `${lead.id}:${lead.stageId}`)
    .join("|")}`;
  const [lastSignature, setLastSignature] = React.useState(signature);

  if (signature !== lastSignature) {
    setLastSignature(signature);
    setStages(initialStages);
    setLeads(initialLeads);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeLead = leads.find((lead) => lead.id === activeId);

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  /** Optimistic move: the card lands immediately, then the write is confirmed. */
  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const stageId = String(over.id);
    const stage = stages.find((item) => item.id === stageId);
    const lead = leads.find((item) => item.id === active.id);
    if (!stage || !lead || lead.stageId === stageId) return;

    const previousStageId = lead.stageId;
    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id ? { ...item, stageId, stageEnteredAt: nowIso() } : item,
      ),
    );

    const result = await moveLeadAction({ leadId: lead.id, stageId, stageName: stage.name });

    if (!result.ok) {
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? { ...item, stageId: previousStageId } : item)),
      );
      toast.error("Could not move that lead", { description: result.error });
      return;
    }

    toast.success(`${lead.company.name} moved`, { description: `Now in ${stage.name}.` });
  };

  const saveStage = async (stage: PipelineStage) => {
    const isNew = !stages.some((item) => item.id === stage.id);

    setStages((current) =>
      isNew ? [...current, stage] : current.map((item) => (item.id === stage.id ? stage : item)),
    );
    setEditing(null);
    setCreating(false);

    const result = await saveStageAction({
      id: isNew ? undefined : stage.id,
      pipelineId,
      name: stage.name,
      probability: stage.probability,
      colorToken: stage.colorToken,
      position: stage.position,
    });

    if (!result.ok) {
      toast.error("Could not save the stage", { description: result.error });
      router.refresh();
      return;
    }

    toast.success("Stage saved");
    router.refresh();
  };

  const deleteStage = async (stage: PipelineStage) => {
    const fallback = stages.find((item) => item.id !== stage.id);
    if (!fallback) return;

    setLeads((current) =>
      current.map((lead) => (lead.stageId === stage.id ? { ...lead, stageId: fallback.id } : lead)),
    );
    setStages((current) => current.filter((item) => item.id !== stage.id));

    const result = await deleteStageAction({ stageId: stage.id, fallbackStageId: fallback.id });

    if (!result.ok) {
      toast.error("Could not delete the stage", { description: result.error });
      router.refresh();
      return;
    }

    toast.success("Stage deleted", { description: `Leads moved to ${fallback.name}.` });
    router.refresh();
  };

  const moveStage = async (stage: PipelineStage, direction: -1 | 1) => {
    const index = stages.findIndex((item) => item.id === stage.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= stages.length) return;

    const next = [...stages];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    const reordered = next.map((item, position) => ({ ...item, position }));

    setStages(reordered);

    const result = await reorderStagesAction({ stageIds: reordered.map((item) => item.id) });
    if (!result.ok) {
      toast.error("Could not save the new order", { description: result.error });
      router.refresh();
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full gap-3 overflow-x-auto scrollbar-thin px-4 pb-4 lg:px-6">
          {stages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              leads={leads.filter((lead) => lead.stageId === stage.id)}
              onEdit={setEditing}
              onDelete={setDeleting}
              onMove={moveStage}
              onAddLead={setAddingTo}
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
        pipelineId={pipelineId}
        workspaceId={workspaceId}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSave={saveStage}
      />

      <CreateLeadDialog
        open={addingTo !== null}
        fixedStage={addingTo}
        stages={stages}
        onOpenChange={(open) => !open && setAddingTo(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "stage"}?`}
        description="Leads in this stage move to the first remaining stage. This cannot be undone."
        confirmLabel="Delete stage"
        destructive
        onConfirm={() => deleting && void deleteStage(deleting)}
      />
    </>
  );
}
