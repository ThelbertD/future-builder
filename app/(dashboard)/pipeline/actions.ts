"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DEFAULT_PIPELINE_STAGES } from "@/lib/constants";
import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/** Demo mode keeps everything in component state; nothing is persisted. */
const DEMO: ActionResult = { ok: true };

/** Stage names map onto the lead status enum where they line up. */
const STATUS_BY_STAGE_NAME: Record<string, LeadStatus> = {
  new: "new",
  "ai qualified": "qualified",
  qualified: "qualified",
  "ready to contact": "ready",
  contacted: "contacted",
  replied: "replied",
  interested: "interested",
  "appointment booked": "booked",
  booked: "booked",
  "call completed": "call_completed",
  "proposal sent": "proposal",
  proposal: "proposal",
  negotiation: "negotiation",
  won: "won",
  lost: "lost",
};

function statusForStage(name: string): LeadStatus {
  return STATUS_BY_STAGE_NAME[name.trim().toLowerCase()] ?? "new";
}

function fail(message: string): ActionResult {
  return { ok: false, error: message };
}

/* ---------------------------------------------------------------- pipelines */

const pipelineSchema = z.object({
  name: z.string().trim().min(1, "Give the pipeline a name.").max(80),
});

export async function createPipelineAction(input: { name: string }): Promise<ActionResult> {
  const parsed = pipelineSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid pipeline.");
  if (useMockData) return DEMO;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return fail("No workspace found for your account.");

  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .insert({ workspace_id: workspaceId, name: parsed.data.name, is_default: false })
    .select("id")
    .single<{ id: string }>();

  if (error || !pipeline) return fail("Could not create the pipeline.");

  const { error: stageError } = await supabase.from("pipeline_stages").insert(
    DEFAULT_PIPELINE_STAGES.map((stage, position) => ({
      workspace_id: workspaceId,
      pipeline_id: pipeline.id,
      name: stage.name,
      color_token: stage.colorToken,
      position,
      probability: stage.probability,
      is_won: stage.isWon ?? false,
      is_lost: stage.isLost ?? false,
    })),
  );

  if (stageError) return fail("The pipeline was created but its stages were not.");

  revalidatePath("/pipeline");
  return { ok: true, id: pipeline.id };
}

/* ------------------------------------------------------------------ stages */

const stageSchema = z.object({
  id: z.string().optional(),
  pipelineId: z.string().min(1),
  name: z.string().trim().min(1, "Give the stage a name.").max(60),
  probability: z.number().int().min(0).max(100),
  colorToken: z.string().min(1).max(40),
  position: z.number().int().min(0),
});

export async function saveStageAction(input: z.input<typeof stageSchema>): Promise<ActionResult> {
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid stage.");
  if (useMockData) return DEMO;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return fail("No workspace found for your account.");

  const { id, pipelineId, name, probability, colorToken, position } = parsed.data;

  if (id) {
    const { error } = await supabase
      .from("pipeline_stages")
      .update({ name, probability, color_token: colorToken })
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) return fail("Could not update the stage.");
    revalidatePath("/pipeline");
    return { ok: true, id };
  }

  const { data, error } = await supabase
    .from("pipeline_stages")
    .insert({
      workspace_id: workspaceId,
      pipeline_id: pipelineId,
      name,
      probability,
      color_token: colorToken,
      position,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) return fail("Could not create the stage.");

  revalidatePath("/pipeline");
  return { ok: true, id: data.id };
}

export async function deleteStageAction(input: {
  stageId: string;
  fallbackStageId: string;
}): Promise<ActionResult> {
  if (useMockData) return DEMO;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return fail("No workspace found for your account.");

  // Move the stage's leads before removing it so nothing is orphaned.
  const { error: moveError } = await supabase
    .from("leads")
    .update({ stage_id: input.fallbackStageId })
    .eq("stage_id", input.stageId)
    .eq("workspace_id", workspaceId);

  if (moveError) return fail("Could not move the leads out of that stage.");

  const { error } = await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", input.stageId)
    .eq("workspace_id", workspaceId);

  if (error) return fail("Could not delete the stage.");

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function reorderStagesAction(input: { stageIds: string[] }): Promise<ActionResult> {
  if (useMockData) return DEMO;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return fail("No workspace found for your account.");

  for (const [position, stageId] of input.stageIds.entries()) {
    const { error } = await supabase
      .from("pipeline_stages")
      .update({ position })
      .eq("id", stageId)
      .eq("workspace_id", workspaceId);

    if (error) return fail("Could not save the new stage order.");
  }

  revalidatePath("/pipeline");
  return { ok: true };
}

/* ------------------------------------------------------------------- leads */

export async function moveLeadAction(input: {
  leadId: string;
  stageId: string;
  stageName: string;
}): Promise<ActionResult> {
  if (useMockData) return DEMO;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return fail("No workspace found for your account.");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leads")
    .update({
      stage_id: input.stageId,
      status: statusForStage(input.stageName),
      stage_entered_at: now,
      last_activity_at: now,
    })
    .eq("id", input.leadId)
    .eq("workspace_id", workspaceId);

  if (error) return fail("Could not move the lead.");

  revalidatePath("/pipeline");
  return { ok: true };
}

const leadSchema = z.object({
  stageId: z.string().min(1),
  stageName: z.string().min(1),
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.union([z.email("Enter a valid email address."), z.literal("")]).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  opportunity: z.string().trim().max(160).optional(),
  estimatedValue: z.number().min(0).max(10_000_000).optional(),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateLeadInput = z.input<typeof leadSchema>;

/**
 * Adds a contact to a stage.
 *
 * Reuses an existing company when the name matches, otherwise creates one, then
 * attaches an optional contact and the lead itself.
 */
export async function createLeadInStageAction(input: CreateLeadInput): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  if (useMockData) return DEMO;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return fail("No workspace found for your account.");

  const {
    stageId,
    stageName,
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    opportunity,
    estimatedValue,
    score,
    notes,
  } = parsed.data;

  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("workspace_id", workspaceId)
    .ilike("name", companyName)
    .limit(1)
    .maybeSingle<{ id: string }>();

  let companyId = existing?.id;

  if (!companyId) {
    const { data: created, error } = await supabase
      .from("companies")
      .insert({ workspace_id: workspaceId, name: companyName, status: "prospect", lead_score: score ?? 0 })
      .select("id")
      .single<{ id: string }>();

    if (error || !created) return fail("Could not create the company.");
    companyId = created.id;
  }

  let contactId: string | null = null;

  if (contactName) {
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        company_id: companyId,
        full_name: contactName,
        email: contactEmail || null,
        phone: contactPhone || null,
        is_primary: true,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) return fail("Could not create the contact.");
    contactId = contact?.id ?? null;
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      workspace_id: workspaceId,
      company_id: companyId,
      contact_id: contactId,
      stage_id: stageId,
      status: statusForStage(stageName),
      score: score ?? 0,
      intent: "low",
      estimated_value: estimatedValue ?? 0,
      notes: notes ?? "",
      source: "Referral",
      tags: opportunity ? [opportunity.slice(0, 40)] : [],
    })
    .select("id")
    .single<{ id: string }>();

  if (leadError || !lead) return fail("Could not add the lead to that stage.");

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  return { ok: true, id: lead.id };
}
