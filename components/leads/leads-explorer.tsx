"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AtSign, Download, KanbanSquare, Plus, Radar, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { deleteLeadsAction, generateOutreachAction } from "@/app/(dashboard)/leads/actions";
import { discoverContactsAction } from "@/app/(dashboard)/leads/enrich-actions";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { OutreachDraftDialog, type OutreachDraft } from "@/components/leads/outreach-draft-dialog";
import {
  applyLeadFilters,
  DEFAULT_LEAD_FILTERS,
  FilterBar,
  type LeadFilters,
} from "@/components/leads/filter-bar";
import { LeadTable, type LeadSortKey } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import { LEAD_CSV_COLUMNS, LEAD_CSV_HEADERS } from "@/lib/leads/csv-columns";
import { pluralize } from "@/lib/utils";
import type { LeadWithRelations, PipelineStage } from "@/types";

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
  stages,
  initialFilters = DEFAULT_LEAD_FILTERS,
}: {
  leads: LeadWithRelations[];
  stages: PipelineStage[];
  initialFilters?: LeadFilters;
}) {
  const router = useRouter();
  const [filters, setFilters] = React.useState<LeadFilters>(initialFilters);
  const [sort, setSort] = React.useState<LeadSortKey>("score");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState<OutreachDraft | null>(null);
  const [drafting, setDrafting] = React.useState(false);
  const [enriching, setEnriching] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  /** Leads awaiting confirmation. Empty means no delete is pending. */
  const [pendingDelete, setPendingDelete] = React.useState<LeadWithRelations[]>([]);
  const [deleting, setDeleting] = React.useState(false);

  const visible = React.useMemo(() => sortLeads(applyLeadFilters(leads, filters), sort), [leads, filters, sort]);

  // Selection is derived rather than synced, so filtering never leaves a
  // hidden lead selected and no effect is needed to prune it.
  const visibleSelected = React.useMemo(
    () => selected.filter((id) => visible.some((lead) => lead.id === id)),
    [selected, visible],
  );

  /** Reads each company's own site for the address they publish. */
  const findContacts = async () => {
    if (enriching || visibleSelected.length === 0) return;

    setEnriching(true);
    const result = await discoverContactsAction({ leadIds: visibleSelected.slice(0, 15) });
    setEnriching(false);

    if (!result.ok) {
      toast.error("Could not look up contacts", { description: result.error });
      return;
    }

    if (result.found === 0) {
      toast("No public addresses found", {
        description:
          result.searched === 0
            ? "Those leads already have a contact."
            : `Checked ${result.searched} companies. Many publish a form instead of an address.`,
      });
      return;
    }

    toast.success(`${pluralize(result.found, "contact")} found`, {
      description: `From ${result.searched} companies checked. They are attached to their leads.`,
    });
    router.refresh();
  };

  /** Drafts a message for every selected lead, sequentially so writes stay ordered. */
  const draftForSelected = async () => {
    if (drafting || visibleSelected.length === 0) return;

    setDrafting(true);
    let created = 0;

    for (const id of visibleSelected) {
      const result = await generateOutreachAction({ leadId: id });
      if (result.ok) created += 1;
    }

    setDrafting(false);

    if (created === 0) {
      toast.error("No drafts were created");
      return;
    }

    toast.success(`${pluralize(created, "draft")} ready`, {
      description: "Open Conversations to review each one before sending.",
    });
    router.refresh();
  };

  /** Writes only what is selected, using the same columns as a full export. */
  const exportSelected = () => {
    const chosen = visible.filter((lead) => visibleSelected.includes(lead.id));
    if (chosen.length === 0) return;

    const rows = chosen.map((lead) => LEAD_CSV_COLUMNS.map((column) => column.read(lead)));
    const stamp = new Date().toISOString().slice(0, 10);

    downloadCsv(`nexusos-leads-${stamp}.csv`, toCsv(LEAD_CSV_HEADERS, rows));
    toast.success(`${pluralize(chosen.length, "lead")} exported`, {
      description: "Edit it in a spreadsheet and import it back when you are done.",
    });
  };

  /**
   * Deletes what the confirmation dialog is holding.
   *
   * The selection is cleared regardless of the outcome: whatever survived a
   * partial failure is no longer what the user chose, and acting on a stale
   * selection is how the wrong lead gets deleted next.
   */
  const confirmDelete = async () => {
    if (deleting || pendingDelete.length === 0) return;

    const count = pendingDelete.length;
    setDeleting(true);
    const result = await deleteLeadsAction({ leadIds: pendingDelete.map((lead) => lead.id) });
    setDeleting(false);

    if (!result.ok) {
      toast.error("Nothing was deleted", { description: result.error });
      return;
    }

    setPendingDelete([]);
    setSelected([]);
    toast.success(`${pluralize(result.deleted, "lead")} deleted`, {
      description:
        result.deleted < count
          ? `${count - result.deleted} could not be removed and are still listed.`
          : "Their conversations, drafts and scoring went with them.",
    });
    router.refresh();
  };

  const handleAction = async (action: string, lead: LeadWithRelations) => {
    switch (action) {
      case "outreach": {
        if (drafting) return;
        setDrafting(true);
        const result = await generateOutreachAction({ leadId: lead.id });
        setDrafting(false);

        if (!result.ok) {
          toast.error("Could not draft outreach", { description: result.error });
          return;
        }

        setDraft({
          companyName: lead.company.name,
          subject: result.subject ?? "",
          body: result.body ?? "",
          conversationId: result.conversationId,
        });
        break;
      }
      case "contact":
        router.push("/conversations");
        break;
      case "pipeline":
        router.push("/pipeline");
        break;
      case "delete":
        setPendingDelete([lead]);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-3">
      <FilterBar filters={filters} onChange={setFilters} resultCount={visible.length}>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus />
          New lead
        </Button>
      </FilterBar>

      {visibleSelected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2">
          <span className="text-[13px] font-medium">{pluralize(visibleSelected.length, "lead")} selected</span>
          {visibleSelected.length < visible.length ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-auto px-1 py-0 text-[12px]"
              onClick={() => setSelected(visible.map((lead) => lead.id))}
            >
              Select all {visible.length}
            </Button>
          ) : null}
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
            <Button size="sm" variant="outline" loading={enriching} onClick={() => void findContacts()}>
              <AtSign />
              Find contacts
            </Button>
            <Button size="sm" variant="outline" loading={drafting} onClick={() => void draftForSelected()}>
              <Sparkles />
              Generate outreach
            </Button>
            <Button size="sm" variant="outline" onClick={exportSelected}>
              <Download />
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setPendingDelete(visible.filter((lead) => visibleSelected.includes(lead.id)))}
            >
              <Trash2 />
              Delete
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
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus />
              New lead
            </Button>
          }
          secondaryAction={
            <Button size="sm" variant="outline" onClick={() => router.push("/finder")}>
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
          onAction={(action, lead) => void handleAction(action, lead)}
        />
      )}

      <CreateLeadDialog open={creating} stages={stages} onOpenChange={setCreating} />

      <OutreachDraftDialog draft={draft} onOpenChange={(open) => !open && setDraft(null)} />

      <ConfirmDialog
        open={pendingDelete.length > 0}
        onOpenChange={(open) => !open && setPendingDelete([])}
        title={
          pendingDelete.length === 1
            ? `Delete ${pendingDelete[0].company.name}?`
            : `Delete ${pluralize(pendingDelete.length, "lead")}?`
        }
        description={`This cannot be undone. ${
          pendingDelete.length === 1 ? "The lead's" : "Their"
        } conversations, drafts and scoring are deleted too. The ${
          pendingDelete.length === 1 ? "company and contact stay" : "companies and contacts stay"
        } in your workspace.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        destructive
        loading={deleting}
        closeOnConfirm={false}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
