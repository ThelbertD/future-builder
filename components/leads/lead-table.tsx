"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, MessageSquarePlus, MoreHorizontal, MoveRight, Sparkles } from "lucide-react";

import { IntentBadge, ScoreMeter, StatusBadge } from "@/components/common/indicators";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatRelative } from "@/lib/utils";
import type { LeadWithRelations } from "@/types";

export type LeadSortKey = "score" | "posted" | "company" | "value";

interface LeadTableProps {
  leads: LeadWithRelations[];
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  sort: LeadSortKey;
  onSortChange: (sort: LeadSortKey) => void;
  onAction?: (action: string, lead: LeadWithRelations) => void;
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSortChange,
}: {
  label: string;
  sortKey: LeadSortKey;
  sort: LeadSortKey;
  onSortChange: (sort: LeadSortKey) => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          sort === sortKey && "text-foreground",
        )}
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );
}

export function LeadTable({ leads, selected, onSelectedChange, sort, onSortChange, onAction }: LeadTableProps) {
  const router = useRouter();
  const allSelected = leads.length > 0 && selected.length === leads.length;

  const toggleAll = () => onSelectedChange(allSelected ? [] : leads.map((lead) => lead.id));

  const toggleOne = (id: string) =>
    onSelectedChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-9 pr-0">
                <Checkbox
                  checked={allSelected ? true : selected.length > 0 ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all leads"
                />
              </TableHead>
              <SortableHead label="Company" sortKey="company" sort={sort} onSortChange={onSortChange} />
              <TableHead>Opportunity</TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <SortableHead label="AI score" sortKey="score" sort={sort} onSortChange={onSortChange} />
              <TableHead>Intent</TableHead>
              <TableHead className="hidden xl:table-cell">Location</TableHead>
              <SortableHead label="Posted" sortKey="posted" sort={sort} onSortChange={onSortChange} />
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                data-state={selected.includes(lead.id) ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <TableCell className="pr-0" onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    checked={selected.includes(lead.id)}
                    onCheckedChange={() => toggleOne(lead.id)}
                    aria-label={`Select ${lead.company.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lead.company.name}</span>
                    {lead.analysis ? <Sparkles className="size-3 text-primary" aria-label="AI qualified" /> : null}
                  </div>
                  <p className="text-[12px] text-muted-foreground">{lead.contact?.fullName ?? lead.company.industry}</p>
                </TableCell>
                <TableCell className="max-w-[240px]">
                  <p className="truncate">{lead.jobPost?.title}</p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{lead.source}</TableCell>
                <TableCell>
                  <ScoreMeter score={lead.score} />
                </TableCell>
                <TableCell>
                  <IntentBadge intent={lead.intent} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">{lead.company.location}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {lead.jobPost ? formatRelative(lead.jobPost.postedAt) : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <RowActions lead={lead} onAction={onAction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={`/leads/${lead.id}`}
              className="block rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{lead.company.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{lead.jobPost?.title}</p>
                </div>
                <IntentBadge intent={lead.intent} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <ScoreMeter score={lead.score} />
                <StatusBadge status={lead.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {lead.source} · {lead.company.location}
                </span>
                <span>{lead.jobPost ? formatRelative(lead.jobPost.postedAt) : ""}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function RowActions({
  lead,
  onAction,
}: {
  lead: LeadWithRelations;
  onAction?: (action: string, lead: LeadWithRelations) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${lead.company.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onAction?.("outreach", lead)}>
          <Sparkles />
          Generate outreach
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction?.("contact", lead)}>
          <MessageSquarePlus />
          Start conversation
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction?.("pipeline", lead)}>
          <MoveRight />
          Move stage
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction?.("archive", lead)} variant="destructive">
          Archive lead
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
