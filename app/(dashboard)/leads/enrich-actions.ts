"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { discoverContact } from "@/lib/enrich/contacts";
import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface EnrichResult {
  ok: boolean;
  error?: string;
  found: number;
  searched: number;
  skipped: number;
}

const inputSchema = z.object({
  leadIds: z.array(z.string().min(1).max(64)).min(1).max(15),
});

const ROLE_WORDS = /^(info|hello|hi|contact|team|sales|support|admin|office|newbusiness|partnerships)$/i;

/** Turns an address into a usable display name without inventing a person. */
function nameFor(email: string, companyName: string): string {
  const local = email.split("@")[0];

  if (ROLE_WORDS.test(local) || /\d/.test(local)) return `${companyName} team`;

  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Bounded concurrency: enough to be quick, few enough to stay polite. */
async function inBatches<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += size) {
    const batch = items.slice(index, index + size);
    results.push(...(await Promise.all(batch.map(worker))));
  }

  return results;
}

/**
 * Finds public contact addresses for leads that have none.
 *
 * Reads each company's own website — the pages they point the public at — and
 * takes the address printed there. Nothing is guessed from name patterns: an
 * invented address bounces, and bounces damage the sending domain.
 */
export async function discoverContactsAction(input: z.input<typeof inputSchema>): Promise<EnrichResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Select between 1 and 15 leads.", found: 0, searched: 0, skipped: 0 };
  }

  if (useMockData) {
    return { ok: false, error: "Connect Supabase to save discovered contacts.", found: 0, searched: 0, skipped: 0 };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) {
    return { ok: false, error: "No workspace found for your account.", found: 0, searched: 0, skipped: 0 };
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("id, contact_id, company:companies(id, name, domain, website), job_post:job_posts(source_url)")
    .eq("workspace_id", workspaceId)
    .in("id", parsed.data.leadIds)
    .returns<
      Array<{
        id: string;
        contact_id: string | null;
        company: { id: string; name: string; domain: string | null; website: string | null } | null;
        job_post: { source_url: string | null } | null;
      }>
    >();

  const pending = (leads ?? []).filter((lead) => !lead.contact_id && lead.company);
  const skipped = (leads ?? []).length - pending.length;

  const outcomes = await inBatches(pending, 4, async (lead) => {
    const company = lead.company!;
    const hint = company.website ?? (company.domain ? `https://${company.domain}` : undefined);

    const discovered = await discoverContact(company.name, hint, 9_000);
    if (!discovered) return false;

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        company_id: company.id,
        full_name: nameFor(discovered.email, company.name),
        email: discovered.email,
        title: "Published contact",
        is_primary: true,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !contact) return false;

    await supabase
      .from("leads")
      .update({ contact_id: contact.id })
      .eq("id", lead.id)
      .eq("workspace_id", workspaceId);

    // Record the domain so later lookups skip the resolution step.
    if (!company.domain) {
      await supabase
        .from("companies")
        .update({ domain: discovered.domain, website: `https://${discovered.domain}` })
        .eq("id", company.id)
        .eq("workspace_id", workspaceId);
    }

    return true;
  });

  const found = outcomes.filter(Boolean).length;

  revalidatePath("/leads");
  revalidatePath("/companies");

  return { ok: true, found, searched: pending.length, skipped };
}
