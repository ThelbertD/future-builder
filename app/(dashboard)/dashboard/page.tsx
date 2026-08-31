import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, Radar, Sparkles } from "lucide-react";

import { AIBadge } from "@/components/ai/ai-badge";
import { SectionHeader } from "@/components/common/page-header";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { AIActivityFeed } from "@/components/dashboard/ai-activity";
import { HotLeads } from "@/components/dashboard/hot-leads";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { StatGrid } from "@/components/dashboard/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENT_USER, DASHBOARD_METRICS, UPCOMING_APPOINTMENTS } from "@/lib/mock";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

/** Computed on the server, so the greeting never disagrees with the hydrated markup. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const firstName = CURRENT_USER.fullName.split(" ")[0];
  const nextAppointments = UPCOMING_APPOINTMENTS.slice(0, 4);

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {greeting()}, {firstName}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Here is what is happening with your client acquisition today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/analytics">
              View analytics
              <ArrowUpRight />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/finder">
              <Radar />
              Find new leads
            </Link>
          </Button>
        </div>
      </div>

      <StatGrid metrics={DASHBOARD_METRICS} />

      <Card className="overflow-hidden p-0">
        <ActivityChart />
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <SectionHeader
            title="Pipeline overview"
            description="Stage volume, conversion, and open value across the client acquisition pipeline."
          />
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/pipeline">
              Open board
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <PipelineOverview />
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <SectionHeader title="Hot leads" description="Highest-scoring opportunities that need a decision today." />
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/leads">
                All leads
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <HotLeads />
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold tracking-tight">AI activity</h2>
                <AIBadge label="Live" size="sm" />
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/leads">
                  <Sparkles />
                </Link>
              </Button>
            </div>
            <AIActivityFeed limit={6} />
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Upcoming</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/appointments">
                  <CalendarClock />
                </Link>
              </Button>
            </div>
            <ul className="divide-y divide-border">
              {nextAppointments.map((appointment) => (
                <li key={appointment.id}>
                  <Link
                    href="/appointments"
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase">
                        {formatDate(appointment.startsAt, { month: "short", day: "numeric", year: undefined })}
                      </p>
                      <p className="text-[13px] font-medium tabular-nums">{formatTime(appointment.startsAt)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px]">{appointment.title}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {appointment.meetingType} · {appointment.location}
                      </p>
                    </div>
                    {appointment.bookedByAI ? <AIBadge size="sm" label="Booked" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
