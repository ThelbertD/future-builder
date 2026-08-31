import type { Metadata } from "next";
import Link from "next/link";
import { Download, Radar } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { LeadsExplorer } from "@/components/leads/leads-explorer";
import { Button } from "@/components/ui/button";
import { fetchLeads } from "@/lib/supabase/queries";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const leads = await fetchLeads();

  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        description={
          leads.length > 0
            ? `${formatNumber(leads.length)} opportunities captured, scored, and ready to work.`
            : "Opportunities appear here once a search runs."
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download />
              Export
            </Button>
            <Button asChild size="sm">
              <Link href="/finder">
                <Radar />
                Find new leads
              </Link>
            </Button>
          </>
        }
      />
      {leads.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No leads yet"
          description="Start discovering companies that are actively looking for your services. Every result arrives scored and explained."
          action={
            <Button asChild size="sm">
              <Link href="/finder">
                <Radar />
                Find your first leads
              </Link>
            </Button>
          }
        />
      ) : (
        <LeadsExplorer leads={leads} />
      )}
    </PageContainer>
  );
}
