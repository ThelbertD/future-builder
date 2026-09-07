import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";

/**
 * Consulti.ai — the only source here that returns a contact.
 *
 * The job feeds answer "who is hiring"; they never publish an address, because
 * routing applications through their own platform is their product. Consulti is
 * a licensed B2B database, so it answers "who should I email" instead, and
 * returns a verified address with the record.
 *
 * Two databases are wired up:
 *   /leads/search        500M+ B2B contacts, filtered to deliverable addresses
 *   /local-leads/search  Google Maps businesses, filtered to those with email
 *
 * Both are skipped entirely unless CONSULTI_API_KEY is set, so the finder keeps
 * working on the free feeds alone.
 */
const BASE_URL = "https://app.consulti.ai/api/v1";

interface ConsultiLead {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  company_name?: string;
  company_domain?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  employees?: number;
  industry?: string;
  email_status?: string;
  verified_at?: string;
}

interface LocalLead {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  google_place_id?: string;
  place_id?: string;
}

/**
 * Our industry labels are not Consulti's. Its filters are exact-match and
 * case-sensitive, and an off-list value silently returns nothing, so anything
 * without a confident mapping is folded into the free-text query instead.
 */
const INDUSTRY_MAP: Record<string, string> = {
  "Marketing Agency": "Marketing & Advertising",
  "Home Services": "Consumer Services",
  "Health & Wellness": "Health, Wellness & Fitness",
  "Real Estate": "Real Estate",
  "Professional Services": "Professional Training & Coaching",
  "E-commerce": "Retail",
  Education: "Education Management",
  "Financial Services": "Financial Services",
  SaaS: "Computer Software",
  Construction: "Construction",
};

/** US state names, because /local-leads only accepts two-letter codes. */
const STATE_CODES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

export function hasConsultiKey(): boolean {
  return Boolean(process.env.CONSULTI_API_KEY);
}

async function post<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    signal,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${process.env.CONSULTI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Consulti rejected the API key");
  }
  if (response.status === 429) {
    throw new Error("Consulti rate limit reached");
  }
  if (!response.ok) {
    throw new Error(`Consulti responded ${response.status}`);
  }

  return (await response.json()) as T;
}

function fullName(lead: ConsultiLead): string {
  return [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
}

export const consultiB2B: SourceAdapter = {
  id: "consulti-b2b",
  name: "Consulti B2B",
  kind: "database",
  homepage: "https://app.consulti.ai",
  isAvailable: hasConsultiKey,

  async fetchJobs(query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const industry = query.industry ? INDUSTRY_MAP[query.industry] : undefined;

    // Anything not confidently mapped becomes free text rather than a filter
    // that would silently return zero.
    const freeText = [...query.keywords, !industry && query.industry ? query.industry : ""]
      .filter(Boolean)
      .join(" ")
      .trim();

    const body: Record<string, unknown> = {
      // "good" is the cold-email-grade status in their enum.
      emailStatus: "good",
      page: 1,
      size: 100,
    };

    if (freeText) body.q = freeText;
    if (industry) body.industries = [industry];
    if (query.location && query.location !== "Remote" && query.location !== "all") {
      body.countries = [query.location];
    }

    const payload = await post<{ leads?: ConsultiLead[] }>("/leads/search", body, signal);

    return (payload.leads ?? []).reduce<ScrapedJob[]>((jobs, lead) => {
      const company = lead.company_name;
      if (!company) return jobs;

      const name = fullName(lead);
      const location = [lead.city, lead.state, lead.country].filter(Boolean).join(", ");

      jobs.push({
        id: `consulti-b2b:${lead.id ?? lead.email ?? `${company}-${name}`}`,
        sourceId: "consulti-b2b",
        sourceName: "Consulti B2B",
        externalId: String(lead.id ?? lead.email ?? company),
        // The "opportunity" for a database record is the person's role.
        title: lead.job_title ?? "Decision maker",
        companyName: company,
        location: location || "Not stated",
        remote: false,
        engagementType: "Retainer",
        description: `${name || "Contact"}${lead.job_title ? `, ${lead.job_title}` : ""} at ${company}${
          lead.industry ? ` (${lead.industry})` : ""
        }${lead.employees ? `, around ${lead.employees} employees` : ""}.`,
        url: lead.linkedin_url ?? (lead.company_domain ? `https://${lead.company_domain}` : BASE_URL),
        postedAt: lead.verified_at ?? new Date().toISOString(),
        tags: [lead.industry, lead.job_title].filter((value): value is string => Boolean(value)),
        kind: "database",
        industry: lead.industry,
        employeeCount: lead.employees,
        companyUrl: lead.company_domain ? `https://${lead.company_domain}` : undefined,
        contact: name
          ? {
              fullName: name,
              email: lead.email,
              title: lead.job_title,
              linkedinUrl: lead.linkedin_url,
              emailStatus: lead.email_status,
            }
          : undefined,
      });

      return jobs;
    }, []);
  },
};

export const consultiLocal: SourceAdapter = {
  id: "consulti-local",
  name: "Consulti Local",
  kind: "database",
  homepage: "https://app.consulti.ai",
  isAvailable: hasConsultiKey,

  async fetchJobs(query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const body: Record<string, unknown> = {
      // Without this the majority of Google Maps records have no address, which
      // makes them useless for outreach.
      hasEmail: true,
      page: 1,
      size: 100,
    };

    const keywords = [...query.keywords, query.industry].filter(Boolean) as string[];
    if (keywords.length > 0) {
      body.keywords = keywords;
      body.q = keywords.join(" ");
    }

    const code = STATE_CODES[query.location?.toLowerCase() ?? ""];
    if (code) body.states = [code];

    const payload = await post<{ leads?: LocalLead[] }>("/local-leads/search", body, signal);

    return (payload.leads ?? []).reduce<ScrapedJob[]>((jobs, business) => {
      const company = business.name;
      if (!company) return jobs;

      const location = [business.city, business.state].filter(Boolean).join(", ");

      jobs.push({
        id: `consulti-local:${business.google_place_id ?? business.place_id ?? business.id ?? company}`,
        sourceId: "consulti-local",
        sourceName: "Consulti Local",
        externalId: String(business.google_place_id ?? business.place_id ?? business.id ?? company),
        title: business.category ?? "Local business",
        companyName: company,
        location: location || business.address || "Not stated",
        remote: false,
        engagementType: "Retainer",
        description: `${company}${business.category ? `, ${business.category}` : ""}${
          location ? ` in ${location}` : ""
        }.${
          business.rating ? ` Rated ${business.rating}${business.reviews ? ` across ${business.reviews} reviews` : ""}.` : ""
        }`,
        url: business.website ?? BASE_URL,
        postedAt: new Date().toISOString(),
        tags: [business.category].filter((value): value is string => Boolean(value)),
        kind: "database",
        companyUrl: business.website,
        contact: business.email
          ? {
              fullName: company,
              email: business.email,
              phone: business.phone,
              title: "Business contact",
            }
          : undefined,
      });

      return jobs;
    }, []);
  },
};
