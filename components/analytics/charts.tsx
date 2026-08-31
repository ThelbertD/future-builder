"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { AI_PERFORMANCE, APPOINTMENT_PERFORMANCE, FUNNEL, OUTREACH_PERFORMANCE, SOURCE_PERFORMANCE } from "@/lib/mock";

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 };

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

function BaseTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
      {label ? <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2 text-[12px]">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal funnel — the clearest read of stage-to-stage drop-off. */
export function LeadFunnel() {
  const max = FUNNEL[0]?.value ?? 1;

  return (
    <div className="space-y-2.5 p-4">
      {FUNNEL.map((point, index) => (
        <div key={point.stage} className="space-y-1">
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="font-medium">{point.stage}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatNumber(point.value)}
              {index > 0 ? <span className="ml-2 text-[11px]">{formatPercent(point.rate, 1)}</span> : null}
            </span>
          </div>
          <div className="h-6 overflow-hidden rounded-sm bg-muted">
            <div
              className={cn("h-full rounded-sm transition-[width]")}
              style={{
                width: `${Math.max(2, (point.value / max) * 100)}%`,
                backgroundColor: `color-mix(in oklab, var(--chart-1) ${100 - index * 11}%, var(--muted))`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SourcePerformanceChart() {
  return (
    <div className="h-[280px] w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={SOURCE_PERFORMANCE} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <XAxis dataKey="source" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={36} tick={AXIS_TICK} />
          <Tooltip content={<BaseTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(value) => <span className="text-[12px] text-muted-foreground">{value}</span>}
          />
          <Bar dataKey="leads" name="Leads" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={26} />
          <Bar dataKey="qualified" name="Qualified" fill="var(--chart-2)" radius={[3, 3, 0, 0]} maxBarSize={26} />
          <Bar dataKey="replies" name="Replies" fill="var(--chart-3)" radius={[3, 3, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OutreachPerformanceChart() {
  return (
    <div className="h-[260px] w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={OUTREACH_PERFORMANCE} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis
            type="category"
            dataKey="step"
            tickLine={false}
            axisLine={false}
            width={104}
            tick={AXIS_TICK}
          />
          <Tooltip content={<BaseTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(value) => <span className="text-[12px] text-muted-foreground">{value}</span>}
          />
          <Bar dataKey="sent" name="Sent" fill="var(--chart-5)" radius={[0, 3, 3, 0]} maxBarSize={14} />
          <Bar dataKey="opened" name="Opened" fill="var(--chart-1)" radius={[0, 3, 3, 0]} maxBarSize={14} />
          <Bar dataKey="replied" name="Replied" fill="var(--chart-2)" radius={[0, 3, 3, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AppointmentBreakdown() {
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="h-[260px] w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={APPOINTMENT_PERFORMANCE}
            dataKey="value"
            nameKey="label"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={2}
            stroke="var(--background)"
            strokeWidth={2}
          >
            {APPOINTMENT_PERFORMANCE.map((entry, index) => (
              <Cell key={entry.label} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<BaseTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(value) => <span className="text-[12px] text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AIPerformancePanel() {
  return (
    <div className="space-y-3 p-4">
      {AI_PERFORMANCE.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{item.value}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${item.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
