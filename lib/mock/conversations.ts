import type { Conversation, ConversationChannel, Message } from "@/types";
import { hoursAgo, seededRandom, truncate } from "@/lib/utils";
import { LEADS_WITH_RELATIONS } from "./leads";
import { WORKSPACE_ID } from "./workspace";

const CHANNELS: ConversationChannel[] = ["email", "linkedin", "email", "sms", "email"];

const OUTREACH_TEMPLATES = [
  (company: string, role: string, service: string) =>
    `Hi — I saw ${company} is hiring a ${role.toLowerCase()}. Most teams posting that role are really trying to fix one thing: enquiries going cold before anyone follows up.\n\nWe build that follow-up system as a fixed-scope project instead of a hire — ${service.toLowerCase()}, routing, and a dashboard your team actually reads. Two similar clients cut first-response time from hours to under three minutes.\n\nWorth a 20-minute look at your current flow?`,
  (company: string, role: string, service: string) =>
    `Hi — quick note about the ${role.toLowerCase()} opening at ${company}.\n\nBefore you commit to a full-time hire, it may be worth seeing what the build actually takes. We scope this kind of work in two weeks: ${service.toLowerCase()} first, then the reporting layer.\n\nHappy to share what a comparable rollout looked like if that is useful.`,
  (company: string, role: string, service: string) =>
    `Hi — noticed the ${role.toLowerCase()} post from ${company}. The part that stood out was the follow-up delay you described.\n\nWe specialise in exactly that: ${service.toLowerCase()} with the handoffs mapped to how your team already works. No platform migration required.\n\nIs the search still open?`,
];

const REPLY_TEMPLATES = [
  "Thanks for reaching out. We are still deciding between hiring someone internally and bringing in a partner. What does a typical engagement look like on your side?",
  "Good timing — the posting has been up for three weeks and we have not found the right fit. Can you send over an example of something similar you have built?",
  "Interested. Our main concern is how long the build takes and whether it disrupts the team while it is happening. Do you have availability this month?",
  "This is relevant to us. I would want our operations lead on any call. Do you have anything Thursday or Friday?",
];

const AI_FOLLOWUP_TEMPLATES = [
  "Happy to walk through it. Engagements usually start with a two-week build covering the follow-up sequences and calendar routing, then a short handover so your team owns it.\n\nI have Thursday 10:00 or Friday 14:00 open — either work?",
  "Sending a short case study from a company in your industry now. The build ran two weeks with roughly ninety minutes of input needed from their team.\n\nWould a 20-minute call on Thursday be useful?",
  "Nothing changes for your team while it is being built — we work alongside the existing process and switch over once it is tested.\n\nI can hold Thursday 10:00 if that suits.",
];

const HUMAN_TEMPLATES = [
  "Jumping in here — I put together a short outline of what the first two weeks would cover. Sending it across now so you have it before we talk.",
  "Taking this one over from the assistant. I have blocked Thursday at 10:00 and sent an invite — let me know if another time is easier.",
];

const CONFIRM_TEMPLATES = [
  "Thursday 10:00 works. I will bring our operations lead.",
  "Booked it in, thanks. Looking forward to it.",
];

const rand = seededRandom(2020);

/** Conversations only exist for leads that have actually been contacted. */
const CONTACTED_LEADS = LEADS_WITH_RELATIONS.filter((lead) =>
  ["contacted", "replied", "interested", "booked", "call_completed", "proposal", "negotiation", "won"].includes(
    lead.status,
  ),
).slice(0, 20);

export const CONVERSATIONS: Conversation[] = CONTACTED_LEADS.map((lead, index) => {
  const channel = CHANNELS[index % CHANNELS.length];
  const contactName = lead.contact?.fullName ?? "Prospect";
  const role = lead.jobPost?.title ?? "automation role";
  const service = lead.analysis?.recommendedServices[0] ?? "workflow automation";
  const conversationId = `cnv_${index + 1}`;
  const baseHours = 24 + index * 6;
  const messages: Message[] = [];

  const push = (
    author: Message["author"],
    authorName: string,
    body: string,
    hoursOffset: number,
    aiModel?: string,
  ) => {
    messages.push({
      id: `msg_${conversationId}_${messages.length + 1}`,
      workspaceId: WORKSPACE_ID,
      conversationId,
      author,
      authorName,
      body,
      channel,
      sentAt: hoursAgo(hoursOffset),
      readAt: author === "prospect" ? undefined : hoursAgo(hoursOffset - 0.5),
      aiModel,
    });
  };

  push(
    "ai",
    "Future Builder AI",
    OUTREACH_TEMPLATES[index % OUTREACH_TEMPLATES.length](lead.company.name, role, service),
    baseHours,
    "gpt-4.1",
  );

  const hasReply = lead.status !== "contacted";
  if (hasReply) {
    push("prospect", contactName, REPLY_TEMPLATES[index % REPLY_TEMPLATES.length], baseHours - 9);
    push(
      "ai",
      "Future Builder AI",
      AI_FOLLOWUP_TEMPLATES[index % AI_FOLLOWUP_TEMPLATES.length],
      baseHours - 8,
      "gpt-4.1",
    );
  }

  const hasHumanTakeover = ["interested", "booked", "proposal", "negotiation", "won"].includes(lead.status);
  if (hasHumanTakeover) {
    push("human", "Thelbert Delos Reyes", HUMAN_TEMPLATES[index % HUMAN_TEMPLATES.length], baseHours - 5);
  }

  const hasConfirmation = ["booked", "call_completed", "proposal", "negotiation", "won"].includes(lead.status);
  if (hasConfirmation) {
    push("prospect", contactName, CONFIRM_TEMPLATES[index % CONFIRM_TEMPLATES.length], baseHours - 3);
    push(
      "system",
      "System",
      `Appointment scheduled with ${contactName} — ${lead.company.name}.`,
      baseHours - 2.9,
    );
  }

  const last = messages[messages.length - 1];
  const unread = last.author === "prospect" ? 1 + Math.round(rand()) : 0;

  return {
    id: conversationId,
    workspaceId: WORKSPACE_ID,
    leadId: lead.id,
    companyId: lead.companyId,
    contactId: lead.contactId,
    channel,
    subject: `${role} — ${lead.company.name}`,
    mode: hasHumanTakeover ? "human" : "ai",
    unreadCount: unread,
    needsAttention: unread > 0 && lead.score >= 85,
    assigneeId: lead.ownerId,
    lastMessagePreview: truncate(last.body.replace(/\n+/g, " "), 96),
    lastMessageAt: last.sentAt,
    createdAt: messages[0].sentAt,
    messages,
  };
});

export function getConversationById(id: string): Conversation | undefined {
  return CONVERSATIONS.find((conversation) => conversation.id === id);
}

export function getConversationByLead(leadId: string): Conversation | undefined {
  return CONVERSATIONS.find((conversation) => conversation.leadId === leadId);
}

export const UNREAD_CONVERSATION_COUNT = CONVERSATIONS.reduce(
  (total, conversation) => total + (conversation.unreadCount > 0 ? 1 : 0),
  0,
);
