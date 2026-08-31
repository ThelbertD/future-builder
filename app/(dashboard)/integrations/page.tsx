import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { IntegrationsGrid } from "@/components/settings/integrations-grid";
import { INTEGRATIONS } from "@/lib/mock";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  const connected = INTEGRATIONS.filter((integration) => integration.status === "connected").length;

  return (
    <PageContainer>
      <PageHeader
        title="Integrations"
        description={`${connected} connected. Every credential is stored server-side and scoped to this workspace.`}
      />
      <IntegrationsGrid integrations={INTEGRATIONS} />
    </PageContainer>
  );
}
