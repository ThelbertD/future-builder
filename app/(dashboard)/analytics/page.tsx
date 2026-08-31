import type { Metadata } from "next";
import { Download } from "lucide-react";

import {
  AIPerformancePanel,
  AppointmentBreakdown,
  LeadFunnel,
  OutreachPerformanceChart,
  SourcePerformanceChart,
} from "@/components/analytics/charts";
import { PageHeader } from "@/components/common/page-header";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ANALYTICS_METRICS, SOURCE_PERFORMANCE } from "@/lib/mock";
import { formatNumber, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Where opportunities come from, where they stall, and what the assistant is contributing."
        actions={
          <Button variant="outline" size="sm">
            <Download />
            Export report
          </Button>
        }
      />

      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border md:grid-cols-3 xl:grid-cols-5 xl:divide-y-0">
        {ANALYTICS_METRICS.slice(0, 5).map((metric) => (
          <StatCard key={metric.key} metric={metric} />
        ))}
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border md:grid-cols-4 md:divide-y-0">
        {ANALYTICS_METRICS.slice(5).map((metric) => (
          <StatCard key={metric.key} metric={metric} invertDelta={metric.key === "time_to_close"} />
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <ActivityChart />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Lead funnel</h2>
            <p className="text-[12px] text-muted-foreground">Conversion between each stage of acquisition.</p>
          </div>
          <LeadFunnel />
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Source performance</h2>
            <p className="text-[12px] text-muted-foreground">Volume and quality by discovery channel.</p>
          </div>
          <SourcePerformanceChart />
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Outreach performance</h2>
            <p className="text-[12px] text-muted-foreground">Sequence step effectiveness across active campaigns.</p>
          </div>
          <OutreachPerformanceChart />
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Appointment outcomes</h2>
            <p className="text-[12px] text-muted-foreground">What happens after a call is booked.</p>
          </div>
          <AppointmentBreakdown />
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">AI performance</h2>
            <p className="text-[12px] text-muted-foreground">Measured against your manual review decisions.</p>
          </div>
          <AIPerformancePanel />
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Source detail</h2>
            <p className="text-[12px] text-muted-foreground">Full funnel by channel.</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Source</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Qualified</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Booked</TableHead>
                <TableHead>Won</TableHead>
                <TableHead>Avg. score</TableHead>
                <TableHead>Reply rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SOURCE_PERFORMANCE.map((row) => (
                <TableRow key={row.source}>
                  <TableCell className="font-medium">{row.source}</TableCell>
                  <TableCell className="tabular-nums">{formatNumber(row.leads)}</TableCell>
                  <TableCell className="tabular-nums">{formatNumber(row.qualified)}</TableCell>
                  <TableCell className="tabular-nums">{row.replies}</TableCell>
                  <TableCell className="tabular-nums">{row.booked}</TableCell>
                  <TableCell className="tabular-nums">{row.won}</TableCell>
                  <TableCell className="tabular-nums">{row.avgScore}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatPercent((row.replies / Math.max(1, row.qualified)) * 100)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PageContainer>
  );
}
