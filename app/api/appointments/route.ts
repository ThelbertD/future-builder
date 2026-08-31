import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchAppointments } from "@/lib/supabase/queries";

const createSchema = z.object({
  leadId: z.string().min(1).max(64),
  meetingType: z.enum(["Discovery Call", "Strategy Session", "Demo", "Proposal Review", "Kickoff"]),
  startsAt: z.iso.datetime(),
  durationMinutes: z.number().int().min(15).max(180).default(30),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const appointments = await fetchAppointments();
  return NextResponse.json({ data: appointments, total: appointments.length });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid appointment.", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422 },
    );
  }

  const { leadId, meetingType, startsAt, durationMinutes, notes } = parsed.data;
  const start = new Date(startsAt);

  // Persistence lands with the Supabase phase; the contract is already fixed.
  return NextResponse.json(
    {
      data: {
        id: `apt_${start.getTime()}`,
        leadId,
        meetingType,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + durationMinutes * 60_000).toISOString(),
        status: "scheduled",
        notes: notes ?? null,
      },
    },
    { status: 201 },
  );
}
