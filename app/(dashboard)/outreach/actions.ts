"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface CampaignActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/** The sequence every new campaign starts from. */
const DEFAULT_STEPS = [
  {
    dayOffset: 0,
    name: "Initial email",
    subject: "Saw your {role} posting",
    preview: "Opens on the specific problem named in their posting, then offers a fixed-scope alternative to hiring.",
  },
  {
    dayOffset: 2,
    name: "Follow-up",
    subject: "Quick follow-up",
    preview: "Short nudge with a comparable rollout from the same industry.",
  },
  {
    dayOffset: 5,
    name: "Value follow-up",
    subject: "The two-week build outline",
    preview: "Sends the build outline and the expected first-response improvement. No ask beyond a reply.",
  },
  {
    dayOffset: 9,
    name: "Final follow-up",
    subject: "Closing the loop",
    preview: "Polite close-out that leaves the door open and asks whether the search is still active.",
  },
];

const campaignSchema = z.object({
  name: z.string().trim().min(1, "Give the campaign a name.").max(80),
  minScore: z.number().int().min(0).max(100),
  services: z.array(z.string().trim().min(1).max(60)).min(1, "Pick at least one service.").max(6),
});

export async function createCampaignAction(
  input: z.input<typeof campaignSchema>,
): Promise<CampaignActionResult> {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign." };

  if (useMockData) {
    return { ok: false, error: "Connect Supabase to create campaigns." };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { name, minScore, services } = parsed.data;

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: workspaceId,
      name,
      status: "draft",
      audience_summary: `Leads matching ${services.join(", ")} · AI score above ${minScore}`,
      min_score: minScore,
      services,
      stats: { enrolled: 0, sent: 0, delivered: 0, opened: 0, replied: 0, interested: 0, booked: 0 },
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !campaign) return { ok: false, error: "Could not create the campaign." };

  const { error: stepError } = await supabase.from("campaign_steps").insert(
    DEFAULT_STEPS.map((step) => ({
      workspace_id: workspaceId,
      campaign_id: campaign.id,
      day_offset: step.dayOffset,
      channel: "email",
      name: step.name,
      subject: step.subject,
      preview: step.preview,
      sent: 0,
      opened: 0,
      replied: 0,
    })),
  );

  if (stepError) return { ok: false, error: "The campaign was created but its sequence was not." };

  revalidatePath("/outreach");
  return { ok: true, id: campaign.id };
}

export async function setCampaignStatusAction(input: {
  campaignId: string;
  status: "draft" | "active" | "paused" | "completed";
}): Promise<CampaignActionResult> {
  if (useMockData) return { ok: true };

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { error } = await supabase
    .from("campaigns")
    .update({ status: input.status })
    .eq("id", input.campaignId)
    .eq("workspace_id", workspaceId);

  if (error) return { ok: false, error: "Could not update the campaign." };

  revalidatePath("/outreach");
  return { ok: true, id: input.campaignId };
}
