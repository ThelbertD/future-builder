import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { AISettingsForm } from "@/components/settings/ai-settings-form";

export const metadata: Metadata = { title: "AI Settings" };

export default function AISettingsPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="AI settings"
        description="How the assistant scores opportunities, writes on your behalf, and when it stops to ask you."
      />
      <AISettingsForm />
    </PageContainer>
  );
}
