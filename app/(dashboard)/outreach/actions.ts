"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { emailProviderStatus, sendEmail } from "@/lib/email/provider";
import { composeOutreach } from "@/lib/outreach/compose";
import { getActiveWorkspace, getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { fetchLead } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

// Sending is paced, so a batch needs longer than the default request budget.
export const maxDuration = 60;

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

/**
 * Deletes a campaign and its sequence.
 *
 * The steps go with it through their cascade. Enrolments do too, so a campaign
 * that has already sent is deleted with its history — which is why the caller
 * confirms, and why the count of what was sent is worth showing first.
 */
export async function deleteCampaignAction(input: { campaignId: string }): Promise<CampaignActionResult> {
  if (useMockData) return { ok: false, error: "Connect Supabase to delete campaigns." };

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { data, error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", input.campaignId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .returns<Array<{ id: string }>>();

  if (error) return { ok: false, error: "That campaign could not be deleted." };

  // Deleting is admin-only under RLS, and removes no rows for anyone else.
  if ((data?.length ?? 0) === 0) {
    return {
      ok: false,
      error: "Nothing was deleted. Deleting a campaign needs an owner or admin role on this workspace.",
    };
  }

  revalidatePath("/outreach");
  return { ok: true, id: input.campaignId };
}

export interface EnrollResult {
  ok: boolean;
  error?: string;
  /** Leads newly added to the campaign. */
  enrolled: number;
  /** Already on the campaign, so left alone. */
  alreadyOn: number;
  /** Matched the audience but have no address to write to. */
  withoutEmail: number;
  /** Day 0 messages written and waiting in Conversations. */
  drafted: number;
}

/**
 * Enrols every lead matching a campaign's audience, and writes each one's first
 * message.
 *
 * Enrolling and drafting are one action deliberately. A campaign whose enrolled
 * count went up but produced nothing to look at would be the same hollow
 * gesture the number itself used to be; this way enrolling puts real, specific
 * messages in the inbox.
 *
 * Nothing is sent. Each Day 0 message is stored as a draft for review, which is
 * the promise the rest of the product makes and the only responsible default
 * when the recipients are real businesses.
 *
 * Running it again is safe: the unique constraint on (campaign, lead) means a
 * second run picks up what is new and leaves everyone else untouched.
 */
export async function enrollLeadsAction(input: { campaignId: string }): Promise<EnrollResult> {
  const base = { enrolled: 0, alreadyOn: 0, withoutEmail: 0, drafted: 0 };

  if (useMockData) return { ok: false, error: "Connect Supabase to enrol leads.", ...base };

  const [supabase, workspaceId, workspace] = await Promise.all([
    createClient(),
    getActiveWorkspaceId(),
    getActiveWorkspace(),
  ]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account.", ...base };

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, min_score")
    .eq("id", input.campaignId)
    .eq("workspace_id", workspaceId)
    .maybeSingle<{ id: string; name: string; min_score: number }>();

  if (!campaign) return { ok: false, error: "That campaign no longer exists.", ...base };

  // The audience is the campaign's own rule, so what gets enrolled always
  // matches what the Audience panel says.
  const { data: matching } = await supabase
    .from("leads")
    .select("id, contact_id")
    .eq("workspace_id", workspaceId)
    .gte("score", campaign.min_score)
    .returns<Array<{ id: string; contact_id: string | null }>>();

  if (!matching || matching.length === 0) {
    return {
      ok: false,
      error: `No lead scores ${campaign.min_score} or above yet. Lower the campaign's minimum score, or find more leads.`,
      ...base,
    };
  }

  const { data: existing } = await supabase
    .from("campaign_enrollments")
    .select("lead_id")
    .eq("workspace_id", workspaceId)
    .eq("campaign_id", campaign.id)
    .returns<Array<{ lead_id: string }>>();

  const already = new Set((existing ?? []).map((row) => row.lead_id));
  const fresh = matching.filter((lead) => !already.has(lead.id));
  const withoutEmail = fresh.filter((lead) => !lead.contact_id).length;

  if (fresh.length === 0) {
    return {
      ok: false,
      error: `Every matching lead is already on ${campaign.name}.`,
      ...base,
      alreadyOn: already.size,
    };
  }

  const { data: inserted, error } = await supabase
    .from("campaign_enrollments")
    .insert(
      fresh.map((lead) => ({
        workspace_id: workspaceId,
        campaign_id: campaign.id,
        lead_id: lead.id,
        status: "active",
        current_step: 0,
      })),
    )
    .select("lead_id")
    .returns<Array<{ lead_id: string }>>();

  if (error) {
    // Until migration 0007 has run there is no table to enrol into, and the
    // generic failure would send someone hunting through the wrong code.
    const missingTable = /campaign_enrollments/.test(error.message) && /does not exist/i.test(error.message);
    return {
      ok: false,
      error: missingTable
        ? "Run database/migrations/0007_enrollments.sql in Supabase first — the enrolments table does not exist yet."
        : "Those leads could not be enrolled.",
      ...base,
    };
  }

  // Draft the first message for each one. Sequential so writes stay ordered,
  // and capped because this runs inside a single request.
  let drafted = 0;

  for (const row of (inserted ?? []).slice(0, 50)) {
    const lead = await fetchLead(row.lead_id);
    if (!lead?.contact?.email) continue;

    const draft = composeOutreach(lead, { bookingUrl: workspace?.bookingUrl });

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("lead_id", lead.id)
      .limit(1)
      .maybeSingle<{ id: string }>();

    let conversationId = conversation?.id;

    if (!conversationId) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({
          workspace_id: workspaceId,
          lead_id: lead.id,
          company_id: lead.companyId,
          contact_id: lead.contactId ?? null,
          channel: "email",
          subject: draft.subject,
          mode: "ai",
          needs_attention: true,
        })
        .select("id")
        .single<{ id: string }>();

      conversationId = created?.id;
    }

    if (!conversationId) continue;

    // One draft per thread: replace rather than stack duplicates.
    await supabase
      .from("messages")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("conversation_id", conversationId)
      .eq("is_draft", true);

    const { error: messageError } = await supabase.from("messages").insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      author: "ai",
      author_name: "NexusOS",
      body: draft.body,
      channel: "email",
      sent_at: new Date().toISOString(),
      is_draft: true,
    });

    if (messageError) continue;

    await supabase
      .from("conversations")
      .update({
        subject: draft.subject,
        last_message_preview: draft.body.replace(/\n+/g, " ").slice(0, 96),
        last_message_at: new Date().toISOString(),
        needs_attention: true,
      })
      .eq("id", conversationId)
      .eq("workspace_id", workspaceId);

    drafted += 1;
  }

  revalidatePath("/outreach");
  revalidatePath("/conversations");
  revalidatePath("/dashboard");

  return {
    ok: true,
    enrolled: inserted?.length ?? 0,
    alreadyOn: already.size,
    withoutEmail,
    drafted,
  };
}

