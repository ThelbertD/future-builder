"use client";

import * as React from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical } from "lucide-react";

import { AIBadge } from "@/components/ai/ai-badge";
import { IntentBadge, ScoreMeter } from "@/components/common/indicators";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatRelative } from "@/lib/utils";
import type { LeadWithRelations } from "@/types";

export function PipelineCardContent({ lead, dragging }: { lead: LeadWithRelations; dragging?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 transition-colors",
        dragging ? "border-primary/50 shadow-2xl" : "hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${lead.id}`}
          onClick={(event) => event.stopPropagation()}
          className="truncate text-[13px] font-medium hover:text-primary"
        >
          {lead.company.name}
        </Link>
        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60" />
      </div>

      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{lead.jobPost?.title}</p>

      {lead.contact ? (
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{lead.contact.fullName}</p>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <ScoreMeter score={lead.score} showBar={false} />
        <IntentBadge intent={lead.intent} />
      </div>

      {lead.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {formatRelative(lead.stageEnteredAt)}
        </span>
        <span className="tabular-nums">{formatCurrency(lead.estimatedValue)}</span>
      </div>

      {lead.analysis ? <AIBadge label="AI qualified" size="sm" className="mt-2" /> : null}
    </div>
  );
}

export function PipelineCard({ lead }: { lead: LeadWithRelations }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <PipelineCardContent lead={lead} />
    </div>
  );
}
