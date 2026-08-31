"use client";

import * as React from "react";
import { Search, Sparkles, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatRelative, initials } from "@/lib/utils";
import type { Conversation } from "@/types";

export type InboxFilter = "all" | "unread" | "ai" | "human" | "attention";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  companyNameFor: (conversation: Conversation) => string;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  companyNameFor,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-border">
      <div className="space-y-2 border-b border-border p-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search conversations…"
            className="pl-8"
          />
        </div>
        <Tabs value={filter} onValueChange={(value) => onFilterChange(value as InboxFilter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">
              AI
            </TabsTrigger>
            <TabsTrigger value="attention" className="flex-1">
              Attention
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ul className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations.map((conversation) => {
          const company = companyNameFor(conversation);
          const active = conversation.id === activeId;

          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  "flex w-full gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors",
                  active ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-medium text-muted-foreground">
                  {initials(company)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium">{company}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {formatRelative(conversation.lastMessageAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-muted-foreground">
                    {conversation.lastMessagePreview}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5">
                    {conversation.mode === "ai" ? (
                      <Badge variant="primary" className="gap-1">
                        <Sparkles />
                        AI
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <User />
                        Human
                      </Badge>
                    )}
                    {conversation.needsAttention ? <Badge variant="warning">Needs you</Badge> : null}
                    {conversation.unreadCount > 0 ? (
                      <Badge variant="solid" className="ml-auto tabular-nums">
                        {conversation.unreadCount}
                      </Badge>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
