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

const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required.").max(80),
  bookingUrl: z.union([z.url("Enter a full URL, including https://"), z.literal("")]).optional(),
});

export async function updateWorkspaceAction(
  input: z.input<typeof workspaceSchema>,
): Promise<SettingsResult> {
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };

  if (useMockData) return { ok: false, error: "Connect Supabase to save workspace settings." };

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { error } = await supabase
    .from("workspaces")
    .update({
      name: parsed.data.name,
      booking_url: sanitizeUrl(parsed.data.bookingUrl) ?? null,
    })
    .eq("id", workspaceId);

  if (error) {
    // Migration 0005 adds booking_url; save the name regardless until it runs.
    if (/booking_url/.test(error.message)) {
      const { error: fallback } = await supabase
        .from("workspaces")
        .update({ name: parsed.data.name })
        .eq("id", workspaceId);

      if (!fallback) {
        return { ok: false, error: "Saved the name. Run migration 0005 to store the booking link." };
      }
    }
    return { ok: false, error: "Could not save the workspace." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
