"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fetchInbound, inboxStatus } from "@/lib/email/inbox";
import { emailProviderStatus, sendEmail } from "@/lib/email/provider";
import { getActiveWorkspace, getActiveWorkspaceId } from "@/lib/supabase/auth";
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

  // Read at send time rather than baked into the draft, so editing the
  // signature changes what goes out next without touching stored drafts.
  const workspace = await getActiveWorkspace();

  const result = await sendEmail({
    to: contact.email,
    subject: conversation.subject ?? "Following up",
    body: parsed.data.body,
    signature: workspace?.emailSignature,
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

export interface SyncRepliesResult {
  ok: boolean;
  error?: string;
  /** Replies matched to a lead and stored. */
  added: number;
  /** Received, but from an address no contact in this workspace owns. */
  unmatched: number;
  /** Enrolments stopped because the prospect answered. */
  stopped: number;
}

/**
 * Pulls replies out of the mailbox and onto their conversations.
 *
 * The app could send and never receive, so a prospect's answer sat in Gmail
 * while the thread here still read one message. IMAP reuses the credentials
 * that already send, which is why this needs nothing new configured.
 *
 * A reply is matched to a lead by the address it came from. Anything from an
 * address no contact owns — newsletters, notifications, a colleague — is
 * counted and ignored rather than guessed at.
 */
export async function syncRepliesAction(): Promise<SyncRepliesResult> {
  const base = { added: 0, unmatched: 0, stopped: 0 };

  if (useMockData) return { ok: false, error: "Connect Supabase to sync replies.", ...base };

  const status = inboxStatus();
  if (!status.configured) {
    return { ok: false, error: `The mailbox is not configured. Missing: ${status.missing.join(", ")}.`, ...base };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account.", ...base };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("inbox_synced_at")
    .eq("id", workspaceId)
    .maybeSingle<{ inbox_synced_at: string | null }>();

  // First run looks back a week; after that, only what has arrived since.
  const since = workspace?.inbox_synced_at
    ? new Date(workspace.inbox_synced_at)
    : new Date(Date.now() - 7 * 86_400_000);

  let inbound;

  try {
    inbound = await fetchInbound(since);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false,
      error: /invalid credentials|authenticationfailed|535/i.test(detail)
        ? "The mail server rejected the login. Gmail needs IMAP enabled on the account and the same App Password used for sending."
        : `Could not read the mailbox: ${detail}`,
      ...base,
    };
  }

  if (inbound.length === 0) {
    await supabase.from("workspaces").update({ inbox_synced_at: new Date().toISOString() }).eq("id", workspaceId);
    return { ok: true, ...base };
  }

  // One lookup for every sender, rather than a query per message.
  const senders = Array.from(new Set(inbound.map((message) => message.fromEmail)));

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, email, company_id")
    .eq("workspace_id", workspaceId)
    .in("email", senders)
    .returns<Array<{ id: string; email: string | null; company_id: string }>>();

  const byEmail = new Map<string, { id: string; company_id: string }>();
  for (const contact of contacts ?? []) {
    if (contact.email) byEmail.set(contact.email.toLowerCase(), contact);
  }

  let added = 0;
  let unmatched = 0;
  let stopped = 0;

  for (const message of inbound) {
    const contact = byEmail.get(message.fromEmail);

    if (!contact) {
      unmatched += 1;
      continue;
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("contact_id", contact.id)
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (!lead) {
      unmatched += 1;
      continue;
    }

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
          company_id: contact.company_id,
          contact_id: contact.id,
          channel: "email",
          subject: message.subject.replace(/^(re|fwd):\s*/i, ""),
          mode: "human",
        })
        .select("id")
        .single<{ id: string }>();

      conversationId = created?.id;
    }

    if (!conversationId) {
      unmatched += 1;
      continue;
    }

    const { error: insertError } = await supabase.from("messages").insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      author: "prospect",
      author_name: message.fromName ?? message.fromEmail,
      body: message.body,
      channel: "email",
      sent_at: message.receivedAt.toISOString(),
      external_id: message.externalId,
      is_draft: false,
    });

    if (insertError) {
      // The unique index on external_id is doing its job: this reply is
      // already stored, which is the normal case on a repeated sync.
      if (/duplicate key|messages_external_id_key/i.test(insertError.message)) continue;
      unmatched += 1;
      continue;
    }

    await supabase
      .from("conversations")
      .update({
        last_message_preview: message.body.replace(/\n+/g, " ").slice(0, 96),
        last_message_at: message.receivedAt.toISOString(),
        needs_attention: true,
        unread_count: 1,
        // A human answers a reply. Handing it back to the assistant here would
        // be the app deciding to keep talking on its own.
        mode: "human",
      })
      .eq("id", conversationId)
      .eq("workspace_id", workspaceId);

    await supabase
      .from("leads")
      .update({ status: "replied", last_activity_at: message.receivedAt.toISOString() })
      .eq("id", lead.id)
      .eq("workspace_id", workspaceId);

    // "Sequences pause automatically on reply" is what the Outreach page
    // promises. This is where that becomes true.
    const { data: halted } = await supabase
      .from("campaign_enrollments")
      .update({ status: "stopped" })
      .eq("workspace_id", workspaceId)
      .eq("lead_id", lead.id)
      .eq("status", "active")
      .select("id")
      .returns<Array<{ id: string }>>();

    stopped += halted?.length ?? 0;

    await supabase.from("activities").insert({
      workspace_id: workspaceId,
      type: "message_received",
      actor: "prospect",
      actor_name: message.fromName ?? message.fromEmail,
      summary: `Reply from ${message.fromName ?? message.fromEmail}`,
      detail: message.subject,
      lead_id: lead.id,
      company_id: contact.company_id,
    });

    // A reply is the one event worth interrupting someone for, and
    // prospect_replied was already a notification kind that nothing created.
    // The link opens the thread it belongs to.
    await supabase.from("notifications").insert({
      workspace_id: workspaceId,
      kind: "prospect_replied",
      title: `${message.fromName ?? message.fromEmail} replied`,
      body: message.body.replace(/\n+/g, " ").slice(0, 140),
      href: `/conversations?c=${conversationId}`,
      read: false,
    });

    added += 1;
  }

  await supabase.from("workspaces").update({ inbox_synced_at: new Date().toISOString() }).eq("id", workspaceId);

  revalidatePath("/conversations");
  revalidatePath("/dashboard");
  revalidatePath("/leads");

  return { ok: true, added, unmatched, stopped };
}
