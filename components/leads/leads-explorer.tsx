"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, KanbanSquare, Radar, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import {
  applyLeadFilters,
  DEFAULT_LEAD_FILTERS,
  FilterBar,
  type LeadFilters,
} from "@/components/leads/filter-bar";
import { LeadTable, type LeadSortKey } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { pluralize } from "@/lib/utils";
import type { LeadWithRelations } from "@/types";

function sortLeads(leads: LeadWithRelations[], sort: LeadSortKey): LeadWithRelations[] {
  const copy = [...leads];
  switch (sort) {
    case "company":
      return copy.sort((a, b) => a.company.name.localeCompare(b.company.name));
    case "posted":
      return copy.sort((a, b) => (b.jobPost?.postedAt ?? "").localeCompare(a.jobPost?.postedAt ?? ""));
    case "value":
      return copy.sort((a, b) => b.estimatedValue - a.estimatedValue);
    default:
      return copy.sort((a, b) => b.score - a.score);
  }
}

export function LeadsExplorer({
  leads,
  initialFilters = DEFAULT_LEAD_FILTERS,
}: {
  leads: LeadWithRelations[];
  initialFilters?: LeadFilters;
}) {
  const router = useRouter();
  const [filters, setFilters] = React.useState<LeadFilters>(initialFilters);
  const [sort, setSort] = React.useState<LeadSortKey>("score");
  const [selected, setSelected] = React.useState<string[]>([]);

  const visible = React.useMemo(() => sortLeads(applyLeadFilters(leads, filters), sort), [leads, filters, sort]);

  // Selection is derived rather than synced, so filtering never leaves a
  // hidden lead selected and no effect is needed to prune it.
  const visibleSelected = React.useMemo(
    () => selected.filter((id) => visible.some((lead) => lead.id === id)),
    [selected, visible],
  );

  const handleAction = (action: string, lead: LeadWithRelations) => {
    switch (action) {
      case "outreach":
        toast.success("Outreach drafted", {
          description: `The assistant prepared a first message for ${lead.company.name}.`,
        });
        break;
      case "contact":
        router.push("/conversations");
        break;
      case "pipeline":
        router.push("/pipeline");
        break;
      default:
        toast("Lead archived", { description: `${lead.company.name} was moved out of the active list.` });
    }
  };

  return (
    <div className="space-y-3">
      <FilterBar filters={filters} onChange={setFilters} resultCount={visible.length} />

      {visibleSelected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2">
          <span className="text-[13px] font-medium">{pluralize(visibleSelected.length, "lead")} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.success("Added to pipeline", {
                  description: `${pluralize(visibleSelected.length, "lead")} moved to Ready to Contact.`,
                })
              }
            >
              <KanbanSquare />
              Add to pipeline
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.success("Outreach queued", {
                  description: `The assistant is drafting ${pluralize(visibleSelected.length, "message")}.`,
                })
              }
            >
              <Sparkles />
              Generate outreach
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast("Export started", { description: "Your CSV will download shortly." })}
            >
              <Download />
              Export
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])} aria-label="Clear selection">
              <X />
            </Button>
          </div>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No leads match these filters"
          description="Widen the score threshold or clear a filter. New opportunities arrive every time a saved search runs."
          action={
            <Button size="sm" variant="outline" onClick={() => setFilters(DEFAULT_LEAD_FILTERS)}>
              Clear filters
            </Button>
          }
          secondaryAction={
            <Button size="sm" onClick={() => router.push("/finder")}>
              <Radar />
              Find new leads
            </Button>
          }
        />
      ) : (
        <LeadTable
          leads={visible}
          selected={visibleSelected}
          onSelectedChange={setSelected}
          sort={sort}
          onSortChange={setSort}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
