"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ACTIVITY_SERIES, RANGE_OPTIONS, type RangeKey } from "@/lib/mock";
import { formatDate } from "@/lib/utils";

const SERIES = [
  { key: "discovered", label: "Discovered", color: "var(--chart-1)" },
  { key: "qualified", label: "Qualified", color: "var(--chart-2)" },
  { key: "contacted", label: "Contacted", color: "var(--chart-3)" },
  { key: "responses", label: "Responses", color: "var(--chart-4)" },
  { key: "appointments", label: "Appointments", color: "var(--chart-5)" },
] as const;

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

function ChartTooltip({
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
      <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
        {formatDate(String(label), { weekday: "short", month: "short", day: "numeric", year: undefined })}
      </p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2 text-[12px]">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActivityChart() {
  const [range, setRange] = React.useState<RangeKey>("30d");
  const data = ACTIVITY_SERIES[range];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Lead acquisition activity</h2>
          <p className="text-[12px] text-muted-foreground">
            Discovery through to booked appointments across the selected window.
          </p>
        </div>
        <Tabs value={range} onValueChange={(value) => setRange(value as RangeKey)}>
          <TabsList>
            {RANGE_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[260px] w-full px-1 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              {SERIES.map((series) => (
                <linearGradient key={series.key} id={`fill-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={series.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={series.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickMargin={10}
              minTickGap={28}
              tickFormatter={(value: string) => formatDate(value, { month: "short", day: "numeric", year: undefined })}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Legend
              verticalAlign="bottom"
              height={28}
              iconType="circle"
              iconSize={7}
              formatter={(value) => <span className="text-[12px] text-muted-foreground">{value}</span>}
            />
            {SERIES.map((series) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={1.75}
                fill={`url(#fill-${series.key})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
