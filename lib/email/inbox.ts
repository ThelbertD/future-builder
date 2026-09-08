import "server-only";

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

/** Last resort for a message that carries no plain-text part. */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

/**
 * Reading the mailbox replies come back to.
 *
 * Sending was only ever half a conversation: a prospect's answer sat in Gmail
 * and the thread in here still said one message. IMAP is the right fit for the
 * setup that already exists — the same address and App Password used to send,
 * no extra service, no public webhook endpoint to expose.
 */
export interface InboundMessage {
  /** The server's Message-ID. Stored, so a reply is never imported twice. */
  externalId: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

export interface InboxStatus {
  configured: boolean;
  host: string | null;
  user?: string;
  missing: string[];
}

function credential(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;

  const withoutKey = raw.trim().replace(new RegExp(`^${name}\\s*=\\s*`), "");
  const unquoted = withoutKey.replace(/^"([^]*)"$/, "$1").replace(/^'([^]*)'$/, "$1");

  return unquoted.trim() || undefined;
}

/**
 * IMAP reuses the SMTP credentials.
 *
 * Gmail's App Password grants both, so a working sender is already a working
 * reader and there is nothing further to configure.
 */
function settings() {
  const user = credential("SMTP_USER");
  const password = credential("SMTP_PASSWORD")?.replace(/\s+/g, "");
  if (!user || !password) return null;

  const isGmail = /@gmail\.com$/i.test(user);
  const host = credential("IMAP_HOST") ?? (isGmail ? "imap.gmail.com" : undefined);
  if (!host) return null;

  return { user, password, host, port: Number(credential("IMAP_PORT") ?? 993) };
}

export function inboxStatus(): InboxStatus {
  const config = settings();

  if (!config) {
    return {
      configured: false,
      host: null,
      missing: ["SMTP_USER and SMTP_PASSWORD (IMAP_HOST too, unless it is Gmail)"],
    };
  }

  return { configured: true, host: config.host, user: config.user, missing: [] };
}

/** "Jane Doe <jane@acme.com>" and bare addresses both reduce to the address. */
function addressOf(value: string): { email: string; name?: string } | null {
  const angled = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

  if (angled) {
    const name = angled[1].replace(/^["']|["']$/g, "").trim();
    return { email: angled[2].trim().toLowerCase(), name: name || undefined };
  }

  const bare = value.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+$/.test(bare) ? { email: bare } : null;
}

/**
 * Strips the quoted history off a reply.
 *
 * Mail clients append the entire previous message. Keeping it would store our
 * own outreach back as if the prospect had written it, and the inbox preview
 * would show our words rather than their answer.
 *
 * Gmail wraps its attribution line, so "On <date> <someone>" and "wrote:" land
 * on separate lines; the whole block is matched rather than a single line.
 */
function stripQuotedReply(body: string): string {
  const withoutAttribution = body
    .replace(/^\s*On\b[\s\S]{0,200}?\bwrote:\s*$[\s\S]*/im, "")
    .replace(/^\s*-{2,}\s*Original Message\s*-{2,}[\s\S]*/im, "")
    .replace(/^\s*_{5,}\s*$[\s\S]*/m, "");

  const kept: string[] = [];

  for (const line of withoutAttribution.split(/\r?\n/)) {
    if (/^\s*>/.test(line)) continue;
    kept.push(line);
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Fetches messages received since a given time.
 *
 * Only the inbox is read, and only headers plus the plain-text part, which
 * keeps a sync cheap enough to run on demand.
 */
export async function fetchInbound(since: Date, limit = 60): Promise<InboundMessage[]> {
  const config = settings();
  if (!config) throw new Error("The mailbox is not configured.");

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.password },
    logger: false,
  });

  const messages: InboundMessage[] = [];

  await client.connect();

  try {
    const lock = await client.getMailboxLock("INBOX");

    try {
      const uids = await client.search({ since });
      if (!uids || uids.length === 0) return [];

      // Newest first, so a busy mailbox still returns the latest replies.
      const wanted = uids.slice(-limit);

      for await (const message of client.fetch(wanted, { envelope: true, source: true })) {
        const envelope = message.envelope;
        const from = envelope?.from?.[0];
        if (!from?.address) continue;

        // Real MIME parsing rather than slicing the raw source. A reply is
        // multipart with its own part headers, quoted-printable encoding and
        // often an HTML twin; hand-rolling that stored "Content-Type:" lines
        // as if the prospect had typed them.
        if (!message.source) continue;

        const parsed = await simpleParser(message.source);
        const text = parsed.text ?? (parsed.html ? htmlToText(parsed.html) : "");

        const body = stripQuotedReply(text);
        if (!body) continue;

        messages.push({
          externalId: envelope?.messageId ?? `imap:${message.uid}`,
          fromEmail: from.address.toLowerCase(),
          fromName: from.name || undefined,
          subject: envelope?.subject ?? "(no subject)",
          body: body.slice(0, 20_000),
          receivedAt: envelope?.date ? new Date(envelope.date) : new Date(),
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }

  return messages;
}

export { addressOf };
