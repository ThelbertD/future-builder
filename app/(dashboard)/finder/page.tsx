import type { Metadata } from "next";
import { Bookmark } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { FinderWorkspace } from "@/components/leads/finder-workspace";
import { Button } from "@/components/ui/button";
import { fetchSavedSearches } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Lead Finder" };

export default async function FinderPage() {
  const savedSearches = await fetchSavedSearches();

  return (
    <PageContainer>
      <PageHeader
        title="Find your next client"
        description="Search live job feeds for companies hiring right now, scored and explained before you spend a minute on them."
        actions={
          <Button variant="outline" size="sm">
            <Bookmark />
            Manage saved searches
          </Button>
        }
      />
      <FinderWorkspace savedSearches={savedSearches} />
    </PageContainer>
  );
}
