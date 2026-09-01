import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { CampaignsView } from "@/components/outreach/campaigns-view";
import { fetchCampaigns } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Outreach" };

export default async function OutreachPage() {
  const campaigns = await fetchCampaigns();
  const active = campaigns.filter((campaign) => campaign.status === "active").length;
  const replies = campaigns.reduce((total, campaign) => total + campaign.stats.replied, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Outreach"
        description={
          campaigns.length > 0
            ? `${active} active campaigns · ${replies} replies · sequences pause automatically on reply.`
            : "Sequences that open on the problem a company named, and stop the moment someone replies."
        }
      />
      <CampaignsView campaigns={campaigns} />
    </PageContainer>
  );
}
