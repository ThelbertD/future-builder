"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  Info,
  Mail,
  MessagesSquare,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { AIBadge, AIThinking } from "@/components/ai/ai-badge";
import { EmptyState } from "@/components/common/empty-state";
import { IntentBadge, ScoreMeter, StatusBadge } from "@/components/common/indicators";
import { ConversationList, type InboxFilter } from "@/components/conversations/conversation-list";
import { MessageBubble } from "@/components/conversations/message-bubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, createLocalId, initials, nowIso } from "@/lib/utils";
import type { Conversation, LeadWithRelations, Message } from "@/types";

interface WorkspaceProps {
  conversations: Conversation[];
  leads: LeadWithRelations[];
  initialConversationId?: string;
}

export function ConversationsWorkspace({ conversations: initial, leads, initialConversationId }: WorkspaceProps) {
  const [conversations, setConversations] = React.useState(initial);
  const [activeId, setActiveId] = React.useState<string | null>(
    initialConversationId ?? initial[0]?.id ?? null,
  );
  const [filter, setFilter] = React.useState<InboxFilter>("all");
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [drafting, setDrafting] = React.useState(false);
  const [mobileDetail, setMobileDetail] = React.useState(false);

  const leadFor = React.useCallback(
    (conversation: Conversation) => leads.find((lead) => lead.id === conversation.leadId),
    [leads],
  );

  const companyNameFor = React.useCallback(
    (conversation: Conversation) => leadFor(conversation)?.company.name ?? "Unknown company",
    [leadFor],
  );

  const visible = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (filter === "unread" && conversation.unreadCount === 0) return false;
      if (filter === "ai" && conversation.mode !== "ai") return false;
      if (filter === "human" && conversation.mode !== "human") return false;
      if (filter === "attention" && !conversation.needsAttention) return false;
      if (!search) return true;
      return `${conversation.subject} ${companyNameFor(conversation)}`.toLowerCase().includes(search);
    });
  }, [conversations, filter, query, companyNameFor]);

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const activeLead = active ? leadFor(active) : undefined;

  const select = (id: string) => {
    setActiveId(id);
    setMobileDetail(true);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unreadCount: 0, needsAttention: false } : conversation,
      ),
    );
  };

  const send = () => {
    if (!draft.trim() || !active) return;
    const message: Message = {
      id: createLocalId("msg"),
      workspaceId: active.workspaceId,
      conversationId: active.id,
      author: "human",
      authorName: "Thelbert Delos Reyes",
      body: draft.trim(),
      channel: active.channel,
      sentAt: nowIso(),
      isDraft: false,
    };
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === active.id
          ? {
              ...conversation,
              messages: [...conversation.messages, message],
              lastMessagePreview: message.body.slice(0, 96),
              lastMessageAt: message.sentAt,
              mode: "human",
            }
          : conversation,
      ),
    );
    setDraft("");
  };

  const draftWithAI = () => {
    if (!active) return;
    setDrafting(true);
    window.setTimeout(() => {
      setDraft(
        "Thanks for the detail — that helps. The build usually runs two weeks: follow-up sequences and calendar routing first, then the reporting layer.\n\nI have Thursday 10:00 or Friday 14:00 open for a 20-minute walkthrough. Which suits better?",
      );
      setDrafting(false);
      toast.success("Draft ready", { description: "Review before sending — nothing goes out automatically." });
    }, 800);
  };

  const toggleMode = () => {
    if (!active) return;
    const nextMode = active.mode === "ai" ? "human" : "ai";
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === active.id ? { ...conversation, mode: nextMode } : conversation,
      ),
    );
    toast.success(nextMode === "ai" ? "AI has the conversation" : "You have taken over", {
      description:
        nextMode === "ai"
          ? "The assistant will reply and book from here."
          : "The assistant will stop replying on this thread.",
    });
  };

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* List */}
      <div className={cn("h-full min-h-0 border-r border-border lg:block", mobileDetail && "hidden")}>
        <ConversationList
          conversations={visible}
          activeId={activeId}
          onSelect={select}
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
          companyNameFor={companyNameFor}
        />
      </div>

      {/* Thread */}
      <div className={cn("flex h-full min-h-0 flex-col lg:flex", !mobileDetail && "hidden lg:flex")}>
        {active && activeLead ? (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                onClick={() => setMobileDetail(false)}
                aria-label="Back to conversations"
              >
                <ArrowLeft />
              </Button>
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-medium text-muted-foreground">
                {initials(activeLead.company.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{activeLead.company.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {active.contactId ? activeLead.contact?.fullName : "Unassigned"} · {active.channel}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Button variant={active.mode === "ai" ? "secondary" : "outline"} size="sm" onClick={toggleMode}>
                  {active.mode === "ai" ? <Sparkles /> : <User />}
                  {active.mode === "ai" ? "AI replying" : "You are replying"}
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin p-4">
              {active.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {drafting ? (
                <div className="flex items-center justify-end gap-2 pr-1 text-[12px] text-muted-foreground">
                  <AIThinking />
                  Drafting a reply…
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-border p-3">
              <div className="relative">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type a message…  (⌘ + Enter to send)"
                  className="min-h-[84px] pr-2 pb-10"
                />
                <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={draftWithAI} loading={drafting}>
                    <Sparkles />
                    Draft with AI
                  </Button>
                  <Button size="sm" className="ml-auto" onClick={send} disabled={!draft.trim()}>
                    <Send />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="No conversation selected"
            description="Pick a thread on the left, or start one from a lead. Every reply is logged against the opportunity."
            className="m-4 flex-1 border-none"
          />
        )}
      </div>

      {/* Lead context */}
      <aside className="hidden h-full min-h-0 flex-col overflow-y-auto scrollbar-thin border-l border-border lg:flex">
        {activeLead ? (
          <div className="space-y-4 p-4">
            <div>
              <p className="text-[13px] font-medium">{activeLead.company.name}</p>
              <p className="text-[12px] text-muted-foreground">{activeLead.company.industry}</p>
            </div>

            <div className="flex items-center justify-between">
              <ScoreMeter score={activeLead.score} />
              <IntentBadge intent={activeLead.intent} />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Stage</p>
              <StatusBadge status={activeLead.status} />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Opportunity</p>
              <p className="text-[13px]">{activeLead.jobPost?.title}</p>
            </div>

            {activeLead.analysis ? (
              <div className="rounded-md border border-primary/25 bg-primary/[0.06] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-primary uppercase">
                  <Sparkles className="size-3" />
                  AI insight
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {activeLead.analysis.suggestedNextAction}
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Contact</p>
              {activeLead.contact ? (
                <div className="space-y-1 text-[12px]">
                  <p>{activeLead.contact.fullName}</p>
                  <p className="text-muted-foreground">{activeLead.contact.title}</p>
                  <a
                    href={`mailto:${activeLead.contact.email}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="size-3" />
                    {activeLead.contact.email}
                  </a>
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">No contact identified.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {activeLead.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid gap-1.5">
              <Button asChild variant="outline" size="sm">
                <Link href={`/leads/${activeLead.id}`}>
                  <Info />
                  Open lead
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/companies/${activeLead.companyId}`}>
                  <Building2 />
                  Open company
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/appointments">
                  <CalendarPlus />
                  Book appointment
                </Link>
              </Button>
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Thread status</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {active?.mode === "ai" ? <AIBadge label="AI handling" size="sm" /> : <Badge variant="outline">Human</Badge>}
                <span className="text-[11px] text-muted-foreground">{active?.messages.length} messages</span>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
