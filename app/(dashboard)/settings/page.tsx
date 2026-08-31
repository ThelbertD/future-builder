import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title="Settings" description="Profile, workspace, team, and how the product behaves for you." />
      <SettingsView />
    </PageContainer>
  );
}
