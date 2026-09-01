import { toPlainText } from "@/lib/scraper/html";
import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";
import type { EngagementType } from "@/types";

interface MuseJob {
  id: number;
  name: string;
  contents?: string;
  type?: string;
  publication_date: string;
  short_name?: string;
  locations?: Array<{ name: string }>;
  categories?: Array<{ name: string }>;
  levels?: Array<{ name: string }>;
  tags?: Array<{ name: string }>;
  refs?: { landing_page?: string };
  company?: { id?: number; name?: string; short_name?: string };
}

const ENGAGEMENT: Record<string, EngagementType> = {
  "Full Time": "Full-time",
  "Part Time": "Part-time",
  Internship: "Part-time",
  Temporary: "Contract",
  Freelance: "Freelance",
};

/**
 * The Muse aggregates several hundred thousand postings from named employers,
 * including plenty that are not remote-tech, which is where the other feeds are
 * thin. Free and key-less, three pages deep to stay inside the request budget.
 */
const PAGES = [1, 2, 3];

export const theMuse: SourceAdapter = {
  id: "themuse",
  name: "The Muse",
  homepage: "https://www.themuse.com",

  async fetchJobs(query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const responses = await Promise.all(
      PAGES.map(async (page) => {
        const url = new URL("https://www.themuse.com/api/public/jobs");
        url.searchParams.set("page", String(page));

        // The API filters by category, not free text, so keywords are applied
        // by the shared matcher once everything is collected.
        if (query.location && query.location !== "Remote" && query.location !== "all") {
          url.searchParams.set("location", query.location);
        }

        const response = await fetch(url, { signal, cache: "no-store" });
        if (!response.ok) return [] as MuseJob[];

        const payload = (await response.json()) as { results?: MuseJob[] };
        return payload.results ?? [];
      }),
    );

    return responses.flat().reduce<ScrapedJob[]>((jobs, job) => {
      const company = job.company?.name;
      const landing = job.refs?.landing_page;
      if (!company || !landing) return jobs;

      const locations = (job.locations ?? []).map((entry) => entry.name);
      const remote = locations.some((name) => /flexible|remote/i.test(name));

      jobs.push({
        id: `themuse:${job.id}`,
        sourceId: "themuse",
        sourceName: "The Muse",
        externalId: String(job.id),
        title: job.name,
        companyName: company,
        location: locations[0] ?? "Not stated",
        remote,
        engagementType: ENGAGEMENT[job.type ?? ""] ?? "Full-time",
        description: toPlainText(job.contents ?? ""),
        url: landing,
        postedAt: new Date(job.publication_date).toISOString(),
        tags: [
          ...(job.categories ?? []).map((entry) => entry.name),
          ...(job.levels ?? []).map((entry) => entry.name),
        ].slice(0, 8),
      });

      return jobs;
    }, []);
  },
};
