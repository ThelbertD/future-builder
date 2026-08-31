import type { Metadata } from "next";

import { AppointmentCalendar } from "@/components/appointments/appointment-calendar";
import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { APPOINTMENTS, LEADS_WITH_RELATIONS, UPCOMING_APPOINTMENTS } from "@/lib/mock";

export const metadata: Metadata = { title: "Appointments" };

export default function AppointmentsPage() {
  const aiBooked = APPOINTMENTS.filter((appointment) => appointment.bookedByAI).length;

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        description={`${UPCOMING_APPOINTMENTS.length} upcoming · ${aiBooked} of ${APPOINTMENTS.length} booked by the assistant.`}
      />
      <AppointmentCalendar appointments={APPOINTMENTS} leads={LEADS_WITH_RELATIONS} />
    </PageContainer>
  );
}
