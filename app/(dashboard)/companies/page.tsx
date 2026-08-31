import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CompaniesTable } from "@/components/companies/companies-table";
import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { fetchCompanies, fetchContacts } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const [companies, contacts] = await Promise.all([fetchCompanies(), fetchContacts()]);
  const clients = companies.filter((company) => company.status === "client").length;
  const engaged = companies.filter((company) => company.status === "engaged").length;

  return (
    <PageContainer>
      <PageHeader
        title="Companies"
        description={`${companies.length} companies tracked · ${engaged} engaged · ${clients} clients.`}
        actions={
          <Button size="sm">
            <Plus />
            Add company
          </Button>
        }
      />
      <CompaniesTable companies={companies} contacts={contacts} />
    </PageContainer>
  );
}
