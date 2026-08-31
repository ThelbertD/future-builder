import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";

import { AIBadge } from "@/components/ai/ai-badge";
import { Button } from "@/components/ui/button";
import { DASHBOARD_METRICS, HOT_LEADS } from "@/lib/mock";
import { formatNumber } from "@/lib/utils";

/** Static, hand-built product preview. No screenshots to go stale. */
function ProductPreview() {
  const bars = [38, 52, 44, 61, 57, 72, 66, 81, 74, 88, 79, 94];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-muted-foreground/25" />
          <span className="size-2 rounded-full bg-muted-foreground/25" />
          <span className="size-2 rounded-full bg-muted-foreground/25" />
        </span>
        <span className="ml-2 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
          app.futurebuilder.ai/dashboard
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-success">
          <span className="size-1.5 rounded-full bg-success" />
          AI online
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border sm:grid-cols-6">
        {DASHBOARD_METRICS.map((metric) => (
          <div key={metric.key} className="p-2.5">
            <p className="truncate text-[9px] tracking-wide text-muted-foreground uppercase">{metric.label}</p>
            <p className="mt-1 text-[15px] leading-none font-semibold tabular-nums">{formatNumber(metric.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium">Lead acquisition activity</p>
            <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">30 days</span>
          </div>
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {bars.map((height, index) => (
              <span key={index} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-chart-1" />
              Discovered
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-chart-2" />
              Qualified
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-chart-3" />
              Contacted
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border">
          <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
            <Sparkles className="size-3 text-primary" />
            <p className="text-[11px] font-medium">Hot leads</p>
          </div>
          <ul className="divide-y divide-border">
            {HOT_LEADS.slice(0, 4).map((lead) => (
              <li key={lead.id} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium">{lead.company.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{lead.jobPost?.title}</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-primary">{lead.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-grid opacity-[0.35]" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 72%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-14 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <AIBadge label="AI Client Acquisition OS" className="mx-auto" />
          <h1 className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-[56px]">
            Find your next client before they find someone else.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            AI-powered client discovery, qualification, outreach, conversations, and appointment booking. All in one
            workspace built for service businesses.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                Start finding clients
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard">
                <PlayCircle />
                Watch demo
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-[12px] text-muted-foreground">
            No credit card required. Explore the full workspace with a sample pipeline.
          </p>
        </div>

        <div className="mt-14">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
