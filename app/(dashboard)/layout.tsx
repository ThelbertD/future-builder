import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import type { ShellData } from "@/components/layout/shell-data";
import { ensureWorkspaceProvisioned, getActiveWorkspace, getCurrentUser } from "@/lib/supabase/auth";
import {
  fetchCompanies,
  fetchConversations,
  fetchHotLeads,
  fetchLeads,
  fetchNotifications,
} from "@/lib/supabase/queries";
import { truncate } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The real gate. The proxy redirects earlier for a better experience, but it
  // fails open by design, so authentication is enforced here as well. In demo
  // mode (no Supabase configured) getCurrentUser returns the demo user.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Runs before anything reads the workspace, so a confirmed-by-email account
  // lands on a fully provisioned workspace rather than an empty shell.
  await ensureWorkspaceProvisioned();

  const [workspace, notifications, conversations, leads, companies, hotLeads] = await Promise.all([
    getActiveWorkspace(),
    fetchNotifications(),
    fetchConversations(),
    fetchLeads(),
    fetchCompanies(),
    fetchHotLeads(5),
  ]);

  const data: ShellData = {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      jobTitle: user.jobTitle,
    },
    workspace: workspace ? { id: workspace.id, name: workspace.name, plan: workspace.plan } : null,
    notifications,
    unreadConversations: conversations.filter((conversation) => conversation.unreadCount > 0).length,
    activeAgentTasks: leads.filter((lead) => lead.status === "new" || lead.status === "qualified").length,
    search: {
      leads: leads.slice(0, 8).map((lead) => ({
        id: lead.id,
        label: lead.company.name,
        detail: lead.jobPost?.title ?? lead.company.industry,
        href: `/leads/${lead.id}`,
      })),
      companies: companies.slice(0, 6).map((company) => ({
        id: company.id,
        label: company.name,
        detail: company.industry,
        href: `/companies/${company.id}`,
      })),
      conversations: conversations.slice(0, 5).map((conversation) => ({
        id: conversation.id,
        label: truncate(conversation.subject, 60),
        detail: conversation.lastMessagePreview,
        href: `/conversations?c=${conversation.id}`,
      })),
    },
    hotLeads,
  };

  return <AppShell data={data}>{children}</AppShell>;
}
