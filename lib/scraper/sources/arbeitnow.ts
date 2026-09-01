import { toPlainText } from "@/lib/scraper/html";
import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";
import type { EngagementType } from "@/types";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description?: string;
  remote?: boolean;
  url: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
}

function engagementFor(types: string[] = []): EngagementType {
  const joined = types.join(" ").toLowerCase();
  if (joined.includes("part")) return "Part-time";
  if (joined.includes("contract")) return "Contract";
  if (joined.includes("freelance")) return "Freelance";
  return "Full-time";
}

/** Arbeitnow aggregates European and remote boards through a free JSON API. */
export const arbeitnow: SourceAdapter = {
  id: "arbeitnow",
  name: "Arbeitnow",
  homepage: "https://www.arbeitnow.com",

  async fetchJobs(_query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const response = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      signal,
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Arbeitnow responded ${response.status}`);

    const payload = (await response.json()) as { data?: ArbeitnowJob[] };

    return (payload.data ?? []).map((job) => ({
      id: `arbeitnow:${job.slug}`,
      sourceId: "arbeitnow",
      sourceName: "Arbeitnow",
      externalId: job.slug,
      title: job.title,
      companyName: job.company_name,
      location: job.location || (job.remote ? "Remote" : "Not stated"),
      remote: Boolean(job.remote),
      engagementType: engagementFor(job.job_types),
      description: toPlainText(job.description ?? ""),
      url: job.url,
      postedAt: job.created_at
        ? new Date(job.created_at * 1000).toISOString()
        : new Date().toISOString(),
      tags: (job.tags ?? []).slice(0, 12),
    }));
  },
};
