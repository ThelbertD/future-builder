import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";

import { AppointmentCalendar } from "@/components/appointments/appointment-calendar";
import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { getActiveWorkspace } from "@/lib/supabase/auth";
import { fetchAppointments, fetchLeads } from "@/lib/supabase/queries";
import { nowIso, nowMs } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const [appointments, leads, workspace] = await Promise.all([
    fetchAppointments(),
    fetchLeads(),
    getActiveWorkspace(),
  ]);

  const now = nowMs();
  const upcoming = appointments.filter(
    (appointment) => appointment.status !== "cancelled" && new Date(appointment.startsAt).getTime() >= now,
  );
  const aiBooked = appointments.filter((appointment) => appointment.bookedByAI).length;

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        description={
          appointments.length > 0
            ? `${upcoming.length} upcoming · ${aiBooked} of ${appointments.length} booked by the assistant.`
            : "Calls booked by you or by the assistant land here and sync to your calendar."
        }
        actions={
          workspace?.bookingUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={workspace.bookingUrl} target="_blank" rel="noreferrer">
                <CalendarClock />
                Open booking page
              </a>
            </Button>
          ) : null
        }
      />
      <AppointmentCalendar appointments={appointments} leads={leads} todayIso={nowIso()} />
    </PageContainer>
  );
}
