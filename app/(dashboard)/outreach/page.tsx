import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { CampaignsView } from "@/components/outreach/campaigns-view";
import { CAMPAIGNS } from "@/lib/mock";

export const metadata: Metadata = { title: "Outreach" };

export default function OutreachPage() {
  const active = CAMPAIGNS.filter((campaign) => campaign.status === "active").length;
  const replies = CAMPAIGNS.reduce((total, campaign) => total + campaign.stats.replied, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Outreach"
        description={`${active} active campaigns · ${replies} replies · sequences pause automatically on reply.`}
      />
      <CampaignsView campaigns={CAMPAIGNS} />
    </PageContainer>
  );
}
