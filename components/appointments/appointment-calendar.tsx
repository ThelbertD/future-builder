"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, Video } from "lucide-react";

import { AIBadge } from "@/components/ai/ai-badge";
import { EmptyState } from "@/components/common/empty-state";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatTime } from "@/lib/utils";
import type { Appointment, AppointmentStatus, LeadWithRelations } from "@/types";

type CalendarView = "month" | "week" | "day" | "agenda";

const STATUS_VARIANTS: Record<AppointmentStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  scheduled: "outline",
  confirmed: "primary",
  completed: "success",
  cancelled: "default",
  no_show: "destructive",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* All calendar maths runs in UTC so the server and client always agree. */
function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}
/** Monday-first week start. */
function startOfWeek(date: Date): Date {
  const day = utcDay(date);
  const offset = (day.getUTCDay() + 6) % 7;
  return addDays(day, -offset);
}
function key(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}
function dayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

interface CalendarProps {
  appointments: Appointment[];
  leads: LeadWithRelations[];
  /** Server-rendered date so the highlighted day never disagrees on hydration. */
  todayIso: string;
}

export function AppointmentCalendar({ appointments: initial, leads, todayIso }: CalendarProps) {
  const today = React.useMemo(() => utcDay(new Date(todayIso)), [todayIso]);
  const [appointments, setAppointments] = React.useState(initial);
  const [view, setView] = React.useState<CalendarView>("month");
  const [cursor, setCursor] = React.useState<Date>(today);
  const [creating, setCreating] = React.useState(false);

  const byDay = React.useMemo(() => {
    return appointments.reduce<Record<string, Appointment[]>>((map, appointment) => {
      const day = appointment.startsAt.slice(0, 10);
      (map[day] ??= []).push(appointment);
      return map;
    }, {});
  }, [appointments]);

  const step = (direction: -1 | 1) => {
    if (view === "month") setCursor((current) => addMonths(current, direction));
    else if (view === "week") setCursor((current) => addDays(current, direction * 7));
    else setCursor((current) => addDays(current, direction));
  };

  const title =
    view === "month"
      ? monthLabel(cursor)
      : view === "week"
        ? `${dayLabel(startOfWeek(cursor))} — ${dayLabel(addDays(startOfWeek(cursor), 6))}`
        : view === "day"
          ? dayLabel(cursor)
          : "Upcoming";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => step(1)} aria-label="Next">
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(today)}>
            Today
          </Button>
        </div>

        <p className="text-[15px] font-semibold tracking-tight">{title}</p>

        <div className="ml-auto flex items-center gap-2">
          <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => setCreating(true)}>
            <CalendarPlus />
            New appointment
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          cursor={cursor}
          today={today}
          byDay={byDay}
          onPickDay={(date) => {
            setCursor(date);
            setView("day");
          }}
        />
      ) : null}
      {view === "week" ? <WeekView cursor={cursor} byDay={byDay} /> : null}
      {view === "day" ? <DayView cursor={cursor} byDay={byDay} /> : null}
      {view === "agenda" ? <AgendaView appointments={appointments} /> : null}

      <NewAppointmentDialog
        open={creating}
        onOpenChange={setCreating}
        leads={leads}
        defaultDate={todayIso.slice(0, 10)}
        onCreate={(appointment) => setAppointments((current) => [...current, appointment])}
      />
    </div>
  );
}

function AppointmentChip({ appointment }: { appointment: Appointment }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 truncate rounded-sm border px-1 py-0.5 text-[10px]",
        appointment.status === "cancelled" || appointment.status === "no_show"
          ? "border-border bg-muted text-muted-foreground line-through"
          : "border-primary/25 bg-primary/10 text-primary",
      )}
    >
      <span className="tabular-nums">{formatTime(appointment.startsAt)}</span>
      <span className="truncate">{appointment.title.replace(/^.*— /, "")}</span>
    </span>
  );
}

function MonthView({
  cursor,
  today,
  byDay,
  onPickDay,
}: {
  cursor: Date;
  today: Date;
  byDay: Record<string, Appointment[]>;
  onPickDay: (date: Date) => void;
}) {
  const monthStart = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const todayKey = key(today);

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayKey = key(day);
          const items = byDay[dayKey] ?? [];
          const inMonth = day.getUTCMonth() === cursor.getUTCMonth();

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onPickDay(day)}
              className={cn(
                "flex min-h-[92px] flex-col gap-1 border-r border-b border-border p-1.5 text-left transition-colors last:border-r-0 hover:bg-accent/40",
                !inMonth && "bg-muted/25",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                  dayKey === todayKey ? "bg-primary text-primary-foreground" : inMonth ? "" : "text-muted-foreground",
                )}
              >
                {day.getUTCDate()}
              </span>
              {items.slice(0, 2).map((appointment) => (
                <AppointmentChip key={appointment.id} appointment={appointment} />
              ))}
              {items.length > 2 ? (
                <span className="text-[10px] text-muted-foreground">+{items.length - 2} more</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function WeekView({ cursor, byDay }: { cursor: Date; byDay: Record<string, Appointment[]> }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-7 sm:divide-x sm:divide-y-0">
        {days.map((day) => {
          const items = byDay[key(day)] ?? [];
          return (
            <div key={key(day)} className="min-h-[180px] p-2">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(day)}
              </p>
              <div className="space-y-1.5">
                {items.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DayView({ cursor, byDay }: { cursor: Date; byDay: Record<string, Appointment[]> }) {
  const items = byDay[key(cursor)] ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="Nothing scheduled"
        description="No appointments on this day. Bookings made by the assistant appear here automatically."
      />
    );
  }

  return (
    <Card className="p-0">
      <ul className="divide-y divide-border">
        {items.map((appointment) => (
          <li key={appointment.id} className="p-3">
            <AppointmentRow appointment={appointment} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AgendaView({ appointments }: { appointments: Appointment[] }) {
  const upcoming = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const grouped = upcoming.reduce<Record<string, Appointment[]>>((map, appointment) => {
    const day = appointment.startsAt.slice(0, 10);
    (map[day] ??= []).push(appointment);
    return map;
  }, {});

  return (
    <Card className="p-0">
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="border-b border-border last:border-0">
          <p className="bg-muted/40 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {dayLabel(new Date(`${day}T00:00:00.000Z`))}
          </p>
          <ul className="divide-y divide-border">
            {items.map((appointment) => (
              <li key={appointment.id} className="p-3">
                <AppointmentRow appointment={appointment} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}

function AppointmentRow({ appointment, compact = false }: { appointment: Appointment; compact?: boolean }) {
  return (
    <Link
      href={`/leads/${appointment.leadId}`}
      className={cn(
        "block rounded-md transition-colors hover:bg-accent/40",
        compact ? "border border-border p-1.5" : "flex items-center gap-3 p-1",
      )}
    >
      <div className={cn("shrink-0", compact ? "" : "w-24")}>
        <p className="text-[12px] font-medium tabular-nums">{formatTime(appointment.startsAt)}</p>
        {!compact ? (
          <p className="text-[11px] text-muted-foreground">{formatTime(appointment.endsAt)}</p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]">{appointment.title}</p>
        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
          <Video className="size-3" />
          {appointment.meetingType} · {appointment.location}
        </p>
      </div>
      {!compact ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {appointment.bookedByAI ? <AIBadge label="AI booked" size="sm" /> : null}
          <Badge variant={STATUS_VARIANTS[appointment.status]}>{STATUS_LABELS[appointment.status]}</Badge>
        </div>
      ) : null}
    </Link>
  );
}
