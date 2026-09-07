import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";

/**
 * OpenStreetMap local businesses, via the Overpass API.
 *
 * This is the free, open counterpart to a paid Google Maps lead database: real
 * local businesses with the contact details their owners published — email,
 * phone, website, address. No key, no quota, ODbL-licensed data.
 *
 * It is the only source here that finds companies by what they *are* rather
 * than by what they are hiring for, which is what makes it the right fit for
 * agencies, clinics, trades and other local service businesses.
 *
 * Coverage is uneven: roughly one in ten records carries an email outright and
 * closer to half carry a website, which contact discovery can then read. That
 * is honest for volunteer-maintained data, and it costs nothing.
 */
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Industry to OSM selectors.
 *
 * OSM tags what a business does, so these are far more precise than a keyword
 * search over free text.
 */
const INDUSTRY_SELECTORS: Record<string, string[]> = {
  "Marketing Agency": ['["office"="advertising_agency"]', '["office"="marketing"]'],
  "Home Services": [
    '["craft"="plumber"]',
    '["craft"="electrician"]',
    '["craft"="hvac"]',
    '["craft"="roofer"]',
    '["craft"="carpenter"]',
    '["craft"="painter"]',
  ],
  "Health & Wellness": [
    '["amenity"="dentist"]',
    '["amenity"="doctors"]',
    '["healthcare"="physiotherapist"]',
    '["leisure"="fitness_centre"]',
  ],
  "Real Estate": ['["office"="estate_agent"]'],
  "Professional Services": ['["office"="lawyer"]', '["office"="accountant"]', '["office"="consulting"]'],
  "Financial Services": ['["office"="financial"]', '["office"="insurance"]', '["office"="accountant"]'],
  Construction: ['["craft"="builder"]', '["office"="architect"]', '["craft"="carpenter"]'],
  SaaS: ['["office"="it"]'],
  Education: ['["office"="educational_institution"]', '["amenity"="driving_school"]'],
  "E-commerce": ['["shop"="wholesale"]'],
};

/** Everything commercial, for when no industry is chosen. */
const DEFAULT_SELECTORS = [
  '["office"="advertising_agency"]',
  '["office"="estate_agent"]',
  '["office"="consulting"]',
  '["office"="it"]',
  '["craft"="plumber"]',
  '["craft"="electrician"]',
];

/**
 * Areas Overpass can resolve.
 *
 * A whole-country query for somewhere the size of the US times out, so a region
 * is required there. Smaller countries are fine as a single area.
 */
const COUNTRY_CODES: Record<string, string> = {
  "united states": "US",
  canada: "CA",
  "united kingdom": "GB",
  australia: "AU",
  singapore: "SG",
  "united arab emirates": "AE",
};

const LARGE_COUNTRIES = new Set(["US", "CA", "AU"]);

function buildQuery(query: SearchQuery): string | null {
  const country = COUNTRY_CODES[query.location?.toLowerCase() ?? ""];
  const region = query.region?.trim();

  let area: string;

  if (region) {
    // A two-letter code is a subdivision; anything longer is a place name.
    area = /^[A-Za-z]{2}$/.test(region)
      ? `area["ISO3166-2"="${(country ?? "US").toUpperCase()}-${region.toUpperCase()}"]->.a;`
      : `area["name"="${region.replace(/"/g, "")}"]->.a;`;
  } else if (country && !LARGE_COUNTRIES.has(country)) {
    area = `area["ISO3166-1"="${country}"]->.a;`;
  } else {
    // No region for a large country would scan the whole continent.
    return null;
  }

  const selectors = query.industry
    ? (INDUSTRY_SELECTORS[query.industry] ?? DEFAULT_SELECTORS)
    : DEFAULT_SELECTORS;

  // Tag selectors only. A case-insensitive name regex across a whole state
  // scans every named object in it and reliably times the query out, so
  // targeting is done by category, which is the thing OSM tags well anyway.
  const byTag = selectors.map((selector) => `  nwr${selector}(area.a);`);

  return ["[out:json][timeout:25];", area, "(", ...byTag, ");", "out center 200;"].join("\n");
}

function tag(tags: Record<string, string>, key: string): string | undefined {
  return tags[key] || tags[`contact:${key}`] || undefined;
}

/**
 * Readable names for the categories these selectors return.
 *
 * Title-casing a raw tag value is wrong more often than it looks: "it" becomes
 * "It", which reached outreach as "hiring a it". These are named the way
 * somebody would actually say them.
 */
