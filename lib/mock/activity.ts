import type { Activity, ActivityType, AppNotification, NotificationKind } from "@/types";
import { minutesAgo } from "@/lib/utils";
import { LEADS_WITH_RELATIONS } from "./leads";
import { WORKSPACE_ID } from "./workspace";

const FEED: Array<[ActivityType, Activity["actor"], number, string, string?]> = [
  ["ai_qualified", "ai", 2, "qualified {company} at {score}/100", "Matched three prior closed-won engagements in the same industry."],
  ["outreach_generated", "ai", 5, "generated outreach for {company}", "Draft references the follow-up delay named in their job post."],
  ["intent_detected", "ai", 12, "detected buying intent from {company}", "Reply mentions budget approval and a start date this month."],
  ["appointment_booked", "ai", 24, "booked a discovery call with {company}", "Thursday 10:00 — added to Google Calendar."],
  ["lead_discovered", "ai", 38, "discovered 14 new opportunities", "Saved search: Companies Hiring GHL Experts."],
  ["reply_received", "human", 52, "{company} replied to the follow-up", "Asked for an example build from the same industry."],
  ["stage_changed", "human", 74, "moved {company} to Interested", undefined],
  ["ai_qualified", "ai", 96, "qualified {company} at {score}/100", "Contract engagement rather than a full-time hire."],
  ["message_sent", "ai", 130, "sent the value follow-up to {company}", undefined],
  ["handoff_requested", "ai", 168, "requested human handoff on {company}", "Prospect asked a pricing question outside the approved range."],
  ["note_added", "human", 210, "added a note to {company}", "Referred by an existing client — mention the shared connection."],
  ["lead_discovered", "system", 260, "imported 9 opportunities from LinkedIn", undefined],
];

export const ACTIVITIES: Activity[] = FEED.map(([type, actor, minutes, template, detail], index) => {
  const lead = LEADS_WITH_RELATIONS[(index * 3) % LEADS_WITH_RELATIONS.length];
  const summary = template
    .replace("{company}", lead.company.name)
    .replace("{score}", String(lead.score));

  return {
    id: `act_${index + 1}`,
    workspaceId: WORKSPACE_ID,
    type,
    actor,
    actorName: actor === "ai" ? "Future Builder AI" : actor === "human" ? "Thelbert Delos Reyes" : "System",
    summary,
    detail,
    leadId: lead.id,
    companyId: lead.companyId,
    createdAt: minutesAgo(minutes),
  };
});

const NOTIFICATION_SEEDS: Array<[NotificationKind, string, number, boolean]> = [
  ["high_intent_lead", "New high-intent lead found", 3, false],
  ["prospect_replied", "Prospect replied", 18, false],
  ["ai_qualified", "AI qualified 6 new leads", 46, false],
  ["appointment_booked", "Appointment booked", 92, true],
  ["intent_detected", "AI detected buying intent", 140, true],
  ["handoff_required", "Human intervention required", 220, true],
];

export const NOTIFICATIONS: AppNotification[] = NOTIFICATION_SEEDS.map(
  ([kind, title, minutes, read], index) => {
    const lead = LEADS_WITH_RELATIONS[(index * 5) % LEADS_WITH_RELATIONS.length];
    const bodies: Record<NotificationKind, string> = {
      high_intent_lead: `${lead.company.name} posted a ${lead.jobPost?.title.toLowerCase() ?? "new role"} — scored ${lead.score}/100.`,
      prospect_replied: `${lead.contact?.fullName ?? "A prospect"} at ${lead.company.name} responded to your outreach.`,
      ai_qualified: "Six opportunities from your saved searches cleared the qualification threshold.",
      appointment_booked: `Discovery call confirmed with ${lead.company.name}.`,
      intent_detected: `Budget and timeline signals detected in the thread with ${lead.company.name}.`,
      handoff_required: `${lead.company.name} asked a pricing question outside the approved range.`,
    };

    return {
      id: `ntf_${index + 1}`,
      workspaceId: WORKSPACE_ID,
      kind,
      title,
      body: bodies[kind],
      href: kind === "appointment_booked" ? "/appointments" : `/leads/${lead.id}`,
      read,
      createdAt: minutesAgo(minutes),
    };
  },
);

export const UNREAD_NOTIFICATION_COUNT = NOTIFICATIONS.filter((n) => !n.read).length;
