import { toPlainText } from "@/lib/scraper/html";
import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";
import type { EngagementType } from "@/types";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobLevel?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate: string;
}

/**
 * Jobicy skews commercial rather than engineering — marketing, sales and
 * operations roles — which is much closer to the work an agency sells than the
 * developer-heavy boards. Their terms ask for credit and a link to the original
 * posting, which every result row carries.
 */
const INDUSTRIES = ["marketing", "business", "sales", "supporting"] as const;

function engagementFor(types: string[] = []): EngagementType {
  const joined = types.join(" ").toLowerCase();
  if (joined.includes("contract")) return "Contract";
  if (joined.includes("freelance")) return "Freelance";
  if (joined.includes("part")) return "Part-time";
  return "Full-time";
}

export const jobicy: SourceAdapter = {
  id: "jobicy",
  name: "Jobicy",
  homepage: "https://jobicy.com",

  async fetchJobs(_query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const responses = await Promise.all(
      INDUSTRIES.map(async (industry) => {
        const url = new URL("https://jobicy.com/api/v2/remote-jobs");
        url.searchParams.set("count", "50");
        url.searchParams.set("industry", industry);

        const response = await fetch(url, { signal, cache: "no-store" });
        if (!response.ok) return [] as JobicyJob[];

        const payload = (await response.json()) as { jobs?: JobicyJob[] };
        return payload.jobs ?? [];
      }),
    );

    const seen = new Set<number>();

    return responses.flat().reduce<ScrapedJob[]>((jobs, job) => {
      if (seen.has(job.id)) return jobs;
      seen.add(job.id);

      jobs.push({
        id: `jobicy:${job.id}`,
        sourceId: "jobicy",
        sourceName: "Jobicy",
        externalId: String(job.id),
        title: job.jobTitle,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        location: job.jobGeo || "Remote",
        remote: true,
        engagementType: engagementFor(job.jobType),
        description: toPlainText(job.jobDescription || job.jobExcerpt || ""),
        url: job.url,
        postedAt: new Date(job.pubDate).toISOString(),
        tags: (job.jobIndustry ?? []).slice(0, 6),
      });

      return jobs;
    }, []);
  },
};
