"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { composeOutreach } from "@/lib/outreach/compose";
import { hostnameOf } from "@/lib/scraper/html";
import { getActiveWorkspace, getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { fetchLead } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { sanitizeUrl } from "@/lib/utils";

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

  const workspace = await getActiveWorkspace();
  const draft = composeOutreach(lead, { bookingUrl: workspace?.bookingUrl });

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
    author_name: "NexusOS",
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

export interface DeleteLeadsResult {
  ok: boolean;
  error?: string;
  deleted: number;
}

const deleteSchema = z.object({
  leadIds: z.array(z.string().min(1).max(64)).min(1).max(500),
});

/**
 * Deletes leads permanently.
 *
 * Everything hanging off a lead — its conversation, messages, analysis and
 * activity — is removed with it by the cascades on those foreign keys, so this
 * leaves nothing orphaned. The company and contact stay: they are shared with
 * other leads, and deleting one opportunity is not a reason to forget the firm.
 *
 * Nothing here is recoverable, so the caller confirms first.
 */
export async function deleteLeadsAction(input: z.input<typeof deleteSchema>): Promise<DeleteLeadsResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nothing was selected to delete.", deleted: 0 };

  if (useMockData) {
    return { ok: false, error: "Connect Supabase to delete leads.", deleted: 0 };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account.", deleted: 0 };

  const { data, error } = await supabase
    .from("leads")
    .delete()
    .eq("workspace_id", workspaceId)
    .in("id", parsed.data.leadIds)
    .select("id")
    .returns<Array<{ id: string }>>();

  if (error) return { ok: false, error: "Those leads could not be deleted.", deleted: 0 };

  // Deleting is admin-only under RLS, and a member's delete removes no rows
  // rather than failing. Saying "done" to that would be a lie.
  if ((data?.length ?? 0) === 0) {
    return {
      ok: false,
      error: "Nothing was deleted. Deleting leads needs an owner or admin role on this workspace.",
      deleted: 0,
    };
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/conversations");
  revalidatePath("/dashboard");

  return { ok: true, deleted: data?.length ?? 0 };
}

export interface ImportCsvRow {
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTitle?: string;
  opportunity?: string;
  source?: string;
  score?: string;
  intent?: string;
  status?: string;
  estimatedValue?: string;
  tags?: string;
  notes?: string;
}

export interface ImportCsvResult {
  ok: boolean;
  error?: string;
  imported: number;
  skipped: number;
  /** Row-level problems, so a partial import can be understood and repeated. */
  problems: string[];
}

const csvRowSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  website: z.string().trim().max(300).optional(),
  industry: z.string().trim().max(120).optional(),
  location: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(160).optional(),
  contactEmail: z.string().trim().max(200).optional(),
  contactPhone: z.string().trim().max(60).optional(),
  contactTitle: z.string().trim().max(160).optional(),
  opportunity: z.string().trim().max(200).optional(),
  source: z.string().trim().max(60).optional(),
  score: z.string().trim().max(20).optional(),
  intent: z.string().trim().max(20).optional(),
  status: z.string().trim().max(40).optional(),
  estimatedValue: z.string().trim().max(30).optional(),
  tags: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(5000).optional(),
});

const importCsvSchema = z.object({ rows: z.array(csvRowSchema).min(1).max(2000) });

const INTENTS = new Set(["hot", "high", "medium", "low"]);

/** Reads a number out of a spreadsheet cell, which may carry a currency symbol. */
function numberFrom(value: string | undefined, max: number): number {
  if (!value) return 0;
  const digits = value.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(digits);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(max, Math.round(parsed)));
}

/**
 * Creates leads from mapped CSV rows.
 *
 * Companies are matched by name so a file listing several opportunities at one
 * firm does not create it repeatedly, and a contact is only made when the row
 * carries a name or an address to put on it. A row that fails is counted and
 * named rather than aborting the file: a 400-row import that stops on row 12
 * wastes the other 388.
 */
export async function importLeadsFromCsvAction(
  input: z.input<typeof importCsvSchema>,
): Promise<ImportCsvResult> {
  const parsed = importCsvSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That file had no usable rows.", imported: 0, skipped: 0, problems: [] };
  }

  if (useMockData) {
    return { ok: false, error: "Connect Supabase to import leads.", imported: 0, skipped: 0, problems: [] };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) {
    return { ok: false, error: "No workspace found for your account.", imported: 0, skipped: 0, problems: [] };
  }

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!pipeline) {
    return { ok: false, error: "This workspace has no pipeline yet.", imported: 0, skipped: 0, problems: [] };
  }

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!stage) {
    return { ok: false, error: "That pipeline has no stages yet.", imported: 0, skipped: 0, problems: [] };
  }

  let imported = 0;
  let skipped = 0;
  const problems: string[] = [];
  // Rows repeat a company constantly; caching avoids a query per row.
  const companyIds = new Map<string, string>();

  for (const [index, row] of parsed.data.rows.entries()) {
    // The header occupies line 1, so a reported line matches the spreadsheet.
    const line = index + 2;
    const key = row.companyName.toLowerCase();

    let companyId = companyIds.get(key);

    if (!companyId) {
      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("workspace_id", workspaceId)
        .ilike("name", row.companyName)
        .limit(1)
        .maybeSingle<{ id: string }>();

      companyId = existing?.id;
    }

    if (!companyId) {
      const { data: created, error } = await supabase
        .from("companies")
        .insert({
          workspace_id: workspaceId,
          name: row.companyName,
          website: sanitizeUrl(row.website) ?? null,
          domain: hostnameOf(sanitizeUrl(row.website) ?? "") ?? null,
          industry: row.industry || null,
          location: row.location || null,
          status: "prospect",
          lead_score: numberFrom(row.score, 100),
        })
        .select("id")
        .single<{ id: string }>();

      if (error || !created) {
        skipped += 1;
        problems.push(`Line ${line}: could not create ${row.companyName}.`);
        continue;
      }
      companyId = created.id;
    }

    companyIds.set(key, companyId);

    let contactId: string | null = null;

    if (row.contactEmail || row.contactName) {
      const { data: existingContact } = row.contactEmail
        ? await supabase
            .from("contacts")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("email", row.contactEmail)
            .limit(1)
            .maybeSingle<{ id: string }>()
        : { data: null };

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const { data: created } = await supabase
          .from("contacts")
          .insert({
            workspace_id: workspaceId,
            company_id: companyId,
            full_name: row.contactName || row.companyName,
            email: row.contactEmail || null,
            phone: row.contactPhone || null,
            title: row.contactTitle || null,
            is_primary: true,
          })
          .select("id")
          .single<{ id: string }>();

        contactId = created?.id ?? null;
      }
    }

    const score = numberFrom(row.score, 100);
    const intent = row.intent?.toLowerCase();

    const { error: leadError } = await supabase.from("leads").insert({
      workspace_id: workspaceId,
      company_id: companyId,
      contact_id: contactId,
      stage_id: stage.id,
      status: "new",
      score,
      intent: intent && INTENTS.has(intent) ? intent : "low",
      estimated_value: numberFrom(row.estimatedValue, 10_000_000),
      notes: row.notes ?? "",
      source: row.source || "Company Site",
      tags: (row.tags ?? "")
        .split(/[;,]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5),
    });

    if (leadError) {
      skipped += 1;
      problems.push(`Line ${line}: ${row.companyName} could not be added.`);
      continue;
    }

    imported += 1;
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/companies");

  return { ok: imported > 0, imported, skipped, problems: problems.slice(0, 8) };
}
