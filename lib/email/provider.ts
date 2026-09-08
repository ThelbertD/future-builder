import "server-only";

import nodemailer from "nodemailer";

/**
 * Outbound email.
 *
 * Two backends behind one interface:
 *
 * - SMTP (Gmail and anything else that speaks it). Chosen when SMTP_USER and
 *   SMTP_PASSWORD are set. This is the only way to send *as* a @gmail.com
 *   address: an API provider cannot, because sending from a domain requires
 *   DNS records on a domain you own, and gmail.com is not yours.
 * - Resend, for when you move to your own domain, which is where deliverability
 *   for cold outreach actually lives.
 *
 * Credentials come from server-only environment variables, never the database:
 * the integrations table is readable by every workspace member.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface EmailProviderStatus {
  configured: boolean;
  /** "SMTP", "Resend", or null when nothing is set up. */
  provider: string | null;
  from?: string;
  /** What is missing, named by variable, for the integrations page. */
  missing: string[];
}

const FROM_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$|^.+<[^@\s]+@[^@\s.]+\.[^@\s]+>$/;

/**
 * Reads a credential the way a hosting dashboard tends to store it.
 *
 * Three things routinely survive a copy and paste into an environment variable,
 * and all three produce a 535 that looks exactly like a wrong password:
 *
 *  - the variable's own name, when a whole `KEY=value` line goes into the value
 *    box rather than just the value
 *  - surrounding quotes
 *  - leading or trailing whitespace
 *
 * None of them can appear in a legitimate value here, so all three come off. A
 * credential that silently means something other than what the dashboard
 * appears to say is worse than one that is merely absent.
 */
function credential(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;

  const withoutKey = raw.trim().replace(new RegExp(`^${name}\\s*=\\s*`), "");
  const unquoted = withoutKey.replace(/^"([^]*)"$/, "$1").replace(/^'([^]*)'$/, "$1");

  return unquoted.trim() || undefined;
}

/**
 * Exactly one address, and nothing else.
 *
 * SMTP_USER has arrived as "desolocthelbert3@gmail.com@gmail.com" — a doubled
 * domain that the mail server can only answer with the same 535 a wrong
 * password gives. That is worth catching here, where the fault can be named,
 * rather than after a round trip that blames the password.
 */
const ADDRESS_PATTERN = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

/** Gmail needs no host or port; everything else must state them. */
function smtpSettings() {
  const user = credential("SMTP_USER");
  // Gmail displays an App Password in four groups of four; it ignores the
  // spaces on login, so accept the value either way.
  const password = credential("SMTP_PASSWORD")?.replace(/\s+/g, "");
  if (!user || !password) return null;

  const isGmail = /@gmail\.com$/i.test(user);
  const host = credential("SMTP_HOST") ?? (isGmail ? "smtp.gmail.com" : undefined);
  const port = Number(credential("SMTP_PORT") ?? (isGmail ? 465 : 587));

  if (!host) return null;

  return { user, password, host, port, secure: port === 465 };
}

export function emailProviderStatus(): EmailProviderStatus {
  const from = credential("EMAIL_FROM");
  const smtp = smtpSettings();
  const resendKey = credential("RESEND_API_KEY");
  const missing: string[] = [];

  if (!from) missing.push("EMAIL_FROM");
  else if (!FROM_PATTERN.test(from)) missing.push('EMAIL_FROM (use an address, or "Name <a@b.com>")');

  // A malformed sign-in address is indistinguishable from a wrong password once
  // the server has answered, so it is reported before anything is attempted.
  const user = credential("SMTP_USER");
  if (user && !ADDRESS_PATTERN.test(user)) {
    missing.push(`SMTP_USER (currently "${user}", which is not one email address)`);
    return { configured: false, provider: "SMTP", from: from || undefined, missing };
  }

  if (smtp) {
    return { configured: missing.length === 0, provider: "SMTP", from: from || undefined, missing };
  }

  if (resendKey) {
    return { configured: missing.length === 0, provider: "Resend", from: from || undefined, missing };
  }

  missing.unshift("SMTP_USER and SMTP_PASSWORD (or RESEND_API_KEY)");
  return { configured: false, provider: null, from: from || undefined, missing };
}

/**
 * Names the credentials a rejected login actually used.
 *
 * A 535 says only "wrong", never "wrong which" — and the usual causes are
 * invisible from the outside: the account is not the one you think, or the
 * password belongs to an older App Password. Enough of each is shown to compare
 * against the account without putting a working secret on screen: the address in
 * full, and the password's length with its first and last two characters, which
 * identifies it without being usable.
 */
function describeCredentials(settings: { user: string; password: string }): string {
  const { user, password } = settings;
  const fingerprint =
    password.length <= 4
      ? `${password.length} characters`
      : `${password.length} characters, ${password.slice(0, 2)}…${password.slice(-2)}`;

  return `${user} with a password of ${fingerprint}`;
}

/** Plain text to minimal HTML: outreach is prose, not a newsletter. */
function toHtml(body: string): string {
  const escaped = body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px">${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function sendViaSmtp(message: EmailMessage, from: string): Promise<SendResult> {
  const settings = smtpSettings();
  if (!settings) return { ok: false, error: "SMTP is not configured." };

  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.password },
  });

  try {
    const result = await transport.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.body,
      html: toHtml(message.body),
      replyTo: message.replyTo,
    });

    return { ok: true, id: result.messageId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";

    // The two failures worth naming, because the fix is specific.
    if (/invalid login|username and password not accepted|535/i.test(detail)) {
      return {
        ok: false,
        error: `The mail server rejected the credentials this deployment is using: ${describeCredentials(
          settings,
        )}. Compare that against the App Password on the account and update SMTP_USER / SMTP_PASSWORD where this is running, then redeploy — a changed variable does not reach a build that already exists.`,
      };
    }
    if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(detail)) {
      return { ok: false, error: "Could not reach the mail server. Check the host and port." };
    }

    return { ok: false, error: detail };
  } finally {
    transport.close();
  }
}

async function sendViaResend(message: EmailMessage, from: string): Promise<SendResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${credential("RESEND_API_KEY")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.body,
        html: toHtml(message.body),
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { message?: string } | null;
      return { ok: false, error: detail?.message ?? `The email provider responded ${response.status}.` };
    }

    const payload = (await response.json()) as { id?: string };
    return { ok: true, id: payload.id };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: /timeout|abort/i.test(detail) ? "The email provider timed out." : detail };
  }
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const status = emailProviderStatus();

  if (!status.configured || !status.from) {
    return { ok: false, error: `Email is not configured. Missing: ${status.missing.join(", ")}.` };
  }

  return status.provider === "SMTP"
    ? sendViaSmtp(message, status.from)
    : sendViaResend(message, status.from);
}
