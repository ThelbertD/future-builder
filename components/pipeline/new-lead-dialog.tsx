"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createLeadInStageAction } from "@/app/(dashboard)/pipeline/actions";
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
import { Textarea } from "@/components/ui/textarea";
import type { PipelineStage } from "@/types";

interface NewLeadDialogProps {
  /** The stage the contact is being added to. Null closes the dialog. */
  stage: PipelineStage | null;
  onOpenChange: (open: boolean) => void;
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

export function NewLeadDialog({ stage, onOpenChange }: NewLeadDialogProps) {
  const router = useRouter();
  const [form, setForm] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      setError(result.error ?? "Could not save that contact.");
      return;
    }

    toast.success("Contact added", { description: `${form.companyName} is now in ${stage.name}.` });
    setForm(EMPTY);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={stage !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a contact to {stage?.name}</DialogTitle>
          <DialogDescription>
            Creates the company if it does not exist yet, attaches the contact, and drops the opportunity
            straight into this stage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="lead-company">Company *</Label>
            <Input
              id="lead-company"
              value={form.companyName}
              onChange={(event) => set("companyName", event.target.value)}
              placeholder="Northbeam Marketing"
              autoFocus
            />
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
            <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-[12px] text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={saving} disabled={!form.companyName.trim()}>
            Add to {stage?.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
