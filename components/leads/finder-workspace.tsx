"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Clock, Plus, Radar, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { AIBadge } from "@/components/ai/ai-badge";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { LeadTable, type LeadSortKey } from "@/components/leads/lead-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATE_RANGES, INDUSTRIES, KEYWORD_SUGGESTIONS, LOCATIONS, SERVICES, SOURCES } from "@/lib/constants";
import { SAVED_SEARCHES } from "@/lib/mock";
import { formatRelative, pluralize } from "@/lib/utils";
import type { LeadWithRelations } from "@/types";

interface SearchState {
  keywords: string[];
  location: string;
  industry: string;
  service: string;
  source: string;
  posted: string;
  minScore: string;
  intent: string;
}

const INITIAL_STATE: SearchState = {
  keywords: ["GoHighLevel Specialist"],
  location: "United States",
  industry: "all",
  service: "all",
  source: "all",
  posted: "7d",
  minScore: "70",
  intent: "all",
};

const SCORE_OPTIONS = ["0", "60", "70", "80", "90"];

function matches(lead: LeadWithRelations, state: SearchState): boolean {
  if (state.minScore !== "0" && lead.score < Number(state.minScore)) return false;
  if (state.intent !== "all" && lead.intent !== state.intent) return false;
  if (state.source !== "all" && lead.source !== state.source) return false;
  if (state.industry !== "all" && lead.company.industry !== state.industry) return false;
  if (state.location !== "Remote" && state.location !== "all" && !lead.company.country.includes(state.location)) {
    return false;
  }
  // Services are advisory: an unanalysed lead is never excluded by this filter.
  if (state.service !== "all" && lead.analysis && !lead.analysis.recommendedServices.includes(state.service)) {
    return false;
  }
  if (state.keywords.length === 0) return true;

  const haystack = `${lead.jobPost?.title ?? ""} ${lead.jobPost?.skills.join(" ") ?? ""}`.toLowerCase();
  return state.keywords.some((keyword) =>
    keyword
      .toLowerCase()
      .split(" ")
      .some((token) => token.length > 2 && haystack.includes(token)),
  );
}

