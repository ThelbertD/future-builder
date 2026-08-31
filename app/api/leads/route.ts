import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLeads } from "@/lib/supabase/queries";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  intent: z.enum(["hot", "high", "medium", "low"]).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const { q, status, intent, minScore, limit } = parsed.data;
  const leads = await fetchLeads();

  const filtered = leads.filter((lead) => {
    if (status && lead.status !== status) return false;
    if (intent && lead.intent !== intent) return false;
    if (minScore !== undefined && lead.score < minScore) return false;
    if (!q) return true;
    return `${lead.company.name} ${lead.jobPost?.title ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  return NextResponse.json({
    data: filtered.slice(0, limit).map((lead) => ({
      id: lead.id,
      company: lead.company.name,
      opportunity: lead.jobPost?.title ?? null,
      source: lead.source,
      score: lead.score,
      intent: lead.intent,
      status: lead.status,
      estimatedValue: lead.estimatedValue,
      updatedAt: lead.updatedAt,
    })),
    total: filtered.length,
  });
}
