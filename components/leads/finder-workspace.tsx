"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  CircleAlert,
  Clock,
  Download,
  Plus,
  Radar,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { importLeadsAction, searchLeadsAction } from "@/app/(dashboard)/finder/actions";
import { AIBadge } from "@/components/ai/ai-badge";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { DiscoveryTable } from "@/components/leads/discovery-table";
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
import { DATE_RANGES, INDUSTRIES, KEYWORD_SUGGESTIONS, LOCATIONS, SERVICES } from "@/lib/constants";
import type { ScoredJob } from "@/lib/scraper/scoring";
import type { SourceOutcome } from "@/lib/scraper/types";
import { cn, formatRelative, pluralize } from "@/lib/utils";
import type { SavedSearch } from "@/types";

interface SearchState {
  keywords: string[];
  location: string;
  industry: string;
  service: string;
  posted: string;
  minScore: string;
  intent: string;
}

const INITIAL_STATE: SearchState = {
  keywords: ["Automation", "GoHighLevel", "CRM"],
  location: "United States",
  industry: "all",
  service: "all",
  posted: "30d",
  minScore: "0",
  intent: "all",
};

const SCORE_OPTIONS = ["0", "50", "60", "70", "80"];
const DAYS_BY_RANGE: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };

export function FinderWorkspace({ savedSearches }: { savedSearches: SavedSearch[] }) {
  const router = useRouter();
  const [state, setState] = React.useState<SearchState>(INITIAL_STATE);
  const [draftKeyword, setDraftKeyword] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [results, setResults] = React.useState<ScoredJob[]>([]);
  const [outcomes, setOutcomes] = React.useState<SourceOutcome[]>([]);
  const [fetched, setFetched] = React.useState(0);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  const set = <K extends keyof SearchState>(key: K, value: SearchState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  const addKeyword = (keyword: string) => {
    const value = keyword.trim();
    if (!value || state.keywords.includes(value)) return;
    set("keywords", [...state.keywords, value]);
    setDraftKeyword("");
  };

  const runSearch = async (override?: SearchState) => {
    const query = override ?? state;
    setSearching(true);
    setSelected([]);

    const response = await searchLeadsAction({
      keywords: query.keywords,
      location: query.location,
      industry: query.industry === "all" ? undefined : query.industry,
      service: query.service === "all" ? undefined : query.service,
      postedWithinDays: DAYS_BY_RANGE[query.posted] ?? 30,
      minScore: Number(query.minScore),
      intent: query.intent === "all" ? undefined : query.intent,
    });

    setSearching(false);
    setHasSearched(true);
    setOutcomes(response.outcomes);
    setFetched(response.fetched);

    if (!response.ok) {
      setResults([]);
      toast.error("Search failed", { description: response.error });
      return;
    }

    setResults(response.jobs);

    const live = response.outcomes.filter((outcome) => outcome.ok).length;
    toast.success("Search complete", {
      description: `${pluralize(response.jobs.length, "opportunity", "opportunities")} matched from ${response.fetched} postings across ${live} sources.`,
    });
  };

  const importSelected = async () => {
    const chosen = results.filter((job) => selected.includes(job.id));
    if (chosen.length === 0) return;

    setImporting(true);
    const response = await importLeadsAction(chosen);
    setImporting(false);

    if (!response.ok) {
      toast.error("Import failed", { description: response.error });
      return;
    }

    toast.success(`${pluralize(response.imported, "lead")} imported`, {
      description:
        response.skipped > 0
          ? `${response.skipped} were already in your workspace.`
          : "They are in the first stage of your pipeline.",
    });

    setSelected([]);
    router.refresh();
  };

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
              <Label>Minimum score</Label>
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

            <div className="flex items-end gap-2 lg:col-span-2">
              <Button className="flex-1" onClick={() => void runSearch()} loading={searching}>
                <Search />
                Search live sources
              </Button>
              <Button variant="outline" size="icon" aria-label="Advanced filters">
                <SlidersHorizontal />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
          <AIBadge label="Scoring on" size="sm" />
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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight">
              {searching ? "Searching live sources…" : `${results.length} opportunities`}
            </h2>

            {outcomes.length > 0 && !searching ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {outcomes.map((outcome) => (
                  <Badge
                    key={outcome.sourceId}
                    variant={outcome.ok ? "outline" : "warning"}
                    title={outcome.error}
                  >
                    {!outcome.ok ? <CircleAlert /> : null}
                    {outcome.sourceName} {outcome.ok ? outcome.count : "unavailable"}
                  </Badge>
                ))}
              </div>
            ) : null}

            {selected.length > 0 ? (
              <div className="ml-auto flex items-center gap-1.5">
                <Button size="sm" onClick={() => void importSelected()} loading={importing}>
                  <Download />
                  Import {selected.length} to pipeline
                </Button>
              </div>
            ) : null}
          </div>

          {searching ? (
            <TableSkeleton rows={6} columns={7} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={Radar}
              title={hasSearched ? "No opportunities matched" : "Run your first search"}
              description={
                hasSearched
                  ? `Scanned ${fetched} live postings. Try a broader keyword, a lower score threshold, or a wider date range.`
                  : "Searches run against live job feeds. Pick your keywords and press Search to see who is hiring right now."
              }
              action={
                <Button size="sm" onClick={() => void runSearch()} loading={searching}>
                  <Search />
                  {hasSearched ? "Search again" : "Search live sources"}
                </Button>
              }
              secondaryAction={
                hasSearched ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setState(INITIAL_STATE);
                      void runSearch(INITIAL_STATE);
                    }}
                  >
                    Reset filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <DiscoveryTable jobs={results} selected={selected} onSelectedChange={setSelected} />
          )}
        </div>

        <Card className="h-fit p-0 xl:order-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Saved searches</h2>
            <Bookmark className="size-3.5 text-muted-foreground" />
          </div>
          {savedSearches.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              Save a search to keep it running in the background.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {savedSearches.map((search) => (
                <li key={search.id} className={cn("px-4 py-3")}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      const next: SearchState = {
                        ...state,
                        keywords: [...search.keywords],
                        location: search.location || state.location,
                        industry: search.industry || "all",
                        minScore: String(search.minScore),
                      };
                      setState(next);
                      void runSearch(next);
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
          )}
        </Card>
      </div>
    </div>
  );
}
