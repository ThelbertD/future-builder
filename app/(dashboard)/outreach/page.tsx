import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { CampaignsView } from "@/components/outreach/campaigns-view";
import { fetchCampaigns, fetchLeads } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Outreach" };

// Server actions inherit their route's budget, and sending a batch is paced
// about a second per email. A "use server" file cannot carry this itself:
// only async functions may be exported from one.
export const maxDuration = 60;

export default async function OutreachPage() {
  // Lead scores travel with the page so the audience rule can say how many
  // leads it actually matches, rather than leaving it to be guessed.
  const [campaigns, leads] = await Promise.all([fetchCampaigns(), fetchLeads()]);
  const leadScores = leads.map((lead) => lead.score);
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
      <CampaignsView campaigns={campaigns} leadScores={leadScores} />
    </PageContainer>
  );
}
