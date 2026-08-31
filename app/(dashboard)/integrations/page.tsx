import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { IntegrationsGrid } from "@/components/settings/integrations-grid";
import { fetchIntegrations } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const integrations = await fetchIntegrations();
  const connected = integrations.filter((integration) => integration.status === "connected").length;

  return (
    <PageContainer>
      <PageHeader
        title="Integrations"
        description={`${connected} connected. Every credential is stored server-side and scoped to this workspace.`}
      />
      <IntegrationsGrid integrations={integrations} />
    </PageContainer>
  );
}