/**
 * Sending a campaign's pending first messages is capped per run.
 *
 * Two limits meet here. A serverless request has to finish, and each SMTP send
 * takes a second or two; and a personal Gmail that suddenly emits a hundred
 * near-identical mails is exactly the pattern that gets an account rate-limited
 * or suspended. Sending a batch, pacing it, and reporting what is left is
 * slower than a single button but keeps the sending account alive.
 */
const SEND_BATCH = 20;
const SEND_SPACING_MS = 1_200;

export interface SendDraftsResult {
  ok: boolean;
  error?: string;
  sent: number;
  failed: number;
  /** Still waiting, because the batch cap was reached. */
  remaining: number;
  /** The first failure, so a bad address or a dead provider is visible. */
  firstError?: string;
}

/**
 * Sends the drafts waiting on a campaign's enrolled leads.
 *
 * Nothing is composed here: it sends what enrolling already wrote, so anything
 * edited in Conversations goes out as edited. Each send marks its message sent
 * rather than draft, which is what makes a repeat run pick up where it stopped
 * instead of mailing anyone twice.
 */
export async function sendCampaignDraftsAction(input: { campaignId: string }): Promise<SendDraftsResult> {
  const base = { sent: 0, failed: 0, remaining: 0 };

  if (useMockData) return { ok: false, error: "Connect Supabase to send outreach.", ...base };

  const status = emailProviderStatus();
  if (!status.configured) {
    return { ok: false, error: `Email is not connected. Missing: ${status.missing.join(", ")}.`, ...base };
  }

  const [supabase, workspaceId, workspace] = await Promise.all([
    createClient(),
    getActiveWorkspaceId(),
    getActiveWorkspace(),
  ]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account.", ...base };

  const { data: enrolments } = await supabase
    .from("campaign_enrollments")
    .select("lead_id")
    .eq("workspace_id", workspaceId)
    .eq("campaign_id", input.campaignId)
    .eq("status", "active")
    .returns<Array<{ lead_id: string }>>();

  if (!enrolments || enrolments.length === 0) {
    return { ok: false, error: "Nobody is enrolled on this campaign yet.", ...base };
  }

  const leadIds = enrolments.map((row) => row.lead_id);

  // Only threads still holding an unsent draft are candidates.
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, subject, contact_id, company_id, lead_id, messages!inner(id, body, is_draft)")
    .eq("workspace_id", workspaceId)
    .in("lead_id", leadIds)
    .eq("messages.is_draft", true)
    .returns<
      Array<{
        id: string;
        subject: string | null;
        contact_id: string | null;
        company_id: string;
        lead_id: string;
        messages: Array<{ id: string; body: string; is_draft: boolean }>;
      }>
    >();

  const pending = conversations ?? [];
  if (pending.length === 0) {
    return { ok: false, error: "There are no unsent drafts on this campaign.", ...base };
  }

  const batch = pending.slice(0, SEND_BATCH);
  let sent = 0;
  let failed = 0;
  let firstError: string | undefined;

  for (const [index, conversation] of batch.entries()) {
    const draft = conversation.messages.find((message) => message.is_draft);
    if (!draft || !conversation.contact_id) {
      failed += 1;
      continue;
    }

    const { data: contact } = await supabase
      .from("contacts")
      .select("email, full_name")
      .eq("id", conversation.contact_id)
      .eq("workspace_id", workspaceId)
      .maybeSingle<{ email: string | null; full_name: string }>();

    if (!contact?.email) {
      failed += 1;
      firstError ??= `${contact?.full_name ?? "A contact"} has no email address.`;
      continue;
    }

    // Paced deliberately. Back to back, this looks like a burst to the provider.
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS));

    const result = await sendEmail({
      to: contact.email,
      subject: conversation.subject ?? "Following up",
      body: draft.body,
      signature: workspace?.emailSignature,
    });

    if (!result.ok) {
      failed += 1;
      firstError ??= result.error;
      // A rejected login or a hit quota fails every remaining send too, so
      // stopping here leaves the rest as drafts rather than burning them.
      if (/rejected|quota|limit|credentials/i.test(result.error ?? "")) break;
      continue;
    }

    const now = new Date().toISOString();

    await supabase
      .from("messages")
      .update({ is_draft: false, sent_at: now })
      .eq("id", draft.id)
      .eq("workspace_id", workspaceId);

    await supabase
      .from("conversations")
      .update({
        last_message_preview: draft.body.replace(/\n+/g, " ").slice(0, 96),
        last_message_at: now,
        needs_attention: false,
      })
      .eq("id", conversation.id)
      .eq("workspace_id", workspaceId);

    await supabase
      .from("leads")
      .update({ status: "contacted", last_activity_at: now })
      .eq("id", conversation.lead_id)
      .eq("workspace_id", workspaceId);

    await supabase.from("campaign_enrollments").update({ current_step: 1, last_sent_at: now })
      .eq("workspace_id", workspaceId)
      .eq("campaign_id", input.campaignId)
      .eq("lead_id", conversation.lead_id);

    await supabase.from("activities").insert({
      workspace_id: workspaceId,
      type: "message_sent",
      actor: "ai",
      actor_name: "NexusOS",
      summary: `Campaign email sent to ${contact.full_name}`,
      detail: conversation.subject ?? undefined,
      lead_id: conversation.lead_id,
      company_id: conversation.company_id,
    });

    sent += 1;
  }

  revalidatePath("/outreach");
  revalidatePath("/conversations");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return {
    ok: sent > 0,
    sent,
    failed,
    remaining: Math.max(0, pending.length - sent),
    firstError,
  };
}
