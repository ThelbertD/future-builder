"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { IntentBadge, ScoreMeter } from "@/components/common/indicators";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScoredJob } from "@/lib/scraper/scoring";
import { formatRelative } from "@/lib/utils";

interface DiscoveryTableProps {
  jobs: ScoredJob[];
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
}

/** Results that are not in the workspace yet, straight from the sources. */
export function DiscoveryTable({ jobs, selected, onSelectedChange }: DiscoveryTableProps) {
  const allSelected = jobs.length > 0 && selected.length === jobs.length;

  const toggleAll = () => onSelectedChange(allSelected ? [] : jobs.map((job) => job.id));
  const toggleOne = (id: string) =>
    onSelectedChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);

  return (
    <>
      <div className="hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-9 pr-0">
                <Checkbox
                  checked={allSelected ? true : selected.length > 0 ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all results"
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead className="hidden xl:table-cell">Location</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} data-state={selected.includes(job.id) ? "selected" : undefined}>
                <TableCell className="pr-0">
                  <Checkbox
                    checked={selected.includes(job.id)}
                    onCheckedChange={() => toggleOne(job.id)}
                    aria-label={`Select ${job.companyName}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium">{job.companyName}</p>
                  <p className="text-[12px] text-muted-foreground">{job.engagementType}</p>
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="truncate">{job.title}</p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">{job.reasoning}</TooltipContent>
                  </Tooltip>
                  {job.recommendedServices.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {job.recommendedServices.slice(0, 2).map((service) => (
                        <Badge key={service} variant="primary" className="text-[10px]">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{job.sourceName}</TableCell>
                <TableCell>
                  <ScoreMeter score={job.score} />
                </TableCell>
                <TableCell>
                  <IntentBadge intent={job.intent} />
                </TableCell>
                <TableCell className="hidden max-w-[160px] truncate text-muted-foreground xl:table-cell">
                  {job.location}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatRelative(job.postedAt)}
                </TableCell>
                <TableCell>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground transition-colors hover:text-primary"
                    aria-label={`Open the original posting for ${job.companyName}`}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2 md:hidden">
        {jobs.map((job) => (
          <li key={job.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={selected.includes(job.id)}
                onCheckedChange={() => toggleOne(job.id)}
                aria-label={`Select ${job.companyName}`}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{job.companyName}</p>
                <p className="truncate text-[12px] text-muted-foreground">{job.title}</p>
              </div>
              <IntentBadge intent={job.intent} />
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <ScoreMeter score={job.score} />
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
              >
                {job.sourceName}
                <ExternalLink className="size-3" />
              </a>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {job.location} · {formatRelative(job.postedAt)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
