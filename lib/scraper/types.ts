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

/**
 * Where a result came from, which changes how it is filtered and scored.
 *
 * "hiring"   — a job posting, so recency is the signal and the contact is unknown.
 * "database" — a B2B or local-business record, so the contact is the point and
 *              a publication date is meaningless.
 */
export type SourceKind = "hiring" | "database";

/** A contact carried by sources that have one. Job boards never do. */
export interface ScrapedContact {
  fullName: string;
  email?: string;
  title?: string;
  linkedinUrl?: string;
  phone?: string;
  /** Provider's deliverability verdict, when it gives one. */
  emailStatus?: string;
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
  kind: SourceKind;
  contact?: ScrapedContact;
  /** The company's own site, when the source knows it. */
  companyUrl?: string;
  industry?: string;
  employeeCount?: number;
}

export interface SourceAdapter {
  id: string;
  name: string;
  kind: SourceKind;
  /** Human-readable note shown in the UI when a source fails. */
  homepage: string;
  /** Skipped entirely when this returns false, e.g. a missing API key. */
  isAvailable?: () => boolean;
  fetchJobs(query: SearchQuery, signal: AbortSignal): Promise<ScrapedJob[]>;
}

export interface SourceOutcome {
  sourceId: string;
  sourceName: string;
  count: number;
  ok: boolean;
  error?: string;
}
