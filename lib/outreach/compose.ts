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
/** The role reaches these already cased for mid-sentence use. */
const OPENERS = [
  (company: string, role: string) =>
    `I saw ${company} is hiring ${articleFor(role)} ${role}. Most teams posting that role are trying to fix one thing: enquiries going cold before anyone follows up.`,
  (company: string, role: string) =>
    `Quick note about the ${role} opening at ${company}. Before committing to a hire, it may be worth seeing what the build actually takes.`,
  (company: string, role: string) =>
    `Noticed the ${role} post from ${company}. The part that stood out was the follow-up gap it describes.`,
];

const CLOSERS = [
  "Worth a 20-minute look at your current flow?",
  "Happy to share what a comparable rollout looked like, if that is useful.",
  "Is the search still open?",
];

/**
 * Openers for a business found in a directory rather than on a job board.
 *
 * These companies advertised nothing, so there is no role to name and no search
 * to ask about. Reaching for the job-board wording anyway is what produced
 * lines like "I saw Twin Systems is hiring a it" — the reader learns in six
 * words that nobody looked at the record before it was sent.
 */
const DIRECTORY_OPENERS = [
  /** `trade` arrives plural, so it reads as a category being surveyed. */
  (company: string, trade: string, place: string) =>
    `I came across ${company} while looking at ${trade}${place}. The pattern with most businesses that size is enquiries going cold in the gap between someone getting in touch and anyone following up.`,
  (company: string, trade: string, place: string) =>
    `Reaching out because ${company} came up among the ${trade}${place} I have been looking at. This may already be handled, but the usual bottleneck at that size is the wait between an enquiry landing and someone calling back.`,
];

const DIRECTORY_CLOSERS = [
  "Worth a 20-minute look at how enquiries reach you today?",
  "Happy to walk through what this looked like for a comparable business, if useful.",
];

/**
 * Sources that list businesses rather than openings.
 *
 * A record from one of these carries a trade and an address, never a vacancy.
 */
const DIRECTORY_SOURCES = new Set<string>(["OpenStreetMap"]);

/**
 * Lower-cases a label for use mid-sentence, leaving initialisms alone.
 *
 * These labels are title-cased for display, so dropping them into a sentence
 * needs care: "AI Automation" has to read "AI automation", not "ai automation",
 * and an IT firm is not an "it firm".
 */
function midSentence(label: string): string {
  return label
    .split(" ")
    .map((word) => (/^[A-Z0-9&]{2,}$/.test(word) ? word : word.toLowerCase()))
    .join(" ");
}

/**
 * "a" or "an", by how the word is said rather than how it is spelled.
 *
 * An initialism goes by its letter name: "an AI engineer", "an HVAC firm",
 * because those are said "ay-eye" and "aitch". The listed letters are the ones
 * whose names begin with a vowel sound.
 */
function articleFor(phrase: string): string {
  const first = phrase.trim().split(" ")[0] ?? "";
  if (!first) return "a";

  const initial = first[0].toUpperCase();
  const isInitialism = /^[A-Z0-9&]{2,}$/.test(first);

  return isInitialism
    ? /[AEFHILMNORSX]/.test(initial)
      ? "an"
      : "a"
    : /[AEIOU]/.test(initial)
      ? "an"
      : "a";
}

/**
 * The plural of a trade, for "looking at plumbers in Clearwater".
 *
 * OSM names a category in the singular ("plumber", "estate agency") while some
 * labels are already plural ("IT services"), so both have to come out right.
 */
function pluralize(trade: string): string {
  if (/s$/i.test(trade)) return trade;
  if (/[^aeiou]y$/i.test(trade)) return `${trade.slice(0, -1)}ies`;
  if (/(ch|sh|x|z)$/i.test(trade)) return `${trade}es`;
  return `${trade}s`;
}

/** Stable per lead, so regenerating does not shuffle the wording pointlessly. */
function pick<T>(options: T[], seed: string): T {
  const sum = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return options[sum % options.length];
}

/**
 * The first name to greet, when there is a person to greet.
 *
 * A directory lists the business, so the "contact" on the record is the company
 * itself. Splitting that on a space addresses the mail to "Hi Twin," which is
 * worse than not using a name at all.
 */
function firstNameOf(lead: LeadWithRelations): string | undefined {
  const fullName = lead.contact?.fullName?.trim();
  if (!fullName) return undefined;

  if (fullName.toLowerCase() === lead.company.name.trim().toLowerCase()) return undefined;

  return fullName.split(/\s+/)[0];
}

export interface ComposeOptions {
  /** Scheduling link appended to the close, when the workspace has one. */
  bookingUrl?: string;
}

function composeDirectory(lead: LeadWithRelations, options: ComposeOptions): ComposedMessage {
  const company = lead.company.name;
  const services = lead.analysis?.recommendedServices ?? [];
  const primary = services[0] ?? "workflow automation";

  // The industry is the OSM category, which reads as a trade: "estate agent",
  // "plumber", "advertising agency".
  const trade = midSentence(lead.company.industry?.trim() || "") || "local businesses";
  const location = lead.company.location?.trim();
  const place = location && location !== "Not stated" ? ` in ${location}` : "";

  const name = firstNameOf(lead);
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const opener = pick(DIRECTORY_OPENERS, lead.id)(company, pluralize(trade), place);
  const closer = pick(DIRECTORY_CLOSERS, `${lead.id}z`);

  const offer = `We fix that as a fixed-scope project: ${midSentence(primary)}${
    services[1] ? `, ${midSentence(services[1])}` : ""
  }, and the reporting behind it. Two similar businesses cut first-response time from hours to under three minutes.`;

  // No evidence line here. A directory record's signals are scoring notes
  // ("named contact on file"), which say nothing to the person reading it.
  const booking = options.bookingUrl
    ? `\n\nIf it is easier, grab a 30-minute slot directly: ${options.bookingUrl}`
    : "";

  return {
    subject: `Quick question about ${company}`,
    body: `${greeting}\n\n${opener}\n\n${offer}\n\n${closer}${booking}`,
  };
}

export function composeOutreach(lead: LeadWithRelations, options: ComposeOptions = {}): ComposedMessage {
  if (DIRECTORY_SOURCES.has(lead.source)) return composeDirectory(lead, options);

  const company = lead.company.name;
  const role = midSentence(lead.jobPost?.title ?? "role like that");
  const services = lead.analysis?.recommendedServices ?? [];
  const primary = services[0] ?? "workflow automation";
  const signals = lead.analysis?.signals ?? [];
  const name = firstNameOf(lead);

  const greeting = name ? `Hi ${name},` : "Hi there,";
  const opener = pick(OPENERS, lead.id)(company, role);
  const closer = pick(CLOSERS, `${lead.id}z`);

  const offer = `We build that as a fixed-scope project rather than a hire: ${midSentence(primary)}${
    services[1] ? `, ${midSentence(services[1])}` : ""
  }, and the reporting behind it. Two similar clients cut first-response time from hours to under three minutes.`;

  const evidence = signals.length > 0 ? `\n\nWhat caught my eye: ${signals[0].toLowerCase()}.` : "";

  // A link beats "let me know what suits" — it removes a round trip.
  const booking = options.bookingUrl
    ? `\n\nIf it is easier, grab a 30-minute slot directly: ${options.bookingUrl}`
    : "";

  return {
    subject: `Saw your ${role} posting`,
    body: `${greeting}\n\n${opener}\n\n${offer}${evidence}\n\n${closer}${booking}`,
  };
}
