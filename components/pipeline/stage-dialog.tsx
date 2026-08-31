"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, slugify } from "@/lib/utils";
import type { PipelineStage } from "@/types";

const COLOR_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

interface StageDialogProps {
  open: boolean;
  stage: PipelineStage | null;
  position: number;
  pipelineId: string;
  workspaceId: string;
  onOpenChange: (open: boolean) => void;
  onSave: (stage: PipelineStage) => void;
}

export function StageDialog({
  open,
  stage,
  position,
  pipelineId,
  workspaceId,
  onOpenChange,
  onSave,
}: StageDialogProps) {
  // Initialised from props; the parent remounts this dialog with a key so a
  // different stage always starts from fresh state.
  const [name, setName] = React.useState(stage?.name ?? "");
  const [probability, setProbability] = React.useState(String(stage?.probability ?? 50));
  const [colorToken, setColorToken] = React.useState(stage?.colorToken ?? COLOR_TOKENS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      id: stage?.id ?? `stg_${slugify(name)}_${position}`,
      workspaceId: stage?.workspaceId ?? workspaceId,
      pipelineId,
      name: name.trim(),
      colorToken,
      position: stage?.position ?? position,
      probability: Math.max(0, Math.min(100, Number(probability) || 0)),
      isWon: stage?.isWon ?? false,
      isLost: stage?.isLost ?? false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{stage ? "Edit stage" : "New stage"}</DialogTitle>
          <DialogDescription>
            Stages are workspace-specific. Probability feeds pipeline value forecasting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="stage-name">Name</Label>
            <Input
              id="stage-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Proposal Sent"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stage-probability">Probability (%)</Label>
            <Input
              id="stage-probability"
              type="number"
              min={0}
              max={100}
              value={probability}
              onChange={(event) => setProbability(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex gap-1.5">
              {COLOR_TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setColorToken(token)}
                  aria-label={`Use ${token}`}
                  className={cn(
                    "size-6 rounded-md border transition-transform",
                    colorToken === token ? "border-foreground scale-110" : "border-border",
                  )}
                  style={{ backgroundColor: `var(--${token})` }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!name.trim()}>
            {stage ? "Save changes" : "Create stage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
