import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { AISettingsForm } from "@/components/settings/ai-settings-form";
import { getActiveWorkspace } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "AI Settings" };

export default async function AISettingsPage() {
  const workspace = await getActiveWorkspace();

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="AI settings"
        description="How the assistant scores opportunities, writes on your behalf, and when it stops to ask you."
      />
      <AISettingsForm settings={workspace?.aiSettings ?? {}} />
    </PageContainer>
  );
}
