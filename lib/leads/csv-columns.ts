import type { LeadWithRelations } from "@/types";

/**
 * The lead fields a CSV can carry.
 *
 * Export and import read the same list, which is what makes a file exported
 * here re-importable: the headers written out are exactly the names the mapper
 * recognises, so a round trip needs no manual mapping at all.
 */
export type LeadCsvField =
  | "companyName"
  | "website"
  | "industry"
  | "location"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "contactTitle"
  | "opportunity"
  | "source"
  | "score"
  | "intent"
  | "status"
  | "estimatedValue"
  | "tags"
  | "notes";

export interface LeadCsvColumn {
  field: LeadCsvField;
  /** The header written on export, and the name matched on import. */
  header: string;
  /** Other headers seen in the wild that mean the same thing. */
  aliases: string[];
  required?: boolean;
  read: (lead: LeadWithRelations) => string | number;
}

export const LEAD_CSV_COLUMNS: LeadCsvColumn[] = [
  {
    field: "companyName",
    header: "Company",
    aliases: ["company name", "organisation", "organization", "account", "business", "business name"],
    required: true,
    read: (lead) => lead.company.name,
  },
  {
    field: "website",
    header: "Website",
    aliases: ["url", "site", "domain", "company website"],
    read: (lead) => lead.company.website ?? "",
  },
  {
    field: "industry",
    header: "Industry",
    aliases: ["sector", "vertical", "category"],
    read: (lead) => lead.company.industry ?? "",
  },
  {
    field: "location",
    header: "Location",
    aliases: ["city", "address", "region", "country"],
    read: (lead) => lead.company.location ?? "",
  },
  {
    field: "contactName",
    header: "Contact Name",
    aliases: ["contact", "name", "full name", "person"],
    read: (lead) => lead.contact?.fullName ?? "",
  },
  {
    field: "contactEmail",
    header: "Contact Email",
    aliases: ["email", "email address", "e-mail", "work email"],
    read: (lead) => lead.contact?.email ?? "",
  },
  {
    field: "contactPhone",
    header: "Contact Phone",
    aliases: ["phone", "telephone", "mobile", "phone number"],
    read: (lead) => lead.contact?.phone ?? "",
  },
  {
    field: "contactTitle",
    header: "Contact Title",
    aliases: ["title", "job title", "role", "position"],
    read: (lead) => lead.contact?.title ?? "",
  },
  {
    field: "opportunity",
    header: "Opportunity",
    aliases: ["job title", "opening", "role", "posting", "requirement"],
    read: (lead) => lead.jobPost?.title ?? "",
  },
  {
    field: "source",
    header: "Source",
    aliases: ["lead source", "channel", "origin"],
    read: (lead) => lead.source,
  },
  {
    field: "score",
    header: "Score",
    aliases: ["ai score", "lead score", "rating"],
    read: (lead) => lead.score,
  },
  {
    field: "intent",
    header: "Intent",
    aliases: ["intent level", "priority"],
    read: (lead) => lead.intent,
  },
  {
    field: "status",
    header: "Status",
    aliases: ["stage", "state"],
    read: (lead) => lead.status,
  },
  {
    field: "estimatedValue",
    header: "Estimated Value",
    aliases: ["value", "deal value", "amount", "revenue"],
    read: (lead) => lead.estimatedValue,
  },
  {
    field: "tags",
    header: "Tags",
    aliases: ["labels", "services"],
    read: (lead) => lead.tags.join("; "),
  },
  {
    field: "notes",
    header: "Notes",
    aliases: ["note", "comment", "description"],
    read: (lead) => lead.notes ?? "",
  },
];

export const LEAD_CSV_HEADERS = LEAD_CSV_COLUMNS.map((column) => column.header);

/**
 * Guesses which field a CSV header refers to.
 *
 * Matching is on the header's own name and its aliases, ignoring case,
 * punctuation and spacing, so "Contact e-mail", "contact_email" and "EMAIL"
 * all land on the same field. A guess is only ever a starting point: the
 * mapping screen shows every choice and lets it be overridden.
 */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function guessField(header: string, taken: Set<LeadCsvField>): LeadCsvField | null {
  const needle = normalise(header);
  if (!needle) return null;

  for (const column of LEAD_CSV_COLUMNS) {
    if (taken.has(column.field)) continue;
    if (normalise(column.header) === needle) return column.field;
  }

  for (const column of LEAD_CSV_COLUMNS) {
    if (taken.has(column.field)) continue;
    if (column.aliases.some((alias) => normalise(alias) === needle)) return column.field;
  }

  return null;
}
