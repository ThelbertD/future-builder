import "server-only";

/**
 * Outbound email.
 *
 * Credentials live in server-only environment variables, never in the database:
 * the integrations table is readable by every workspace member, so an API key
 * stored there would be one `select` away from anyone you invite.
 *
 * Resend is the default because it authenticates with a single key and needs no
 * OAuth dance. Another provider is a new `send` implementation behind the same
 * interface.
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
  provider: string;
  from?: string;
  /** What is missing, for the integrations page to show. */
  missing: string[];
}

const FROM_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$|^.+<[^@\s]+@[^@\s.]+\.[^@\s]+>$/;

export function emailProviderStatus(): EmailProviderStatus {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const missing: string[] = [];

  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("EMAIL_FROM");
  else if (!FROM_PATTERN.test(from)) missing.push("EMAIL_FROM (must be an address, or \"Name <a@b.com>\")");

  return {
    configured: missing.length === 0,
    provider: "Resend",
    from: from || undefined,
    missing,
  };
}

/** Plain text to minimal HTML: outreach is prose, not a newsletter. */
function toHtml(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px">${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const status = emailProviderStatus();

  if (!status.configured) {
    return { ok: false, error: `Email is not configured. Missing: ${status.missing.join(", ")}.` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: status.from,
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

      // Provider errors are usually actionable, so pass the reason through.
      return {
        ok: false,
        error: detail?.message ?? `The email provider responded ${response.status}.`,
      };
    }

    const payload = (await response.json()) as { id?: string };
    return { ok: true, id: payload.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: /timeout|abort/i.test(message) ? "The email provider timed out." : message };
  }
}
