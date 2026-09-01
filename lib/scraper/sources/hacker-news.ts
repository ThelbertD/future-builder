import { toPlainText } from "@/lib/scraper/html";
import type { ScrapedJob, SearchQuery, SourceAdapter } from "@/lib/scraper/types";
import type { EngagementType } from "@/types";

interface AlgoliaHit {
  objectID: string;
  title?: string;
  comment_text?: string;
  created_at?: string;
  author?: string;
  story_id?: number;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
}

/**
 * The monthly "Ask HN: Who is hiring?" thread is one of the densest sources of
 * companies hiring contractors, and Algolia exposes it through a free API.
 *
 * Posts follow a loose convention on the first line:
 *   COMPANY | ROLE | LOCATION | REMOTE | CONTRACT
 * so the parser is deliberately conservative: anything that does not look like
 * that shape is skipped rather than guessed at.
 */
function parseFirstLine(comment: string): { company: string; rest: string[] } | null {
  const firstLine = comment.split("\n").find((line) => line.trim().length > 0);
  if (!firstLine) return null;

  const parts = firstLine
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  // Entries frequently append a URL to the company name, or use a URL as one of
  // the pipe-separated fields. Neither is a company name or a job title.
  const isUrl = (value: string) =>
    /^(https?:\/\/|www\.)/i.test(value) || /\.(com|io|ai|co|dev|us|org|net)\b/i.test(value);

  const company = parts[0]
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/www\.\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!company || company.length > 60) return null;

  const rest = parts.slice(1).filter((part) => !isUrl(part));
  if (rest.length === 0) return null;

  return { company, rest };
}

function engagementFor(text: string): EngagementType {
  const lower = text.toLowerCase();
  if (lower.includes("contract")) return "Contract";
  if (lower.includes("freelance")) return "Freelance";
  if (lower.includes("part-time") || lower.includes("part time")) return "Part-time";
  return "Full-time";
}

async function latestHiringStoryId(signal: AbortSignal): Promise<number | null> {
  const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
  url.searchParams.set("query", "Ask HN: Who is hiring?");
  url.searchParams.set("tags", "story,author_whoishiring");
  url.searchParams.set("hitsPerPage", "1");

  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Hacker News responded ${response.status}`);

  const payload = (await response.json()) as AlgoliaResponse;
  const hit = payload.hits[0];
  return hit ? Number(hit.objectID) : null;
}

export const hackerNews: SourceAdapter = {
  id: "hackernews",
  name: "Hacker News",
  homepage: "https://news.ycombinator.com",

  async fetchJobs(_query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]> {
    const storyId = await latestHiringStoryId(signal);
    if (!storyId) return [];

    const url = new URL("https://hn.algolia.com/api/v1/search");
    url.searchParams.set("tags", `comment,story_${storyId}`);
    url.searchParams.set("hitsPerPage", "100");

    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Hacker News responded ${response.status}`);

    const payload = (await response.json()) as AlgoliaResponse;
    const jobs: ScrapedJob[] = [];

    for (const hit of payload.hits) {
      const comment = toPlainText(hit.comment_text ?? "", 1600);
      const parsed = parseFirstLine(comment);
      if (!parsed) continue;

      const meta = parsed.rest.join(" | ");
      const remote = /remote/i.test(meta);

      jobs.push({
        id: `hackernews:${hit.objectID}`,
        sourceId: "hackernews",
        sourceName: "Hacker News",
        externalId: hit.objectID,
        title: parsed.rest[0] ?? "Hiring",
        companyName: parsed.company,
        location: remote ? "Remote" : (parsed.rest[1] ?? "Not stated"),
        remote,
        engagementType: engagementFor(meta),
        description: comment,
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        postedAt: hit.created_at ? new Date(hit.created_at).toISOString() : new Date().toISOString(),
        tags: ["who-is-hiring"],
      });
    }

    return jobs;
  },
};
