import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CompaniesTable } from "@/components/companies/companies-table";
import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { COMPANIES, CONTACTS } from "@/lib/mock";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  const clients = COMPANIES.filter((company) => company.status === "client").length;
  const engaged = COMPANIES.filter((company) => company.status === "engaged").length;

  return (
    <PageContainer>
      <PageHeader
        title="Companies"
        description={`${COMPANIES.length} companies tracked · ${engaged} engaged · ${clients} clients.`}
        actions={
          <Button size="sm">
            <Plus />
            Add company
          </Button>
        }
      />
      <CompaniesTable companies={COMPANIES} contacts={CONTACTS} />
    </PageContainer>
  );
}
