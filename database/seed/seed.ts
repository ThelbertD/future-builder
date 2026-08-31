/**
 * Seeds a Supabase project with the bundled demo dataset.
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment. The service role key bypasses row level security, so this script
 * is server-side only and must never be bundled into the app.
 *
 * Identifiers are derived from the mock ids, so re-running updates the same rows
 * instead of duplicating them.
 */
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import {
  ACTIVITIES,
  APPOINTMENTS,
  CAMPAIGNS,
  COMPANIES,
  CONTACTS,
  CONVERSATIONS,
  CURRENT_WORKSPACE,
  INTEGRATIONS,
  JOB_POSTS,
  LEADS,
  AI_ANALYSES,
  NOTIFICATIONS,
  PIPELINE_ID,
  PIPELINE_STAGES,
  SAVED_SEARCHES,
} from "../../lib/mock";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Deterministic UUID derived from a mock identifier. */
function uuidFor(value: string): string {
  const hash = createHash("sha1").update(`future-builder:${value}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

const WORKSPACE_UUID = uuidFor(CURRENT_WORKSPACE.id);

async function upsert(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`  ✗ ${table}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`  ✓ ${table.padEnd(18)} ${rows.length}`);
}

async function main() {
  console.log(`Seeding ${url}\n`);

  await upsert("workspaces", [
    {
      id: WORKSPACE_UUID,
      name: CURRENT_WORKSPACE.name,
      slug: CURRENT_WORKSPACE.slug,
      plan: CURRENT_WORKSPACE.plan,
      created_at: CURRENT_WORKSPACE.createdAt,
    },
  ]);

  await upsert("pipelines", [
    { id: uuidFor(PIPELINE_ID), workspace_id: WORKSPACE_UUID, name: "Client Acquisition", is_default: true },
  ]);

  await upsert(
    "pipeline_stages",
    PIPELINE_STAGES.map((stage) => ({
      id: uuidFor(stage.id),
      workspace_id: WORKSPACE_UUID,
      pipeline_id: uuidFor(PIPELINE_ID),
      name: stage.name,
      color_token: stage.colorToken,
      position: stage.position,
      probability: stage.probability,
      is_won: stage.isWon,
      is_lost: stage.isLost,
    })),
  );

  await upsert(
    "companies",
    COMPANIES.map((company) => ({
      id: uuidFor(company.id),
      workspace_id: WORKSPACE_UUID,
      name: company.name,
      domain: company.domain,
      website: company.website,
      industry: company.industry,
      location: company.location,
      country: company.country,
      size: company.size,
      employee_count: company.employeeCount,
      description: company.description,
      linkedin_url: company.linkedinUrl,
      status: company.status,
      lead_score: company.leadScore,
      tags: company.tags,
      created_at: company.createdAt,
      last_activity_at: company.lastActivityAt,
    })),
  );

  await upsert(
    "contacts",
    CONTACTS.map((contact) => ({
      id: uuidFor(contact.id),
      workspace_id: WORKSPACE_UUID,
      company_id: uuidFor(contact.companyId),
      full_name: contact.fullName,
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
      linkedin_url: contact.linkedinUrl,
      is_primary: contact.isPrimary,
      created_at: contact.createdAt,
    })),
  );

  await upsert(
    "job_posts",
    JOB_POSTS.map((post) => ({
      id: uuidFor(post.id),
      workspace_id: WORKSPACE_UUID,
      company_id: uuidFor(post.companyId),
      title: post.title,
      description: post.description,
      source: post.source,
      source_url: post.sourceUrl,
      location: post.location,
      remote: post.remote,
      engagement_type: post.engagementType,
      budget_min: post.budgetMin,
      budget_max: post.budgetMax,
      budget_period: post.budgetPeriod,
      skills: post.skills,
      posted_at: post.postedAt,
      captured_at: post.capturedAt,
    })),
  );

  await upsert(
    "leads",
    LEADS.map((lead) => ({
      id: uuidFor(lead.id),
      workspace_id: WORKSPACE_UUID,
      company_id: uuidFor(lead.companyId),
      contact_id: lead.contactId ? uuidFor(lead.contactId) : null,
      job_post_id: lead.jobPostId ? uuidFor(lead.jobPostId) : null,
      stage_id: uuidFor(lead.stageId),
      status: lead.status,
      score: lead.score,
      score_breakdown: lead.scoreBreakdown,
      intent: lead.intent,
      tags: lead.tags,
      estimated_value: lead.estimatedValue,
      notes: lead.notes,
      source: lead.source,
      created_at: lead.createdAt,
      updated_at: lead.updatedAt,
      last_activity_at: lead.lastActivityAt,
      stage_entered_at: lead.stageEnteredAt,
    })),
  );

  await upsert(
    "ai_analyses",
    AI_ANALYSES.map((analysis) => ({
      id: uuidFor(analysis.id),
      workspace_id: WORKSPACE_UUID,
      lead_id: uuidFor(analysis.leadId),
      score: analysis.score,
      intent: analysis.intent,
      opportunity_type: analysis.opportunityType,
      recommended_services: analysis.recommendedServices,
      reasoning: analysis.reasoning,
      signals: analysis.signals,
      risks: analysis.risks,
      suggested_next_action: analysis.suggestedNextAction,
      confidence: analysis.confidence,
      model: analysis.model,
      analyzed_at: analysis.analyzedAt,
    })),
  );

  await upsert(
    "conversations",
    CONVERSATIONS.map((conversation) => ({
      id: uuidFor(conversation.id),
      workspace_id: WORKSPACE_UUID,
      lead_id: uuidFor(conversation.leadId),
      company_id: uuidFor(conversation.companyId),
      contact_id: conversation.contactId ? uuidFor(conversation.contactId) : null,
      channel: conversation.channel,
      subject: conversation.subject,
      mode: conversation.mode,
      unread_count: conversation.unreadCount,
      needs_attention: conversation.needsAttention,
      last_message_preview: conversation.lastMessagePreview,
      last_message_at: conversation.lastMessageAt,
      created_at: conversation.createdAt,
    })),
  );

  await upsert(
    "messages",
    CONVERSATIONS.flatMap((conversation) =>
      conversation.messages.map((message) => ({
        id: uuidFor(message.id),
        workspace_id: WORKSPACE_UUID,
        conversation_id: uuidFor(message.conversationId),
        author: message.author,
        author_name: message.authorName,
        body: message.body,
        channel: message.channel,
        sent_at: message.sentAt,
        read_at: message.readAt ?? null,
        ai_model: message.aiModel ?? null,
      })),
    ),
  );

  await upsert(
    "appointments",
    APPOINTMENTS.map((appointment) => ({
      id: uuidFor(appointment.id),
      workspace_id: WORKSPACE_UUID,
      lead_id: uuidFor(appointment.leadId),
      company_id: uuidFor(appointment.companyId),
      contact_id: appointment.contactId ? uuidFor(appointment.contactId) : null,
      title: appointment.title,
      meeting_type: appointment.meetingType,
      status: appointment.status,
      starts_at: appointment.startsAt,
      ends_at: appointment.endsAt,
      location: appointment.location,
      notes: appointment.notes ?? null,
      booked_by_ai: appointment.bookedByAI,
      created_at: appointment.createdAt,
    })),
  );

  await upsert(
    "campaigns",
    CAMPAIGNS.map((campaign) => ({
      id: uuidFor(campaign.id),
      workspace_id: WORKSPACE_UUID,
      name: campaign.name,
      status: campaign.status,
      audience_summary: campaign.audienceSummary,
      min_score: campaign.minScore,
      services: campaign.services,
      stats: campaign.stats,
      created_at: campaign.createdAt,
      updated_at: campaign.updatedAt,
    })),
  );

  await upsert(
    "campaign_steps",
    CAMPAIGNS.flatMap((campaign) =>
      campaign.steps.map((step) => ({
        id: uuidFor(step.id),
        workspace_id: WORKSPACE_UUID,
        campaign_id: uuidFor(campaign.id),
        day_offset: step.dayOffset,
        channel: step.channel,
        name: step.name,
        subject: step.subject,
        preview: step.preview,
        sent: step.sent,
        opened: step.opened,
        replied: step.replied,
      })),
    ),
  );

  await upsert(
    "activities",
    ACTIVITIES.map((activity) => ({
      id: uuidFor(activity.id),
      workspace_id: WORKSPACE_UUID,
      type: activity.type,
      actor: activity.actor,
      actor_name: activity.actorName,
      summary: activity.summary,
      detail: activity.detail ?? null,
      lead_id: activity.leadId ? uuidFor(activity.leadId) : null,
      company_id: activity.companyId ? uuidFor(activity.companyId) : null,
      created_at: activity.createdAt,
    })),
  );

  await upsert(
    "notifications",
    NOTIFICATIONS.map((notification) => ({
      id: uuidFor(notification.id),
      workspace_id: WORKSPACE_UUID,
      kind: notification.kind,
      title: notification.title,
      body: notification.body,
      href: notification.href,
      read: notification.read,
      created_at: notification.createdAt,
    })),
  );

  await upsert(
    "saved_searches",
    SAVED_SEARCHES.map((search) => ({
      id: uuidFor(search.id),
      workspace_id: WORKSPACE_UUID,
      name: search.name,
      keywords: search.keywords,
      location: search.location,
      industry: search.industry,
      sources: search.sources,
      min_score: search.minScore,
      cadence_hours: search.cadenceHours,
      last_run_at: search.lastRunAt,
      new_results: search.newResults,
    })),
  );

  await upsert(
    "integrations",
    INTEGRATIONS.map((integration) => ({
      id: uuidFor(`integration_${integration.id}`),
      workspace_id: WORKSPACE_UUID,
      provider: integration.id,
      status: integration.status,
      config: {},
      connected_at: integration.connectedAt ?? null,
    })),
  );

  console.log(
    process.exitCode === 1
      ? "\nSeed finished with errors."
      : "\nSeed complete. Set NEXT_PUBLIC_USE_MOCK_DATA=false to read from Supabase.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
