import { CheckCircle2, CircleAlert, Sparkles } from "lucide-react";

import { AIBadge } from "@/components/ai/ai-badge";
import { IntentBadge } from "@/components/common/indicators";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatRelative } from "@/lib/utils";
import type { AIAnalysis, LeadScoreBreakdown } from "@/types";

const BREAKDOWN_LABELS: Record<keyof LeadScoreBreakdown, string> = {
  intentSignals: "Intent signals",
  budgetFit: "Budget fit",
  serviceMatch: "Service match",
  companyFit: "Company fit",
  timing: "Timing",
};

const BREAKDOWN_MAX: Record<keyof LeadScoreBreakdown, number> = {
  intentSignals: 30,
  budgetFit: 22,
  serviceMatch: 24,
  companyFit: 14,
  timing: 10,
};

export function AIInsightCard({
  analysis,
  breakdown,
  className,
}: {
  analysis: AIAnalysis;
  breakdown: LeadScoreBreakdown;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-[15px] font-semibold tracking-tight">AI intelligence</h2>
        </div>
        <AIBadge label={analysis.model} size="sm" />
      </div>

      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="p-4">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">AI score</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl leading-none font-semibold tabular-nums">{analysis.score}</span>
            <span className="text-[13px] text-muted-foreground">/100</span>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">{analysis.confidence}% confidence</p>
        </div>
        <div className="p-4">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Hiring intent</p>
          <div className="mt-2">
            <IntentBadge intent={analysis.intent} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Analysed {formatRelative(analysis.analyzedAt)}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          {(Object.keys(BREAKDOWN_LABELS) as Array<keyof LeadScoreBreakdown>).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[12px] text-muted-foreground">{BREAKDOWN_LABELS[key]}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (breakdown[key] / BREAKDOWN_MAX[key]) * 100)}%` }}
                />
              </span>
              <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                {breakdown[key]}/{BREAKDOWN_MAX[key]}
              </span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Opportunity type</p>
          <p className="mt-1 text-[13px]">{analysis.opportunityType}</p>
        </div>

        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Recommended services
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {analysis.recommendedServices.map((service) => (
              <Badge key={service} variant="primary">
                {service}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">AI reasoning</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{analysis.reasoning}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Signals</p>
            <ul className="mt-1.5 space-y-1">
              {analysis.signals.map((signal) => (
                <li key={signal} className="flex gap-1.5 text-[12px] text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Risks</p>
            <ul className="mt-1.5 space-y-1">
              {analysis.risks.map((risk) => (
                <li key={risk} className="flex gap-1.5 text-[12px] text-muted-foreground">
                  <CircleAlert className="mt-0.5 size-3 shrink-0 text-warning" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-md border border-primary/25 bg-primary/[0.06] p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-primary uppercase">
            <Sparkles className="size-3" />
            Suggested next action
          </p>
          <p className="mt-1 text-[13px] leading-relaxed">{analysis.suggestedNextAction}</p>
        </div>
      </div>
    </Card>
  );
}
