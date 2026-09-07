"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runLeadSearch } from "@/lib/scraper";
import { hostnameOf } from "@/lib/scraper/html";
import type { ScoredJob } from "@/lib/scraper/scoring";
import type { SourceOutcome } from "@/lib/scraper/types";
import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.object({
  keywords: z.array(z.string().trim().min(1).max(60)).max(12),
  location: z.string().trim().max(60),
  region: z.string().trim().max(60).optional(),
  industry: z.string().trim().max(60).optional(),
  service: z.string().trim().max(60).optional(),
  postedWithinDays: z.number().int().min(1).max(365),
  minScore: z.number().int().min(0).max(100),
  intent: z.string().trim().max(20).optional(),
});

export interface SearchResponse {
  ok: boolean;
  error?: string;
  jobs: ScoredJob[];
  outcomes: SourceOutcome[];
  fetched: number;
}

/** Runs the live search across every registered source. */
export async function searchLeadsAction(input: z.input<typeof querySchema>): Promise<SearchResponse> {
  const parsed = querySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Check the search filters and try again.", jobs: [], outcomes: [], fetched: 0 };
  }

  try {
    const result = await runLeadSearch({ ...parsed.data, limit: 60 });
    return { ok: true, ...result };
  } catch (error) {
    console.error("Lead search failed:", error);
    return {
      ok: false,
      error: "The search could not be completed. Try again in a moment.",
      jobs: [],
      outcomes: [],
      fetched: 0,
    };
  }
}

export interface ImportResponse {
  ok: boolean;
  error?: string;
  imported: number;
  skipped: number;
  /** How many arrived with a contact address, so are sendable immediately. */
  withContact: number;
}

/**
 * Turns discovered postings into workspace records.
 *
 * One opportunity becomes up to four rows: the company (reused when the name
 * already exists), the job post, the lead itself, and the scoring rationale.
 * Postings already imported are skipped by their source URL.
 */
export async function importLeadsAction(jobs: ScoredJob[]): Promise<ImportResponse> {
  if (jobs.length === 0) return { ok: true, imported: 0, skipped: 0, withContact: 0 };

  if (useMockData) {
    return {
      ok: false,
      error: "Connect Supabase to import discovered leads into your workspace.",
      imported: 0,
      skipped: 0,
      withContact: 0,
    };
  }

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false, error: "No workspace found for your account.", imported: 0, skipped: 0, withContact: 0 };

  // Everything lands in the first stage of the default pipeline.
  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!pipeline) return { ok: false, error: "This workspace has no pipeline yet.", imported: 0, skipped: 0, withContact: 0 };

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string; name: string }>();

  if (!stage) return { ok: false, error: "That pipeline has no stages yet.", imported: 0, skipped: 0, withContact: 0 };

  const urls = jobs.map((job) => job.url);
  const { data: existing } = await supabase
    .from("job_posts")
    .select("source_url")
    .eq("workspace_id", workspaceId)
    .in("source_url", urls)
    .returns<Array<{ source_url: string }>>();

  const alreadyImported = new Set((existing ?? []).map((row) => row.source_url));

  let imported = 0;
  let skipped = 0;
  let withContact = 0;

  for (const job of jobs) {
    if (alreadyImported.has(job.url)) {
      skipped += 1;
      continue;
    }

    const { data: found } = await supabase
      .from("companies")
      .select("id")
      .eq("workspace_id", workspaceId)
      .ilike("name", job.companyName)
      .limit(1)
      .maybeSingle<{ id: string }>();

    let companyId = found?.id;

    if (!companyId) {
      const { data: created, error } = await supabase
        .from("companies")
        .insert({
          workspace_id: workspaceId,
          name: job.companyName,
          location: job.location,
          website: job.companyUrl ?? null,
          domain: hostnameOf(job.companyUrl ?? "") ?? null,
          industry: job.industry ?? null,
          employee_count: job.employeeCount ?? null,
          status: "prospect",
          lead_score: job.score,
          tags: job.recommendedServices.slice(0, 2),
        })
        .select("id")
        .single<{ id: string }>();

      if (error || !created) {
        skipped += 1;
        continue;
      }
      companyId = created.id;
    }

    // Database sources carry the contact with the record, which is the whole
    // point of using them: the lead is sendable the moment it is imported.
    let contactId: string | null = null;

    if (job.contact?.email) {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("email", job.contact.email)
        .limit(1)
        .maybeSingle<{ id: string }>();

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const { data: created } = await supabase
          .from("contacts")
          .insert({
            workspace_id: workspaceId,
            company_id: companyId,
            full_name: job.contact.fullName,
            email: job.contact.email,
            phone: job.contact.phone ?? null,
            title: job.contact.title ?? null,
            linkedin_url: job.contact.linkedinUrl ?? null,
            is_primary: true,
          })
          .select("id")
          .single<{ id: string }>();

        contactId = created?.id ?? null;
      }
    }

    const { data: post } = await supabase
      .from("job_posts")
      .insert({
        workspace_id: workspaceId,
        company_id: companyId,
        title: job.title,
        description: job.description,
        source: job.sourceName,
        source_url: job.url,
        location: job.location,
        remote: job.remote,
        engagement_type: job.engagementType,
        skills: job.tags.slice(0, 10),
        posted_at: job.postedAt,
      })
      .select("id")
      .single<{ id: string }>();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        workspace_id: workspaceId,
        company_id: companyId,
        contact_id: contactId,
        job_post_id: post?.id ?? null,
        stage_id: stage.id,
        status: "new",
        score: job.score,
        score_breakdown: job.breakdown,
        intent: job.intent,
        estimated_value: job.estimatedValue,
        source: job.sourceName,
        tags: job.recommendedServices.slice(0, 2),
        notes: "",
      })
      .select("id")
      .single<{ id: string }>();

    if (leadError || !lead) {
      skipped += 1;
      continue;
    }

    await supabase.from("ai_analyses").insert({
      workspace_id: workspaceId,
      lead_id: lead.id,
      score: job.score,
      intent: job.intent,
      opportunity_type: job.opportunityType,
      recommended_services: job.recommendedServices,
      reasoning: job.reasoning,
      signals: job.signals,
      risks: job.risks,
      // A directory record has no advertised requirement to reference, so
      // telling the user to quote one sends them looking for something that
      // does not exist.
      suggested_next_action:
        job.kind === "database"
          ? `${job.companyName} advertised nothing, so open with what they do rather than a vacancy${
              job.contact?.email
                ? `. Write to ${job.contact.email}`
                : ". Find an address on their site first"
            }.`
          : `Open ${job.companyName} on ${job.sourceName} and reference the specific requirement in the first message.`,
      confidence: job.confidence,
      model: "heuristic-v1",
    });

    imported += 1;
    if (contactId) withContact += 1;
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/companies");

  return { ok: true, imported, skipped, withContact };
}
