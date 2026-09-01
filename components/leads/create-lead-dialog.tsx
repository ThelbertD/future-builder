"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createLeadInStageAction } from "@/app/(dashboard)/pipeline/actions";
import { StageDot } from "@/components/common/indicators";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PipelineStage } from "@/types";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Every stage the lead could go into. */
  stages: PipelineStage[];
  /**
   * Set when the dialog was opened from a specific column, which fixes the
   * destination and hides the picker.
   */
  fixedStage?: PipelineStage | null;
}

const EMPTY = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  opportunity: "",
  estimatedValue: "",
  score: "",
  notes: "",
};

/**
 * One form for both entry points: the Leads page, where a stage is chosen, and
 * a pipeline column, where the stage is already known.
 */
export function CreateLeadDialog({ open, onOpenChange, stages, fixedStage }: CreateLeadDialogProps) {
  const router = useRouter();
  const [form, setForm] = React.useState(EMPTY);
  const [stageId, setStageId] = React.useState(fixedStage?.id ?? stages[0]?.id ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reopening from a different column should target that column.
  const [lastFixed, setLastFixed] = React.useState<string | null>(fixedStage?.id ?? null);
  if (fixedStage && fixedStage.id !== lastFixed) {
    setLastFixed(fixedStage.id);
    setStageId(fixedStage.id);
  }

  const stage = fixedStage ?? stages.find((item) => item.id === stageId);
  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!stage || !form.companyName.trim()) return;

    setSaving(true);
    setError(null);

    const result = await createLeadInStageAction({
      stageId: stage.id,
      stageName: stage.name,
      companyName: form.companyName,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      opportunity: form.opportunity || undefined,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      score: form.score ? Number(form.score) : undefined,
      notes: form.notes || undefined,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not save that lead.");
      return;
    }

    toast.success("Lead created", { description: `${form.companyName} is now in ${stage.name}.` });
    setForm(EMPTY);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fixedStage ? `Add a contact to ${fixedStage.name}` : "New lead"}</DialogTitle>
          <DialogDescription>
            Creates the company if it does not exist yet, attaches the contact, and places the opportunity in
            the pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={fixedStage ? "sm:col-span-2" : "space-y-1.5"}>
              {fixedStage ? null : (
                <>
                  <Label>Stage</Label>
                  <Select value={stageId} onValueChange={setStageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <span className="flex items-center gap-2">
                            <StageDot colorToken={item.colorToken} />
                            {item.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className={fixedStage ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
              <Label htmlFor="lead-company">Company *</Label>
              <Input
                id="lead-company"
                value={form.companyName}
                onChange={(event) => set("companyName", event.target.value)}
                placeholder="Northbeam Marketing"
                autoFocus
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-contact">Contact name</Label>
              <Input
                id="lead-contact"
                value={form.contactName}
                onChange={(event) => set("contactName", event.target.value)}
                placeholder="Adrienne Kohl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.contactEmail}
                onChange={(event) => set("contactEmail", event.target.value)}
                placeholder="name@company.com"
              />
              <p className="text-[11px] text-muted-foreground">Needed before outreach can be sent.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">Phone</Label>
              <Input
                id="lead-phone"
                value={form.contactPhone}
                onChange={(event) => set("contactPhone", event.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-opportunity">Opportunity</Label>
              <Input
                id="lead-opportunity"
                value={form.opportunity}
                onChange={(event) => set("opportunity", event.target.value)}
                placeholder="GoHighLevel automation"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-value">Estimated value</Label>
              <Input
                id="lead-value"
                type="number"
                min={0}
                value={form.estimatedValue}
                onChange={(event) => set("estimatedValue", event.target.value)}
                placeholder="5000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-score">Score (0-100)</Label>
              <Input
                id="lead-score"
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(event) => set("score", event.target.value)}
                placeholder="75"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
              placeholder="Where did this come from, and what do they need?"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-[12px] text-destructive"
            >
              {error}
            </p>
          ) : null}

          {stages.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[12px] text-muted-foreground">
              This workspace has no pipeline stages yet, so there is nowhere to put a lead.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            loading={saving}
            disabled={!form.companyName.trim() || !stage}
          >
            {fixedStage ? `Add to ${fixedStage.name}` : "Create lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
