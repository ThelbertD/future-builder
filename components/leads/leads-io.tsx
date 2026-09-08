"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { ImportCsvDialog } from "@/components/leads/import-csv-dialog";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import { LEAD_CSV_COLUMNS, LEAD_CSV_HEADERS } from "@/lib/leads/csv-columns";
import { pluralize } from "@/lib/utils";
import type { LeadWithRelations } from "@/types";

/**
 * Export and import for the Leads page header.
 *
 * Both live here because they are two directions of one feature: the file
 * written by Export carries exactly the headers Import recognises, so a round
 * trip through a spreadsheet needs no mapping at all.
 */
export function LeadsIO({ leads }: { leads: LeadWithRelations[] }) {
  const [importing, setImporting] = React.useState(false);

  const exportCsv = () => {
    if (leads.length === 0) {
      toast("Nothing to export", { description: "Find or import some leads first." });
      return;
    }

    const rows = leads.map((lead) => LEAD_CSV_COLUMNS.map((column) => column.read(lead)));
    const stamp = new Date().toISOString().slice(0, 10);

    downloadCsv(`nexusos-leads-${stamp}.csv`, toCsv(LEAD_CSV_HEADERS, rows));
    toast.success(`${pluralize(leads.length, "lead")} exported`, {
      description: "Edit it in a spreadsheet and import it back when you are done.",
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setImporting(true)}>
        <Upload />
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={exportCsv}>
        <Download />
        Export
      </Button>
      <ImportCsvDialog open={importing} onOpenChange={setImporting} />
    </>
  );
}
