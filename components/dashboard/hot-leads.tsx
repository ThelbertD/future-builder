import Link from "next/link";
import { ArrowRight, MessageSquarePlus, MoveRight } from "lucide-react";

import { IntentBadge, ScoreMeter, StatusBadge } from "@/components/common/indicators";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelative } from "@/lib/utils";
import type { LeadWithRelations } from "@/types";

export function HotLeads({ leads }: { leads: LeadWithRelations[] }) {
  if (leads.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
        No open opportunities yet. Run a search to fill this list.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {leads.map((lead) => (
        <li key={lead.id} className="group flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/leads/${lead.id}`} className="truncate text-[13px] font-medium hover:text-primary">
                {lead.company.name}
              </Link>
              <IntentBadge intent={lead.intent} />
            </div>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{lead.jobPost?.title}</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <ScoreMeter score={lead.score} />
            <StatusBadge status={lead.status} className="hidden md:inline-flex" />
            <span className="hidden w-20 text-right text-[12px] tabular-nums text-muted-foreground lg:block">
              {formatCurrency(lead.estimatedValue)}
            </span>
            <span className="hidden w-12 text-right text-[11px] text-muted-foreground xl:block">
              {formatRelative(lead.lastActivityAt)}
            </span>

            <div className="ml-auto flex items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <Button asChild variant="ghost" size="icon-sm" aria-label="View lead">
                <Link href={`/leads/${lead.id}`}>
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon-sm" aria-label="Contact lead">
                <Link href="/conversations">
                  <MessageSquarePlus />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon-sm" aria-label="Move stage">
                <Link href="/pipeline">
                  <MoveRight />
                </Link>
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
