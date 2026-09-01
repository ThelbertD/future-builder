import { toPlainText } from "@/lib/scraper/html";
import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";

interface RemoteOkJob {
  id?: string;
  slug?: string;
  company?: string;
  company_logo?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  date?: string;
  url?: string;
  apply_url?: string;
  legal?: string;
}

function salaryText(job: RemoteOkJob): string | undefined {
  if (!job.salary_min && !job.salary_max) return undefined;
  const format = (value?: number) => (value ? `$${Math.round(value / 1000)}k` : "");
  return `${format(job.salary_min)}${job.salary_max ? ` – ${format(job.salary_max)}` : ""}`.trim();
}

/**
 * Remote OK's public feed. Their terms ask for attribution and a link back,
 * which the results table provides through the source link on every row.
 */
export const remoteok: SourceAdapter = {
  id: "remoteok",
  name: "Remote OK",
  homepage: "https://remoteok.com",

  async fetchJobs(_query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const response = await fetch("https://remoteok.com/api", {
      signal,
      cache: "no-store",
      headers: { "user-agent": "FutureBuilderAI/1.0 (+https://future-builder-eta.vercel.app)" },
    });

    if (!response.ok) throw new Error(`Remote OK responded ${response.status}`);

    const payload = (await response.json()) as RemoteOkJob[];

    return payload
      // The first element of the feed is their legal notice, not a job.
      .filter((job) => !job.legal && job.id && job.position && job.company)
      .map((job) => ({
        id: `remoteok:${job.id}`,
        sourceId: "remoteok",
        sourceName: "Remote OK",
        externalId: String(job.id),
        title: job.position!,
        companyName: job.company!,
        companyLogo: job.company_logo,
        location: job.location || "Remote",
        remote: true,
        engagementType: "Contract" as const,
        description: toPlainText(job.description ?? ""),
        url: job.url ?? job.apply_url ?? `https://remoteok.com/remote-jobs/${job.slug ?? job.id}`,
        postedAt: job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
        salaryText: salaryText(job),
        tags: (job.tags ?? []).slice(0, 12),
      }));
  },
};
