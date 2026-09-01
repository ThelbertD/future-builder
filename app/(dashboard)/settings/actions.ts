"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { sanitizeUrl } from "@/lib/utils";

export interface SettingsResult {
  ok: boolean;
  error?: string;
}

const DEMO_ERROR: SettingsResult = { ok: false, error: "Connect Supabase to save settings." };

/** A migration that has not run yet should say so, not fail anonymously. */
function describe(error: { message: string }, column: string, migration: string): string {
  if (error.message.includes(column)) return `Run migration ${migration} to store this setting.`;
  return "Could not save. Try again.";
}

/* ----------------------------------------------------------------- profile */

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Your name is required.").max(120),
  jobTitle: z.string().trim().max(120).optional(),
  timezone: z.string().trim().max(60),
});

export async function updateProfileAction(input: z.input<typeof profileSchema>): Promise<SettingsResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  if (useMockData) return DEMO_ERROR;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      job_title: parsed.data.jobTitle || null,
      timezone: parsed.data.timezone,
    })
    .eq("id", auth.user.id);

  if (error) return { ok: false, error: "Could not save your profile." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/* --------------------------------------------------------------- workspace */

const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required.").max(80),
  bookingUrl: z.union([z.url("Enter a full URL, including https://"), z.literal("")]).optional(),
});

export async function updateWorkspaceAction(
  input: z.input<typeof workspaceSchema>,
): Promise<SettingsResult> {
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  if (useMockData) return DEMO_ERROR;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { error } = await supabase
    .from("workspaces")
    .update({ name: parsed.data.name, booking_url: sanitizeUrl(parsed.data.bookingUrl) ?? null })
    .eq("id", workspaceId);

  if (error) return { ok: false, error: describe(error, "booking_url", "0005") };

  revalidatePath("/", "layout");
  return { ok: true };
}

/* ----------------------------------------------------------- notifications */

const notificationsSchema = z.object({
  prefs: z.record(z.string().max(60), z.boolean()),
});

export async function updateNotificationsAction(
  input: z.input<typeof notificationsSchema>,
): Promise<SettingsResult> {
  const parsed = notificationsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid notification settings." };
  if (useMockData) return DEMO_ERROR;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: parsed.data.prefs })
    .eq("id", auth.user.id);

  if (error) return { ok: false, error: describe(error, "notification_prefs", "0006") };

  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------------------------------------------------------------- AI */

const aiSchema = z.object({
  provider: z.string().trim().max(40).optional(),
  model: z.string().trim().max(80).optional(),
  temperature: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().trim().max(8000).optional(),
  services: z.array(z.string().trim().max(60)).max(20).optional(),
  tone: z.string().trim().max(40).optional(),
  minQualifyScore: z.number().int().min(0).max(100).optional(),
  autoBook: z.boolean().optional(),
  handoffOnPricing: z.boolean().optional(),
  handoffAfterReplies: z.number().int().min(1).max(20).optional(),
  autoQualify: z.boolean().optional(),
  autoDraft: z.boolean().optional(),
  autoSend: z.boolean().optional(),
  businessName: z.string().trim().max(120).optional(),
  targetCustomers: z.string().trim().max(200).optional(),
});

export async function updateAISettingsAction(input: z.input<typeof aiSchema>): Promise<SettingsResult> {
  const parsed = aiSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the settings." };
  if (useMockData) return DEMO_ERROR;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  // Merged rather than replaced, so the AI page and the settings panel can each
  // save their own slice without clobbering the other.
  const { data: existing } = await supabase
    .from("workspaces")
    .select("ai_settings")
    .eq("id", workspaceId)
    .maybeSingle<{ ai_settings: Record<string, unknown> | null }>();

  const { error } = await supabase
    .from("workspaces")
    .update({ ai_settings: { ...(existing?.ai_settings ?? {}), ...parsed.data } })
    .eq("id", workspaceId);

  if (error) return { ok: false, error: describe(error, "ai_settings", "0006") };

  revalidatePath("/", "layout");
  return { ok: true };
}

/* -------------------------------------------------------------------- team */

const roleSchema = z.object({
  memberId: z.string().min(1).max(64),
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export async function updateMemberRoleAction(input: z.input<typeof roleSchema>): Promise<SettingsResult> {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid role." };
  if (useMockData) return DEMO_ERROR;

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { error } = await supabase
    .from("workspace_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId)
    .eq("workspace_id", workspaceId);

  // Row level security limits this to owners and admins.
  if (error) return { ok: false, error: "Could not change that role. Only owners and admins can." };

  revalidatePath("/settings");
  return { ok: true };
}

/* ---------------------------------------------------------------- security */

const passwordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

export async function updatePasswordAction(input: z.input<typeof passwordSchema>): Promise<SettingsResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the password." };
  if (useMockData) return DEMO_ERROR;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return {
      ok: false,
      error: /same/i.test(error.message)
        ? "That is already your password."
        : "Could not change your password.",
    };
  }

  return { ok: true };
}
