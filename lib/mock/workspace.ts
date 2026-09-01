import type { User, Workspace, WorkspaceMember } from "@/types";
import { daysAgo, sanitizeUrl } from "@/lib/utils";

export const WORKSPACE_ID = "wsp_futurebuilder";

export const CURRENT_USER: User = {
  id: "usr_thelbert",
  email: "thelbert@futurebuilder.ai",
  fullName: "Thelbert Delos Reyes",
  jobTitle: "Founder",
  timezone: "America/New_York",
  notificationPrefs: {},
  createdAt: daysAgo(214),
};

export const CURRENT_WORKSPACE: Workspace = {
  id: WORKSPACE_ID,
  name: "Future Builder",
  slug: "future-builder",
  plan: "growth",
  bookingUrl: sanitizeUrl(process.env.NEXT_PUBLIC_BOOKING_URL),
  aiSettings: {},
  createdAt: daysAgo(214),
};

export const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  {
    id: "mbr_1",
    workspaceId: WORKSPACE_ID,
    userId: CURRENT_USER.id,
    role: "owner",
    status: "active",
    joinedAt: daysAgo(214),
    user: {
      id: CURRENT_USER.id,
      fullName: CURRENT_USER.fullName,
      email: CURRENT_USER.email,
      jobTitle: "Founder",
    },
  },
  {
    id: "mbr_2",
    workspaceId: WORKSPACE_ID,
    userId: "usr_marisol",
    role: "admin",
    status: "active",
    joinedAt: daysAgo(96),
    user: {
      id: "usr_marisol",
      fullName: "Marisol Vega",
      email: "marisol@futurebuilder.ai",
      jobTitle: "Head of Delivery",
    },
  },
  {
    id: "mbr_3",
    workspaceId: WORKSPACE_ID,
    userId: "usr_dev",
    role: "member",
    status: "active",
    joinedAt: daysAgo(54),
    user: {
      id: "usr_dev",
      fullName: "Devon Ashcroft",
      email: "devon@futurebuilder.ai",
      jobTitle: "Automation Engineer",
    },
  },
  {
    id: "mbr_4",
    workspaceId: WORKSPACE_ID,
    userId: "usr_priya",
    role: "member",
    status: "invited",
    joinedAt: daysAgo(3),
    user: {
      id: "usr_priya",
      fullName: "Priya Raghunathan",
      email: "priya@futurebuilder.ai",
      jobTitle: "Appointment Setter",
    },
  },
];
