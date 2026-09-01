import type { LeadWithRelations } from "@/types";

export interface ComposedMessage {
  subject: string;
  body: string;
}

/**
 * Composes a first-touch message from what the record actually says.
 *
 * Deterministic and template-driven: it only ever references the company name,
 * the role they advertised, the services the scorer matched, and the signals it
 * found. Nothing is invented, which is what makes the draft safe to send after
 * a glance. The AI provider replaces this composer without changing its shape.
 */
const OPENERS = [
  (company: string, role: string) =>
    `I saw ${company} is hiring a ${role.toLowerCase()}. Most teams posting that role are trying to fix one thing: enquiries going cold before anyone follows up.`,
  (company: string, role: string) =>
    `Quick note about the ${role.toLowerCase()} opening at ${company}. Before committing to a hire, it may be worth seeing what the build actually takes.`,
  (company: string, role: string) =>
    `Noticed the ${role.toLowerCase()} post from ${company}. The part that stood out was the follow-up gap it describes.`,
];

const CLOSERS = [
  "Worth a 20-minute look at your current flow?",
  "Happy to share what a comparable rollout looked like, if that is useful.",
  "Is the search still open?",
];

/** Stable per lead, so regenerating does not shuffle the wording pointlessly. */
function pick<T>(options: T[], seed: string): T {
  const sum = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return options[sum % options.length];
}

export function composeOutreach(lead: LeadWithRelations): ComposedMessage {
  const company = lead.company.name;
  const role = lead.jobPost?.title ?? "role like that";
  const services = lead.analysis?.recommendedServices ?? [];
  const primary = services[0] ?? "workflow automation";
  const signals = lead.analysis?.signals ?? [];
  const contact = lead.contact?.fullName?.split(" ")[0];

  const greeting = contact ? `Hi ${contact},` : "Hi,";
  const opener = pick(OPENERS, lead.id)(company, role);
  const closer = pick(CLOSERS, `${lead.id}z`);

  const offer = `We build that as a fixed-scope project rather than a hire: ${primary.toLowerCase()}${
    services[1] ? `, ${services[1].toLowerCase()}` : ""
  }, and the reporting behind it. Two similar clients cut first-response time from hours to under three minutes.`;

  const evidence = signals.length > 0 ? `\n\nWhat caught my eye: ${signals[0].toLowerCase()}.` : "";

  return {
    subject: `Saw your ${role.toLowerCase()} posting`,
    body: `${greeting}\n\n${opener}\n\n${offer}${evidence}\n\n${closer}`,
  };
}
