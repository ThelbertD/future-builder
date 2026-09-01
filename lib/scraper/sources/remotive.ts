import { toPlainText } from "@/lib/scraper/html";
import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";
import type { EngagementType } from "@/types";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo_url?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

const ENGAGEMENT: Record<string, EngagementType> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Part-time",
  other: "Contract",
};

/** Remotive publishes a free, key-less JSON feed of remote roles. */
export const remotive: SourceAdapter = {
  id: "remotive",
  name: "Remotive",
  homepage: "https://remotive.com",

  async fetchJobs(query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const search = query.keywords[0] ?? "";
    const url = new URL("https://remotive.com/api/remote-jobs");
    if (search) url.searchParams.set("search", search);
    url.searchParams.set("limit", "100");

    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Remotive responded ${response.status}`);

    const payload = (await response.json()) as { jobs?: RemotiveJob[] };

    return (payload.jobs ?? []).map((job) => ({
      id: `remotive:${job.id}`,
      sourceId: "remotive",
      sourceName: "Remotive",
      externalId: String(job.id),
      title: job.title,
      companyName: job.company_name,
      companyLogo: job.company_logo_url,
      location: job.candidate_required_location || "Remote",
      remote: true,
      engagementType: ENGAGEMENT[job.job_type ?? "other"] ?? "Contract",
      description: toPlainText(job.description ?? ""),
      url: job.url,
      postedAt: new Date(job.publication_date).toISOString(),
      salaryText: job.salary || undefined,
      tags: (job.tags ?? []).slice(0, 12),
    }));
  },
};
