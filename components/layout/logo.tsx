import * as React from "react";

import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** NexusOS mark — one unbroken stroke tracing an "N". */
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
        <path
          d="M4 12.5v-9l8 9v-9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </span>
  );
}

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo />
      {compact ? null : (
        // Read from BRAND rather than repeated here, so the name lives in one
        // place and a rename cannot leave the sidebar behind.
        <span className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight">{BRAND.name}</span>
          <span className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
            {BRAND.subtitle}
          </span>
        </span>
      )}
    </span>
  );
}
