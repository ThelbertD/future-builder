"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this view. Your data is safe — try again in a moment.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10">
        <AlertTriangle className="size-4 text-destructive" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
