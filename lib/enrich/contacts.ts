import "server-only";

import { slugify } from "@/lib/utils";

/**
 * Contact discovery.
 *
 * Job boards never publish a contact address — that is their business model —
 * so the address has to come from the company's own website, where they have
 * chosen to publish it. This reads the pages a company points the public at
 * (home, contact, about) and takes the addresses printed there.
 *
 * What this is not: it does not guess addresses from name patterns. An
 * unverified guess bounces, and bounces are what wreck a sending domain.
 */
export interface DiscoveredContact {
  email: string;
  domain: string;
  /** Every address found, best first. */
  candidates: string[];
  source: string;
}

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Addresses that are never a person, and file names that look like addresses. */
const REJECT = [
  /^no-?reply@/i,
  /^do-?not-?reply@/i,
  /^postmaster@/i,
  /^abuse@/i,
  /^privacy@/i,
  /^legal@/i,
  /@(example|test|domain|email|yourdomain|company)\.(com|org)$/i,
  /@(sentry|wixpress|godaddy|squarespace|shopify|cloudflare|googlemail|schema)\./i,
  /\.(png|jpe?g|gif|svg|webp|css|js)$/i,
  /^[a-f0-9]{16,}@/i,
];

/** Ranked: a named inbox beats a shared one, a shared one beats nothing. */
const PREFERRED = [/^(hello|hi|contact|info|team|sales|newbusiness|new\.business|partnerships)@/i];

const PAGES = ["", "/contact", "/contact-us", "/about", "/about-us"];

function isPlausible(email: string): boolean {
  return !REJECT.some((pattern) => pattern.test(email));
}

function rank(emails: string[], domain: string): string[] {
  const unique = Array.from(new Set(emails.map((email) => email.toLowerCase())));

  return unique.sort((a, b) => {
    // Same-domain addresses first: a gmail address on a company site is
    // usually a partner, not the company.
    const aOwn = a.endsWith(`@${domain}`) ? 0 : 1;
    const bOwn = b.endsWith(`@${domain}`) ? 0 : 1;
    if (aOwn !== bOwn) return aOwn - bOwn;

    const aPreferred = PREFERRED.some((pattern) => pattern.test(a)) ? 0 : 1;
    const bPreferred = PREFERRED.some((pattern) => pattern.test(b)) ? 0 : 1;
    if (aPreferred !== bPreferred) return aPreferred - bPreferred;

    return a.length - b.length;
  });
}

async function fetchText(url: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal,
      cache: "no-store",
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; FutureBuilderAI/1.0)",
        accept: "text/html",
      },
    });

    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html")) return null;

    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Finds the company's website.
 *
 * Uses an explicit URL when the posting carried one, otherwise tries the
 * obvious domains and keeps one only if it resolves and mentions the company.
 */
export async function resolveDomain(
  companyName: string,
  hintUrl: string | undefined,
  signal: AbortSignal,
): Promise<string | null> {
  if (hintUrl) {
    try {
      const host = new URL(hintUrl).hostname.replace(/^www\./, "");
      // Job board hosts are not company websites.
      if (!/(remotive|remoteok|arbeitnow|jobicy|themuse|ycombinator|greenhouse|lever)\./i.test(host)) {
        return host;
      }
    } catch {
      /* fall through to guessing */
    }
  }

  const slug = slugify(companyName).replace(/-/g, "");
  if (slug.length < 3) return null;

  for (const candidate of [`${slug}.com`, `${slug}.io`, `${slug}.co`]) {
    const html = await fetchText(`https://${candidate}`, signal);
    if (!html) continue;

    // Guard against parked domains that resolve for anything.
    const words = companyName.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    const body = html.toLowerCase();
    if (words.length === 0 || words.some((word) => body.includes(word))) return candidate;
  }

  return null;
}

export async function discoverContact(
  companyName: string,
  hintUrl?: string,
  timeoutMs = 12_000,
): Promise<DiscoveredContact | null> {
  const signal = AbortSignal.timeout(timeoutMs);

  const domain = await resolveDomain(companyName, hintUrl, signal);
  if (!domain) return null;

  const found: string[] = [];
  let sourcePage = `https://${domain}`;

  for (const path of PAGES) {
    if (found.length > 0 && path !== "") break;

    const url = `https://${domain}${path}`;
    const html = await fetchText(url, signal);
    if (!html) continue;

    const matches = (html.match(EMAIL_PATTERN) ?? []).filter(isPlausible);
    if (matches.length > 0) {
      found.push(...matches);
      sourcePage = url;
    }
  }

  const candidates = rank(found, domain);
  if (candidates.length === 0) return null;

  return { email: candidates[0], domain, candidates: candidates.slice(0, 5), source: sourcePage };
}
