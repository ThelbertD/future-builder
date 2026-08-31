import * as React from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The single visual signature for anything the AI produced.
 * Used across leads, conversations, pipeline cards and activity.
 */
export function AIBadge({
  label = "AI",
  className,
  size = "default",
}: {
  label?: string;
  className?: string;
  size?: "sm" | "default";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-primary/25 bg-primary/10 font-medium text-primary",
        size === "sm" ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[11px]",
        className,
      )}
    >
      <Sparkles className={size === "sm" ? "size-2.5" : "size-3"} aria-hidden />
      {label}
    </span>
  );
}

export function AIStatusDot({ online = true, className }: { online?: boolean; className?: string }) {
  return (
    <span className={cn("relative flex size-1.5", className)} aria-hidden>
      <span
        className={cn(
          "absolute inline-flex size-full rounded-full opacity-60",
          online ? "animate-ping bg-success" : "bg-muted-foreground",
        )}
      />
      <span className={cn("relative inline-flex size-1.5 rounded-full", online ? "bg-success" : "bg-muted-foreground")} />
    </span>
  );
}

export function AIThinking({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label="AI is thinking">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1 rounded-full bg-primary animate-[thinking_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: `${index * 0.16}s` }}
        />
      ))}
    </span>
  );
}
