import type { EngagementType } from "@/types";

/** What the Lead Finder asks for. */
export interface SearchQuery {
  keywords: string[];
  location: string;
  industry?: string;
  service?: string;
  /** Only keep postings published within this many days. */
  postedWithinDays: number;
  minScore: number;
  intent?: string;
  limit?: number;
}

/** A hiring signal pulled from an external source, before it becomes a lead. */
export interface ScrapedJob {
  /** Stable across runs: `${sourceId}:${externalId}`. Used for de-duplication. */
  id: string;
  sourceId: string;
  sourceName: string;
  externalId: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  remote: boolean;
  engagementType: EngagementType;
  description: string;
  url: string;
  postedAt: string;
  salaryText?: string;
  tags: string[];
}

export interface SourceAdapter {
  id: string;
  name: string;
  /** Human-readable note shown in the UI when a source fails. */
  homepage: string;
  fetchJobs(query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]>;
}

export interface SourceOutcome {
  sourceId: string;
  sourceName: string;
  count: number;
  ok: boolean;
  error?: string;
}
