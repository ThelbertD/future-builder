import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fixed clock for the bundled demo dataset.
 *
 * Mock records are generated relative to this instant so that server and client
 * renders always agree (no hydration drift) and relative labels stay stable.
 * Replace with `new Date()` once records come from Supabase.
 */
export const MOCK_NOW = new Date("2026-08-31T19:30:00.000Z");

export function hoursAgo(hours: number, from: Date = MOCK_NOW): string {
  return new Date(from.getTime() - hours * 3_600_000).toISOString();
}

export function daysAgo(days: number, from: Date = MOCK_NOW): string {
  return hoursAgo(days * 24, from);
}

export function minutesAgo(minutes: number, from: Date = MOCK_NOW): string {
  return new Date(from.getTime() - minutes * 60_000).toISOString();
}

export function hoursFromNow(hours: number, from: Date = MOCK_NOW): string {
  return new Date(from.getTime() + hours * 3_600_000).toISOString();
}

/** Compact "2h ago" / "in 3d" style label, anchored to the demo clock. */
export function formatRelative(iso: string, from: Date = MOCK_NOW): string {
  const diff = new Date(iso).getTime() - from.getTime();
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let label: string;
  if (abs < minute) label = "just now";
  else if (abs < hour) label = `${Math.round(abs / minute)}m`;
  else if (abs < day) label = `${Math.round(abs / hour)}h`;
  else if (abs < 30 * day) label = `${Math.round(abs / day)}d`;
  else label = `${Math.round(abs / (30 * day))}mo`;

  if (label === "just now") return label;
  return diff < 0 ? `${label} ago` : `in ${label}`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(value: number, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDelta(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Deterministic PRNG so generated demo data never changes between renders. */
export function seededRandom(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Client-side identifier for records created optimistically before they reach
 * the database. Lives outside components so render stays pure.
 */
export function createLocalId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Current instant as an ISO string. Kept out of component bodies. */
export function nowIso(): string {
  return new Date().toISOString();
}
