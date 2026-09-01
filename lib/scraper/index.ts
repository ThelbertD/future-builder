import { scoreJob, type ScoredJob } from "@/lib/scraper/scoring";
import { arbeitnow } from "@/lib/scraper/sources/arbeitnow";
import { hackerNews } from "@/lib/scraper/sources/hacker-news";
import { jobicy } from "@/lib/scraper/sources/jobicy";
import { remoteok } from "@/lib/scraper/sources/remoteok";
import { remotive } from "@/lib/scraper/sources/remotive";
import { theMuse } from "@/lib/scraper/sources/the-muse";
import type { ScrapedJob, SearchQuery, SourceAdapter, SourceOutcome } from "@/lib/scraper/types";

/**
 * Registered sources.
 *
 * Every adapter here reads a public, key-less API that permits programmatic
 * access. Sites that forbid scraping in their terms — LinkedIn and Indeed among
 * them — are deliberately absent: they block server-side requests, and building
 * against them would put the workspace owner at risk. Adding a licensed
 * provider later is a single new file implementing SourceAdapter.
 */
export const SOURCES: SourceAdapter[] = [remotive, remoteok, arbeitnow, jobicy, theMuse, hackerNews];

const SOURCE_TIMEOUT_MS = 9_000;

export interface LeadSearchResult {
  jobs: ScoredJob[];
  outcomes: SourceOutcome[];
  /** Total found before filters, useful for explaining an empty result. */
  fetched: number;
}

/**
 * Matches on the title and tags only.
 *
 * Descriptions mention "automation" or "CRM" in passing constantly, so
 * including them returned electricians and warehouse staff for a GoHighLevel
 * search. What a company advertises in the title is what it is hiring for.
 */
function matchesKeywords(job: ScrapedJob, keywords: string[]): boolean {
  if (keywords.length === 0) return true;

  const haystack = `${job.title} ${job.tags.join(" ")}`.toLowerCase();

  return keywords.some((keyword) => {
    const tokens = keyword
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 2);

    if (tokens.length === 0) return false;

    // Either the whole phrase is present, or one token distinctive enough to
    // stand alone. "GoHighLevel Specialist" should still find a listing titled
    // "GoHighLevel Developer", while "CRM" alone stays an exact requirement.
    if (tokens.every((token) => haystack.includes(token))) return true;
    return tokens.some((token) => token.length >= 8 && haystack.includes(token));
  });
}

function matchesLocation(job: ScrapedJob, location: string): boolean {
  if (!location || location === "all") return true;
  if (location === "Remote") return job.remote;

  const haystack = job.location.toLowerCase();
  const needle = location.toLowerCase();

  // Feeds abbreviate heavily, so accept the common shorthands.
  const aliases: Record<string, string[]> = {
    "united states": ["usa", "u.s.", "us", "united states", "america", "worldwide", "anywhere"],
    "united kingdom": ["uk", "united kingdom", "england", "britain", "worldwide", "anywhere"],
    canada: ["canada", "worldwide", "anywhere"],
    australia: ["australia", "apac", "worldwide", "anywhere"],
    singapore: ["singapore", "apac", "worldwide", "anywhere"],
    "united arab emirates": ["uae", "united arab emirates", "dubai", "worldwide", "anywhere"],
  };

  const accepted = aliases[needle] ?? [needle];
  if (accepted.some((alias) => haystack.includes(alias))) return true;

  // A remote role that names no region is open to anyone; one that names a
  // different city or country is not, whatever the "remote" flag says.
  const unrestricted = /^(remote|anywhere|worldwide|global|not stated)?$/i.test(job.location.trim());
  return job.remote && unrestricted;
}

/** Same company advertising the same role twice is one opportunity. */
function dedupe(jobs: ScoredJob[]): ScoredJob[] {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = `${job.companyName.toLowerCase().trim()}::${job.title.toLowerCase().trim()}`;
    if (seen.has(key) || seen.has(job.url)) return false;
    seen.add(key);
    seen.add(job.url);
    return true;
  });
}

/**
 * Runs every source in parallel and returns scored, filtered opportunities.
 *
 * A source that fails or times out is reported in `outcomes` rather than
 * failing the whole search — one dead feed should never cost the user a result.
 */
export async function runLeadSearch(query: SearchQuery): Promise<LeadSearchResult> {
  const settled = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const jobs = await source.fetchJobs(query, AbortSignal.timeout(SOURCE_TIMEOUT_MS));
      return { source, jobs };
    }),
  );

  const outcomes: SourceOutcome[] = [];
  const collected: ScrapedJob[] = [];

  settled.forEach((result, index) => {
    const source = SOURCES[index];

    if (result.status === "fulfilled") {
      collected.push(...result.value.jobs);
      outcomes.push({
        sourceId: source.id,
        sourceName: source.name,
        count: result.value.jobs.length,
        ok: true,
      });
      return;
    }

    const message = result.reason instanceof Error ? result.reason.message : "Unavailable";
    outcomes.push({
      sourceId: source.id,
      sourceName: source.name,
      count: 0,
      ok: false,
      error: /timeout|abort/i.test(message) ? "Timed out" : message,
    });
  });

  const cutoff = Date.now() - query.postedWithinDays * 86_400_000;

  const jobs = dedupe(
    collected
      .filter((job) => new Date(job.postedAt).getTime() >= cutoff)
      .filter((job) => matchesKeywords(job, query.keywords))
      .filter((job) => matchesLocation(job, query.location))
      .map((job) => scoreJob(job, query)),
  )
    .filter((job) => job.score >= query.minScore)
    .filter((job) => !query.intent || query.intent === "all" || job.intent === query.intent)
    .sort((a, b) => b.score - a.score)
    .slice(0, query.limit ?? 60);

  return { jobs, outcomes, fetched: collected.length };
}
