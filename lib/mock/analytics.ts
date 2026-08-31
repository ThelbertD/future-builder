import type { FunnelPoint, MetricSummary, SourcePerformance, TimeSeriesPoint } from "@/types";
import { MOCK_NOW, seededRandom } from "@/lib/utils";

export type RangeKey = "7d" | "30d" | "90d";

export const RANGE_OPTIONS: Array<{ label: string; value: RangeKey; days: number }> = [
  { label: "7 days", value: "7d", days: 7 },
  { label: "30 days", value: "30d", days: 30 },
  { label: "90 days", value: "90d", days: 90 },
];

/** Headline counters shown across the top of the dashboard. */
export const DASHBOARD_METRICS: MetricSummary[] = [
  { key: "leads_found", label: "Leads found", value: 1284, format: "number", deltaPct: 18.4, context: "214 added this week" },
  { key: "ai_qualified", label: "AI qualified", value: 327, format: "number", deltaPct: 12.1, context: "25.5% of all leads" },
  { key: "contacted", label: "Contacted", value: 241, format: "number", deltaPct: 9.6, context: "73.7% of qualified" },
  { key: "responses", label: "Responses", value: 58, format: "number", deltaPct: 22.8, context: "24.1% reply rate" },
  { key: "appointments", label: "Appointments", value: 18, format: "number", deltaPct: 5.9, context: "31.0% of responders" },
  { key: "clients_won", label: "Clients won", value: 6, format: "number", deltaPct: -2.4, context: "33.3% of calls held" },
];

const rand = seededRandom(90210);

function seriesForDays(days: number): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(MOCK_NOW);
    date.setUTCDate(date.getUTCDate() - i);
    const weekday = date.getUTCDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.45 : 1;
    const trend = 1 + (days - i) / (days * 2.2);
    const noise = 0.82 + rand() * 0.36;

    const discovered = Math.round(22 * weekendDip * trend * noise);
    const qualified = Math.round(discovered * (0.24 + rand() * 0.08));
    const contacted = Math.round(qualified * (0.68 + rand() * 0.14));
    const responses = Math.round(contacted * (0.2 + rand() * 0.1));
    const appointments = Math.round(responses * (0.28 + rand() * 0.12));

    points.push({
      date: date.toISOString().slice(0, 10),
      discovered,
      qualified,
      contacted,
      responses,
      appointments,
    });
  }
  return points;
}

export const ACTIVITY_SERIES: Record<RangeKey, TimeSeriesPoint[]> = {
  "7d": seriesForDays(7),
  "30d": seriesForDays(30),
  "90d": seriesForDays(90),
};

export const FUNNEL: FunnelPoint[] = [
  { stage: "Discovered", value: 1284, rate: 100 },
  { stage: "Qualified", value: 327, rate: 25.5 },
  { stage: "Contacted", value: 241, rate: 73.7 },
  { stage: "Replied", value: 58, rate: 24.1 },
  { stage: "Interested", value: 31, rate: 53.4 },
  { stage: "Booked", value: 18, rate: 58.1 },
  { stage: "Won", value: 6, rate: 33.3 },
];

export const SOURCE_PERFORMANCE: SourcePerformance[] = [
  { source: "LinkedIn", leads: 486, qualified: 148, replies: 27, booked: 9, won: 3, avgScore: 81 },
  { source: "Indeed", leads: 291, qualified: 62, replies: 11, booked: 3, won: 1, avgScore: 68 },
  { source: "Upwork", leads: 214, qualified: 71, replies: 12, booked: 4, won: 1, avgScore: 76 },
  { source: "Facebook Groups", leads: 138, qualified: 24, replies: 4, booked: 1, won: 0, avgScore: 62 },
  { source: "Company Site", leads: 87, qualified: 14, replies: 2, booked: 1, won: 1, avgScore: 71 },
  { source: "Referral", leads: 68, qualified: 8, replies: 2, booked: 0, won: 0, avgScore: 88 },
];

export const ANALYTICS_METRICS: MetricSummary[] = [
  { key: "discovery_rate", label: "Lead discovery rate", value: 42.8, format: "number", deltaPct: 14.2, context: "New opportunities per day" },
  { key: "qualification_rate", label: "Qualification rate", value: 25.5, format: "percent", deltaPct: 3.1, context: "Qualified ÷ discovered" },
  { key: "contact_rate", label: "Contact rate", value: 73.7, format: "percent", deltaPct: 6.4, context: "Contacted ÷ qualified" },
  { key: "response_rate", label: "Response rate", value: 24.1, format: "percent", deltaPct: 4.8, context: "Replies ÷ contacted" },
  { key: "interested_rate", label: "Interested rate", value: 53.4, format: "percent", deltaPct: -1.7, context: "Interested ÷ replies" },
  { key: "booking_rate", label: "Booking rate", value: 58.1, format: "percent", deltaPct: 8.2, context: "Booked ÷ interested" },
  { key: "close_rate", label: "Close rate", value: 33.3, format: "percent", deltaPct: 2.6, context: "Won ÷ calls held" },
  { key: "time_to_close", label: "Avg. time to close", value: 21, format: "duration", deltaPct: -12.4, context: "Days from discovery to won" },
  { key: "ai_conversion", label: "AI conversion rate", value: 61.4, format: "percent", deltaPct: 9.7, context: "AI-only threads reaching a booking" },
];

export const OUTREACH_PERFORMANCE = [
  { step: "Initial email", sent: 412, opened: 233, replied: 61 },
  { step: "Follow-up", sent: 351, opened: 178, replied: 34 },
  { step: "Value follow-up", sent: 288, opened: 141, replied: 22 },
  { step: "Final follow-up", sent: 214, opened: 88, replied: 11 },
];

export const AI_PERFORMANCE = [
  { label: "Qualification accuracy", value: 92 },
  { label: "Reply relevance", value: 88 },
  { label: "Booking assist rate", value: 61 },
  { label: "Handoff precision", value: 79 },
];

export const APPOINTMENT_PERFORMANCE = [
  { label: "Scheduled", value: 24 },
  { label: "Confirmed", value: 19 },
  { label: "Completed", value: 15 },
  { label: "No show", value: 3 },
  { label: "Cancelled", value: 2 },
];
