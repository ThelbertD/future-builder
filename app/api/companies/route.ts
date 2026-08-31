import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchCompanies } from "@/lib/supabase/queries";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(60).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const { q, industry, limit } = parsed.data;
  const companies = await fetchCompanies();

  const filtered = companies.filter((company) => {
    if (industry && company.industry !== industry) return false;
    if (!q) return true;
    return `${company.name} ${company.industry} ${company.location}`.toLowerCase().includes(q.toLowerCase());
  });

  return NextResponse.json({ data: filtered.slice(0, limit), total: filtered.length });
}
