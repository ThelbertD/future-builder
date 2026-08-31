"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUS_LABELS, SOURCES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface LeadFilters {
  query: string;
  status: string;
  intent: string;
  source: string;
  minScore: string;
}

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  query: "",
  status: "all",
  intent: "all",
  source: "all",
  minScore: "0",
};

const SCORE_OPTIONS = [
  { label: "Any score", value: "0" },
  { label: "60+", value: "60" },
  { label: "75+", value: "75" },
  { label: "85+", value: "85" },
  { label: "90+", value: "90" },
];

interface FilterBarProps {
  filters: LeadFilters;
  onChange: (filters: LeadFilters) => void;
  resultCount: number;
  className?: string;
  children?: React.ReactNode;
}

export function FilterBar({ filters, onChange, resultCount, className, children }: FilterBarProps) {
  const set = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_LEAD_FILTERS);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(event) => set("query", event.target.value)}
          placeholder="Search companies, roles, contacts…"
          className="pl-8"
        />
      </div>

      <Select value={filters.status} onValueChange={(value) => set("status", value)}>
        <SelectTrigger className="w-auto min-w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.intent} onValueChange={(value) => set("intent", value)}>
        <SelectTrigger className="w-auto min-w-[110px]">
          <SelectValue placeholder="Intent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any intent</SelectItem>
          <SelectItem value="hot">Hot</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.source} onValueChange={(value) => set("source", value)}>
        <SelectTrigger className="hidden w-auto min-w-[120px] lg:flex">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {SOURCES.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.minScore} onValueChange={(value) => set("minScore", value)}>
        <SelectTrigger className="hidden w-auto min-w-[110px] lg:flex">
          <SelectValue placeholder="Score" />
        </SelectTrigger>
        <SelectContent>
          {SCORE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_LEAD_FILTERS)}>
          <X />
          Clear
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          <SlidersHorizontal />
          More filters
        </Button>
      )}

      <span className="ml-auto shrink-0 text-[12px] text-muted-foreground tabular-nums">
        {resultCount} results
      </span>
      {children}
    </div>
  );
}

export function applyLeadFilters<
  T extends {
    company: { name: string; industry: string; location: string };
    contact?: { fullName: string };
    jobPost?: { title: string };
    status: string;
    intent: string;
    source: string;
    score: number;
  },
>(leads: T[], filters: LeadFilters): T[] {
  const query = filters.query.trim().toLowerCase();
  const minScore = Number(filters.minScore);

  return leads.filter((lead) => {
    if (filters.status !== "all" && lead.status !== filters.status) return false;
    if (filters.intent !== "all" && lead.intent !== filters.intent) return false;
    if (filters.source !== "all" && lead.source !== filters.source) return false;
    if (lead.score < minScore) return false;
    if (!query) return true;

    return [
      lead.company.name,
      lead.company.industry,
      lead.company.location,
      lead.contact?.fullName ?? "",
      lead.jobPost?.title ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}
