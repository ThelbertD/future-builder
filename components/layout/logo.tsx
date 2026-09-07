import * as React from "react";

import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** NexusOS mark — one unbroken stroke tracing an "N". */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[7px] bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" fill="none" className="size-[18px]">
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
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[16px] font-semibold tracking-tight">{BRAND.name}</span>
          <span className="mt-1 truncate text-[11px] tracking-wide text-muted-foreground uppercase">
            {BRAND.subtitle}
          </span>
        </span>
      )}
    </span>
  );
}
