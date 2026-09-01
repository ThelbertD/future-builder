"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { composeOutreach } from "@/lib/outreach/compose";
import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { fetchLead } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export interface OutreachDraftResult {
  ok: boolean;
  error?: string;
  conversationId?: string;
  subject?: string;
  body?: string;
}

const inputSchema = z.object({ leadId: z.string().min(1).max(64) });

/**
 * Generates a first-touch draft and stores it against the lead.
 *
 * The draft becomes a message on the lead's conversation, flagged `is_draft` so
 * it is never counted as sent. Regenerating replaces the existing draft rather
 * than stacking duplicates.
 */
export async function generateOutreachAction(
  input: z.input<typeof inputSchema>,
): Promise<OutreachDraftResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid lead." };

  const lead = await fetchLead(parsed.data.leadId);
  if (!lead) return { ok: false, error: "That lead no longer exists." };

  const draft = composeOutreach(lead);

  if (useMockData) {
    return { ok: true, ...draft };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account." };

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", lead.id)
    .limit(1)
    .maybeSingle<{ id: string }>();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        lead_id: lead.id,
        company_id: lead.companyId,
        contact_id: lead.contactId ?? null,
        channel: "email",
        subject: draft.subject,
        mode: "ai",
        unread_count: 0,
        needs_attention: true,
        last_message_preview: draft.body.replace(/\n+/g, " ").slice(0, 96),
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !created) return { ok: false, error: "Could not start a conversation for this lead." };
    conversationId = created.id;
  } else {
    // One draft per thread: clear the previous one before writing the new draft.
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("workspace_id", workspaceId)
      .eq("is_draft", true);
  }

  const message = {
    workspace_id: workspaceId,
    conversation_id: conversationId,
    author: "ai",
    author_name: "Future Builder AI",
    body: draft.body,
    channel: "email",
  };

  const { error: messageError } = await supabase.from("messages").insert({ ...message, is_draft: true });

  if (messageError) {
    // Migration 0004 adds is_draft. Until it has run, still save the draft
    // rather than losing the work; it just will not be labelled in the inbox.
    if (/is_draft/.test(messageError.message)) {
      const { error: fallbackError } = await supabase.from("messages").insert(message);
      if (fallbackError) return { ok: false, error: "Could not save the draft." };
    } else {
      return { ok: false, error: "Could not save the draft." };
    }
  }

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

  revalidatePath("/conversations");
  revalidatePath(`/leads/${lead.id}`);

  return { ok: true, conversationId, ...draft };
}
