import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { SettingsView } from "@/components/settings/settings-view";
import { getActiveWorkspace, getCurrentUser, getWorkspaceMembers } from "@/lib/supabase/auth";
import { fetchPipelineStages } from "@/lib/supabase/queries";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, workspace, members, stages] = await Promise.all([
    getCurrentUser(),
    getActiveWorkspace(),
    getWorkspaceMembers(),
    fetchPipelineStages(),
  ]);

  if (!user) notFound();

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title="Settings" description="Profile, workspace, team, and how the product behaves for you." />
      <SettingsView user={user} workspace={workspace} members={members} stages={stages} />
    </PageContainer>
  );
}
