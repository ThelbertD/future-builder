import { Sparkles, User } from "lucide-react";

import { cn, formatTime } from "@/lib/utils";
import type { Message } from "@/types";

export function MessageBubble({ message }: { message: Message }) {
  if (message.author === "system") {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] text-muted-foreground">{message.body}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const outbound = message.author === "ai" || message.author === "human";

  return (
    <div className={cn("flex flex-col gap-1", outbound ? "items-end" : "items-start")}>
      <div className="flex items-center gap-1.5 px-1">
        {message.author === "ai" ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-primary/25 bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="size-2.5" />
            AI generated
          </span>
        ) : null}
        {message.author === "human" ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
            <User className="size-2.5" />
            You
          </span>
        ) : null}
        <span className="text-[11px] text-muted-foreground">
          {message.author === "prospect" ? message.authorName : ""} {formatTime(message.sentAt)}
        </span>
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-lg border px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
          outbound
            ? message.author === "ai"
              ? "border-primary/20 bg-primary/[0.07]"
              : "border-border bg-secondary"
            : "border-border bg-card",
        )}
      >
        {message.body}
      </div>
    </div>
  );
}
