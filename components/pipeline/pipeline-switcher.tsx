"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KanbanSquare, Plus } from "lucide-react";
import { toast } from "sonner";

import { createPipelineAction } from "@/app/(dashboard)/pipeline/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { PipelineSummary } from "@/types";

interface PipelineSwitcherProps {
  pipelines: PipelineSummary[];
  activePipelineId: string;
}

export function PipelineSwitcher({ pipelines, activePipelineId }: PipelineSwitcherProps) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const active = pipelines.find((pipeline) => pipeline.id === activePipelineId) ?? pipelines[0];

  const select = (id: string) => {
    router.push(`/pipeline?p=${id}`);
    router.refresh();
  };

  const submit = async () => {
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    const result = await createPipelineAction({ name });
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not create the pipeline.");
      return;
    }

    toast.success("Pipeline created", { description: `${name} starts with the default twelve stages.` });
    setCreating(false);
    setName("");

    if (result.id) select(result.id);
    else router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <KanbanSquare />
            {active?.name ?? "Pipeline"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Pipelines</DropdownMenuLabel>
          {pipelines.map((pipeline) => (
            <DropdownMenuItem
              key={pipeline.id}
              onSelect={() => select(pipeline.id)}
              className="justify-between"
            >
              <span className="truncate">{pipeline.name}</span>
              {pipeline.isDefault ? <Badge variant="outline">Default</Badge> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <Plus />
            New pipeline
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New pipeline</DialogTitle>
            <DialogDescription>
              A separate board with its own stages. Useful for a second service line, a partner channel, or a
              different sales motion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="pipeline-name">Name</Label>
            <Input
              id="pipeline-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
              placeholder="e.g. Partner Referrals"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Starts with the same twelve stages. Rename, recolour or delete them afterwards.
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-[12px] text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} loading={saving} disabled={!name.trim()}>
              Create pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
