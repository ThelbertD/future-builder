import * as React from "react";

import { cn } from "@/lib/utils";

/** Future Builder mark — two ascending bars forming an abstract "F". */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
        <path d="M3 12.5V3.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        <path d="M3 8h6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
    </span>
  );
}

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight">Future Builder</span>
          <span className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
            AI Client Acquisition OS
          </span>
        </span>
      )}
    </span>
  );
}
