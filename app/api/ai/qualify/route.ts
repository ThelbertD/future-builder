import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLead } from "@/lib/supabase/queries";

const bodySchema = z.object({
  leadId: z.string().min(1).max(64),
});

/**
 * Qualification runs server-side so provider keys never reach the browser.
 * The AI provider call is added in the AI phase; the response shape is final.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "A leadId is required." }, { status: 422 });
  }

  const lead = await fetchLead(parsed.data.leadId);

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (!lead.analysis) {
    return NextResponse.json({ error: "This lead has not been analysed yet." }, { status: 409 });
  }

  return NextResponse.json({
    data: {
      leadId: lead.id,
      score: lead.analysis.score,
      intent: lead.analysis.intent,
      opportunityType: lead.analysis.opportunityType,
      recommendedServices: lead.analysis.recommendedServices,
      reasoning: lead.analysis.reasoning,
      signals: lead.analysis.signals,
      risks: lead.analysis.risks,
      suggestedNextAction: lead.analysis.suggestedNextAction,
      confidence: lead.analysis.confidence,
      model: lead.analysis.model,
    },
  });
}
