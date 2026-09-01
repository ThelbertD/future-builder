"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { emailProviderStatus, sendEmail } from "@/lib/email/provider";
import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface SendDraftResult {
  ok: boolean;
  error?: string;
  sentTo?: string;
}

const inputSchema = z.object({
  messageId: z.string().min(1).max(64),
  body: z.string().trim().min(1, "The message is empty.").max(20_000),
});

/**
 * Sends a draft and promotes it to a sent message.
 *
 * Everything is checked before the send: the provider must be configured and
 * the lead must have an address, because a half-sent draft is worse than one
 * that never left.
 */
export async function sendDraftAction(input: z.input<typeof inputSchema>): Promise<SendDraftResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };

  if (useMockData) return { ok: false, error: "Connect Supabase before sending outreach." };

  const status = emailProviderStatus();
  if (!status.configured) {
    return {
      ok: false,
      error: `Email is not connected yet. Set ${status.missing.join(" and ")} on the server, then try again.`,
    };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { data: message } = await supabase
    .from("messages")
    .select("id, conversation_id, is_draft")
    .eq("id", parsed.data.messageId)
    .eq("workspace_id", workspaceId)
    .maybeSingle<{ id: string; conversation_id: string; is_draft: boolean }>();

  if (!message) return { ok: false, error: "That draft no longer exists." };
  if (!message.is_draft) return { ok: false, error: "That message has already been sent." };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, subject, contact_id, company_id")
    .eq("id", message.conversation_id)
    .eq("workspace_id", workspaceId)
    .maybeSingle<{ id: string; subject: string | null; contact_id: string | null; company_id: string }>();

  if (!conversation) return { ok: false, error: "That conversation no longer exists." };

  if (!conversation.contact_id) {
    return {
      ok: false,
      error: "This lead has no contact yet. Add a contact with an email address before sending.",
    };
  }

  const { data: contact } = await supabase
    .from("contacts")
    .select("email, full_name")
    .eq("id", conversation.contact_id)
    .eq("workspace_id", workspaceId)
    .maybeSingle<{ email: string | null; full_name: string }>();

  if (!contact?.email) {
    return { ok: false, error: `${contact?.full_name ?? "This contact"} has no email address on record.` };
  }

  const result = await sendEmail({
    to: contact.email,
    subject: conversation.subject ?? "Following up",
    body: parsed.data.body,
  });

  if (!result.ok) return { ok: false, error: result.error };

  const now = new Date().toISOString();

  await supabase
    .from("messages")
    .update({ is_draft: false, body: parsed.data.body, sent_at: now })
    .eq("id", message.id)
    .eq("workspace_id", workspaceId);

  await supabase
    .from("conversations")
    .update({
      last_message_preview: parsed.data.body.replace(/\n+/g, " ").slice(0, 96),
      last_message_at: now,
      needs_attention: false,
    })
    .eq("id", conversation.id)
    .eq("workspace_id", workspaceId);

  await supabase.from("activities").insert({
    workspace_id: workspaceId,
    type: "message_sent",
    actor: "human",
    actor_name: "You",
    summary: `Outreach sent to ${contact.full_name}`,
    detail: conversation.subject ?? undefined,
    company_id: conversation.company_id,
  });

  revalidatePath("/conversations");
  revalidatePath("/dashboard");

  return { ok: true, sentTo: contact.email };
}
