import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Cpu,
  KanbanSquare,
  LayoutDashboard,
  MessagesSquare,
  Plug,
  Radar,
  Send,
  Settings,
  Users,
} from "lucide-react";

export const BRAND = {
  name: "Future Builder",
  product: "Future Builder AI",
  subtitle: "AI Client Acquisition OS",
  tagline: "AI-powered client acquisition for modern service businesses.",
} as const;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Matches nested routes such as /leads/[id] */
  match?: string;
  badge?: "live";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Lead Finder", href: "/finder", icon: Radar, badge: "live" },
      { label: "Leads", href: "/leads", icon: Users, match: "/leads" },
      { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
      { label: "Companies", href: "/companies", icon: Building2, match: "/companies" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Conversations", href: "/conversations", icon: MessagesSquare },
      { label: "Outreach", href: "/outreach", icon: Send },
      { label: "Appointments", href: "/appointments", icon: CalendarDays },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Analytics", href: "/analytics", icon: BarChart3 }],
  },
  {
    label: "System",
    items: [
      { label: "AI Settings", href: "/ai-settings", icon: Cpu },
      { label: "Integrations", href: "/integrations", icon: Plug },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Condensed set used by the mobile bottom bar. */
export const MOBILE_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Finder", href: "/finder", icon: Radar },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Inbox", href: "/conversations", icon: MessagesSquare },
];

export const SERVICES = [
  "GoHighLevel Automation",
  "CRM Automation",
  "AI Automation",
  "Funnel Building",
  "Web Development",
  "Paid Ads Management",
  "Email Marketing",
  "Workflow Integration",
] as const;

export const KEYWORD_SUGGESTIONS = [
  "GoHighLevel Specialist",
  "GHL Expert",
  "Automation Specialist",
  "CRM Specialist",
  "AI Automation",
  "Funnel Builder",
  "Web Developer",
  "WordPress Developer",
  "Marketing Operations",
  "Zapier / Make Expert",
] as const;

export const INDUSTRIES = [
  "Marketing Agency",
  "Home Services",
  "Health & Wellness",
  "Real Estate",
  "Professional Services",
  "E-commerce",
  "Education",
  "Financial Services",
  "SaaS",
  "Construction",
] as const;

export const LOCATIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "United Arab Emirates",
  "Singapore",
  "Remote",
] as const;

export const SOURCES = [
  "LinkedIn",
  "Indeed",
  "Upwork",
  "AngelList",
  "Facebook Groups",
  "Company Site",
  "Reddit",
  "Referral",
] as const;

export const DATE_RANGES = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "New",
  qualified: "AI Qualified",
  ready: "Ready to Contact",
  contacted: "Contacted",
  replied: "Replied",
  interested: "Interested",
  booked: "Appointment Booked",
  call_completed: "Call Completed",
  proposal: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const INTENT_LABELS: Record<string, string> = {
  hot: "Hot",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Milestone stages shown in the compact dashboard pipeline strip. */
export const DASHBOARD_STAGE_NAMES = [
  "New",
  "AI Qualified",
  "Contacted",
  "Replied",
  "Interested",
  "Appointment Booked",
  "Won",
];

/** The stage set created for every new workspace and every new pipeline. */
export interface DefaultStageSeed {
  name: string;
  colorToken: string;
  probability: number;
  isWon?: boolean;
  isLost?: boolean;
}

export const DEFAULT_PIPELINE_STAGES: DefaultStageSeed[] = [
  { name: "New", colorToken: "chart-5", probability: 5 },
  { name: "AI Qualified", colorToken: "chart-1", probability: 15 },
  { name: "Ready to Contact", colorToken: "chart-1", probability: 20 },
  { name: "Contacted", colorToken: "chart-1", probability: 30 },
  { name: "Replied", colorToken: "chart-3", probability: 40 },
  { name: "Interested", colorToken: "chart-3", probability: 55 },
  { name: "Appointment Booked", colorToken: "chart-2", probability: 65 },
  { name: "Call Completed", colorToken: "chart-2", probability: 72 },
  { name: "Proposal Sent", colorToken: "chart-4", probability: 80 },
  { name: "Negotiation", colorToken: "chart-4", probability: 88 },
  { name: "Won", colorToken: "chart-2", probability: 100, isWon: true },
  { name: "Lost", colorToken: "chart-5", probability: 0, isLost: true },
];
