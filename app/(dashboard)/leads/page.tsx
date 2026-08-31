import type { Metadata } from "next";
import Link from "next/link";
import { Download, Radar } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { LeadsExplorer } from "@/components/leads/leads-explorer";
import { Button } from "@/components/ui/button";
import { LEADS_WITH_RELATIONS } from "@/lib/mock";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        description={`${formatNumber(LEADS_WITH_RELATIONS.length)} opportunities captured, scored, and ready to work.`}
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
      <LeadsExplorer leads={LEADS_WITH_RELATIONS} />
    </PageContainer>
  );
}