const CATEGORY_LABELS: Record<string, string> = {
  it: "IT services",
  hvac: "HVAC contractor",
  advertising_agency: "Advertising agency",
  marketing: "Marketing agency",
  estate_agent: "Estate agency",
  consulting: "Consultancy",
  financial: "Financial services",
  insurance: "Insurance brokerage",
  accountant: "Accountancy",
  lawyer: "Law firm",
  architect: "Architecture practice",
  educational_institution: "Education provider",
  driving_school: "Driving school",
  fitness_centre: "Gym",
  doctors: "Medical practice",
  dentist: "Dental practice",
  physiotherapist: "Physiotherapy practice",
  wholesale: "Wholesaler",
};

function describeCategory(value: string): string {
  return (
    CATEGORY_LABELS[value] ?? value.replace(/_/g, " ").replace(/^\w/, (character) => character.toUpperCase())
  );
}

export const openStreetMap: SourceAdapter = {
  id: "openstreetmap",
  name: "OpenStreetMap",
  kind: "database",
  homepage: "https://www.openstreetmap.org",
  // Overpass is slower than a JSON feed; it is worth the wait for contacts.
  timeoutMs: 30_000,

  async fetchJobs(query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const body = buildQuery(query);

    if (!body) {
      throw new Error("Add a region (for example FL or CA) to search local businesses");
    }

    let payload: { elements?: OverpassElement[] } | null = null;
    let lastError = "Overpass unavailable";

    // The public instances rate-limit independently, so fall through to the mirror.
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body,
          signal,
          cache: "no-store",
          // Overpass rejects the text/plain content type that fetch infers from a
          // string body with a 406, and refuses requests with no user agent, so
          // both have to be set explicitly.
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "user-agent": "NexusOS/1.0 (+https://future-builder-eta.vercel.app)",
          },
        });
        if (!response.ok) {
          // The public instances share a small concurrency budget, so a busy
          // moment is normal rather than a fault.
          lastError =
            response.status === 429 || response.status === 504
              ? "Busy right now, try again in a minute"
              : `Overpass responded ${response.status}`;
          continue;
        }

        const parsed = (await response.json()) as {
          elements?: OverpassElement[];
          remark?: string;
        };

        // Overpass reports an exhausted query budget as a 200 with a remark,
        // not an error status.
        if (parsed.remark && /timed out|out of memory/i.test(parsed.remark)) {
          lastError = "Query too broad for this region, narrow the industry";
          continue;
        }

        payload = parsed;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError;
      }
    }

    if (!payload) throw new Error(lastError);

    return (payload.elements ?? []).reduce<ScrapedJob[]>((jobs, element) => {
      const tags = element.tags ?? {};
      const name = tags.name;
      if (!name) return jobs;

      const email = tag(tags, "email");
      const website = tag(tags, "website");
      const phone = tag(tags, "phone");

      // A record with no way to reach the business is not a lead.
      if (!email && !website && !phone) return jobs;

      const city = tags["addr:city"];
      const state = tags["addr:state"];
      const location = [city, state].filter(Boolean).join(", ");
      const category =
        tags.office ?? tags.craft ?? tags.shop ?? tags.amenity ?? tags.healthcare ?? "business";
      const label = describeCategory(category);
      // Mid-sentence the label needs to be lower case, except where it is an
      // initialism: "an IT services firm", not "an it services firm".
      const readable = /^[A-Z]{2,}/.test(label) ? label : label.toLowerCase();

      jobs.push({
        id: `openstreetmap:${element.type}/${element.id}`,
        sourceId: "openstreetmap",
        sourceName: "OpenStreetMap",
        externalId: `${element.type}/${element.id}`,
        title: label,
        companyName: name,
        location: location || state || "Not stated",
        remote: false,
        engagementType: "Retainer",
        description: `${name} is a ${readable}${location ? ` in ${location}` : ""}.${
          website ? ` Website: ${website}.` : ""
        }${phone ? ` Phone: ${phone}.` : ""}`,
        url: website ?? `https://www.openstreetmap.org/${element.type}/${element.id}`,
        postedAt: new Date().toISOString(),
        tags: [readable, city].filter((value): value is string => Boolean(value)),
        kind: "database",
        companyUrl: website,
        industry: readable,
        contact: email
          ? { fullName: name, email, phone, title: "Business contact" }
          : phone
            ? { fullName: name, phone, title: "Business contact" }
            : undefined,
      });

      return jobs;
    }, []);
  },
};
