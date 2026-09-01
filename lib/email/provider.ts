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

/** Gmail needs no host or port; everything else must state them. */
function smtpSettings() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) return null;

  const isGmail = /@gmail\.com$/i.test(user);
  const host = process.env.SMTP_HOST ?? (isGmail ? "smtp.gmail.com" : undefined);
  const port = Number(process.env.SMTP_PORT ?? (isGmail ? 465 : 587));

  if (!host) return null;

  return { user, password, host, port, secure: port === 465 };
}

export function emailProviderStatus(): EmailProviderStatus {
  const from = process.env.EMAIL_FROM;
  const smtp = smtpSettings();
  const resendKey = process.env.RESEND_API_KEY;
  const missing: string[] = [];

  if (!from) missing.push("EMAIL_FROM");
  else if (!FROM_PATTERN.test(from)) missing.push('EMAIL_FROM (use an address, or "Name <a@b.com>")');

  if (smtp) {
    return { configured: missing.length === 0, provider: "SMTP", from: from || undefined, missing };
  }

  if (resendKey) {
    return { configured: missing.length === 0, provider: "Resend", from: from || undefined, missing };
  }

  missing.unshift("SMTP_USER and SMTP_PASSWORD (or RESEND_API_KEY)");
  return { configured: false, provider: null, from: from || undefined, missing };
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
        error:
          "The mail server rejected those credentials. For Gmail you need an App Password, not your account password, and two-step verification must be on.",
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
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