export function FinderWorkspace({ leads }: { leads: LeadWithRelations[] }) {
  const router = useRouter();
  const [state, setState] = React.useState<SearchState>(INITIAL_STATE);
  const [draftKeyword, setDraftKeyword] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<LeadWithRelations[]>(() =>
    leads.filter((lead) => matches(lead, INITIAL_STATE)),
  );
  const [selected, setSelected] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState<LeadSortKey>("score");

  const set = <K extends keyof SearchState>(key: K, value: SearchState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  const addKeyword = (keyword: string) => {
    const value = keyword.trim();
    if (!value || state.keywords.includes(value)) return;
    set("keywords", [...state.keywords, value]);
    setDraftKeyword("");
  };

  const runSearch = React.useCallback(() => {
    setSearching(true);
    window.setTimeout(() => {
      const next = leads.filter((lead) => matches(lead, state));
      setResults(next);
      setSearching(false);
      toast.success("Search complete", {
        description: `${pluralize(next.length, "opportunity", "opportunities")} matched across ${SOURCES.length} sources.`,
      });
    }, 700);
  }, [leads, state]);

  const sorted = React.useMemo(() => {
    const copy = [...results];
    if (sort === "company") return copy.sort((a, b) => a.company.name.localeCompare(b.company.name));
    if (sort === "posted") return copy.sort((a, b) => (b.jobPost?.postedAt ?? "").localeCompare(a.jobPost?.postedAt ?? ""));
    if (sort === "value") return copy.sort((a, b) => b.estimatedValue - a.estimatedValue);
    return copy.sort((a, b) => b.score - a.score);
  }, [results, sort]);

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="finder-keywords">Keywords</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5">
              {state.keywords.map((keyword) => (
                <Badge key={keyword} variant="primary" size="lg" className="gap-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => set("keywords", state.keywords.filter((item) => item !== keyword))}
                    aria-label={`Remove ${keyword}`}
                    className="opacity-70 transition-opacity hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <input
                id="finder-keywords"
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addKeyword(draftKeyword);
                  }
                  if (event.key === "Backspace" && !draftKeyword && state.keywords.length) {
                    set("keywords", state.keywords.slice(0, -1));
                  }
                }}
                placeholder="Add a role or skill…"
                className="min-w-[160px] flex-1 bg-transparent py-0.5 text-[13px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {KEYWORD_SUGGESTIONS.filter((keyword) => !state.keywords.includes(keyword))
                .slice(0, 6)
                .map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => addKeyword(keyword)}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Plus className="mr-1 inline size-2.5" />
                    {keyword}
                  </button>
                ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select value={state.location} onValueChange={(value) => set("location", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select value={state.industry} onValueChange={(value) => set("industry", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select value={state.service} onValueChange={(value) => set("service", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {SERVICES.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={state.source} onValueChange={(value) => set("source", value)}>
                <SelectTrigger>
                  <SelectValue />
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
            </div>

            <div className="space-y-1.5">
              <Label>Date posted</Label>
              <Select value={state.posted} onValueChange={(value) => set("posted", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Minimum AI score</Label>
              <Select value={state.minScore} onValueChange={(value) => set("minScore", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCORE_OPTIONS.map((score) => (
                    <SelectItem key={score} value={score}>
                      {score === "0" ? "Any score" : `${score}+`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Intent</Label>
              <Select value={state.intent} onValueChange={(value) => set("intent", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any intent</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={runSearch} loading={searching}>
                <Search />
                Search
              </Button>
              <Button variant="outline" size="icon" aria-label="Advanced filters">
                <SlidersHorizontal />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
          <AIBadge label="AI scoring on" size="sm" />
          <span className="text-[12px] text-muted-foreground">
            Every result is scored and explained before it reaches your pipeline.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => toast.success("Search saved", { description: "It will run every 6 hours." })}
          >
            <Bookmark />
            Save this search
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3 xl:order-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              {searching ? "Searching…" : `${results.length} opportunities`}
            </h2>
            {selected.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.success("Added to pipeline", {
                      description: `${pluralize(selected.length, "lead")} moved to Ready to Contact.`,
                    })
                  }
                >
                  Add to pipeline
                </Button>
                <Button size="sm" onClick={() => router.push("/outreach")}>
                  <Sparkles />
                  Generate outreach
                </Button>
              </div>
            ) : null}
          </div>

          {searching ? (
            <TableSkeleton rows={6} columns={7} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={Radar}
              title="No opportunities matched"
              description="Try a broader keyword, a lower score threshold, or a wider date range. Saved searches keep looking in the background."
              action={
                <Button size="sm" variant="outline" onClick={() => setState(INITIAL_STATE)}>
                  Reset search
                </Button>
              }
            />
          ) : (
            <LeadTable
              leads={sorted}
              selected={selected}
              onSelectedChange={setSelected}
              sort={sort}
              onSortChange={setSort}
            />
          )}
        </div>

        <Card className="h-fit p-0 xl:order-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Saved searches</h2>
            <Bookmark className="size-3.5 text-muted-foreground" />
          </div>
          <ul className="divide-y divide-border">
            {SAVED_SEARCHES.map((search) => (
              <li key={search.id} className="px-4 py-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setState((current) => ({
                      ...current,
                      keywords: [...search.keywords],
                      location: search.location,
                      industry: search.industry,
                      minScore: String(search.minScore),
                    }));
                    toast(`Loaded "${search.name}"`, { description: "Press Search to run it now." });
                  }}
                >
                  <p className="text-[13px] font-medium">{search.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    Every {search.cadenceHours}h · ran {formatRelative(search.lastRunAt)}
                  </p>
                </button>
                {search.newResults > 0 ? (
                  <Badge variant="primary" className="mt-2">
                    {search.newResults} new
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
