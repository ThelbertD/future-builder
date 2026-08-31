import type { Appointment, AppointmentStatus, MeetingType } from "@/types";
import { MOCK_NOW } from "@/lib/utils";
import { LEADS_WITH_RELATIONS } from "./leads";
import { WORKSPACE_ID } from "./workspace";

const MEETING_TYPES: MeetingType[] = [
  "Discovery Call",
  "Strategy Session",
  "Demo",
  "Proposal Review",
  "Kickoff",
];

/** dayOffset from the demo clock | hour (UTC) | duration mins | status | bookedByAI */
const SCHEDULE: Array<[number, number, number, AppointmentStatus, boolean]> = [
  [-11, 14, 30, "completed", true],
  [-9, 16, 45, "completed", true],
  [-6, 13, 30, "completed", false],
  [-4, 15, 30, "no_show", true],
  [-3, 17, 60, "completed", true],
  [-1, 14, 30, "completed", true],
  [0, 21, 30, "confirmed", true],
  [1, 13, 30, "confirmed", true],
  [1, 16, 45, "scheduled", true],
  [2, 15, 30, "confirmed", false],
  [3, 14, 60, "scheduled", true],
  [5, 17, 30, "scheduled", true],
  [7, 13, 45, "scheduled", false],
  [9, 15, 30, "cancelled", true],
  [12, 16, 30, "scheduled", true],
];

const BOOKABLE_LEADS = LEADS_WITH_RELATIONS.filter((lead) =>
  ["booked", "call_completed", "proposal", "negotiation", "won", "interested", "replied"].includes(lead.status),
);

function at(dayOffset: number, hour: number): Date {
  const date = new Date(MOCK_NOW);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

export const APPOINTMENTS: Appointment[] = SCHEDULE.map(
  ([dayOffset, hour, duration, status, bookedByAI], index) => {
    const lead = BOOKABLE_LEADS[index % BOOKABLE_LEADS.length];
    const meetingType = MEETING_TYPES[index % MEETING_TYPES.length];
    const startsAt = at(dayOffset, hour);
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);

    return {
      id: `apt_${index + 1}`,
      workspaceId: WORKSPACE_ID,
      leadId: lead.id,
      companyId: lead.companyId,
      contactId: lead.contactId,
      title: `${meetingType} — ${lead.company.name}`,
      meetingType,
      status,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: index % 3 === 0 ? "Google Meet" : "Zoom",
      notes:
        index % 4 === 0
          ? "Bring the industry case study and the two-week build outline."
          : undefined,
      bookedByAI,
      createdAt: new Date(startsAt.getTime() - 4 * 86_400_000).toISOString(),
    };
  },
);

export function getAppointmentsForDay(date: Date): Appointment[] {
  const key = date.toISOString().slice(0, 10);
  return APPOINTMENTS.filter((appointment) => appointment.startsAt.slice(0, 10) === key);
}

export const UPCOMING_APPOINTMENTS: Appointment[] = APPOINTMENTS.filter(
  (appointment) =>
    new Date(appointment.startsAt) >= MOCK_NOW &&
    appointment.status !== "cancelled",
).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
