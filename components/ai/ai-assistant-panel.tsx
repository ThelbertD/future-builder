"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Sparkles } from "lucide-react";

import { AIBadge, AIThinking } from "@/components/ai/ai-badge";
import { useShell } from "@/components/layout/shell-context";
import { IntentBadge, ScoreMeter } from "@/components/common/indicators";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { HOT_LEADS } from "@/lib/mock";
import { cn } from "@/lib/utils";
import type { LeadWithRelations } from "@/types";

interface AssistantMessage {
  id: string;
  author: "user" | "ai";
  body: string;
  leads?: LeadWithRelations[];
}

const SUGGESTIONS = [
  "Which leads should I contact today?",
  "Summarise what changed in my pipeline this week",
  "Draft a follow-up for the highest-scoring lead",
  "Which sources are converting best?",
];

/** Canned answers — replaced by a server action once the AI layer is wired up. */
const RESPONSES: Array<{ match: RegExp; body: string; withLeads?: boolean }> = [
  {
    match: /contact|today|priorit/i,
    body: "I found 12 high-intent leads worth your time today. Five posted GoHighLevel-related roles in the last 48 hours and three already replied to earlier outreach. Start with these:",
    withLeads: true,
  },
  {
    match: /pipeline|week|chang/i,
    body: "Your pipeline moved 23 leads this week: 14 entered as AI Qualified, 6 progressed to Interested, and 3 booked calls. Two deals in Negotiation have been static for 9 days — both are waiting on a revised scope from you.",
  },
  {
    match: /draft|follow.?up|write|outreach/i,
    body: "Drafted a follow-up for the highest-scoring lead. It opens on the delay they described in their job post, references a comparable rollout, and closes with two concrete time slots. Open the lead to review and send.",
    withLeads: true,
  },
  {
    match: /source|convert|channel/i,
    body: "LinkedIn is your strongest source: 486 leads at an average score of 81 and 3 closed clients. Referrals score highest (88 average) but the volume is small. Facebook Groups produce volume without conversion — worth pausing.",
  },
];

function answerFor(question: string): AssistantMessage {
  const match = RESPONSES.find((response) => response.match.test(question));
  return {
    id: `ai_${Date.now()}`,
    author: "ai",
    body:
      match?.body ??
      "I can analyse leads, draft outreach, summarise a conversation, or recommend the next action on any opportunity. Ask about a specific lead, stage, or source and I will pull the relevant records.",
    leads: match?.withLeads ? HOT_LEADS.slice(0, 3) : undefined,
  };
}

export function AIAssistantPanel() {
  const { assistantOpen, setAssistantOpen } = useShell();
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [messages, setMessages] = React.useState<AssistantMessage[]>([
    {
      id: "ai_welcome",
      author: "ai",
      body: "I watch your searches, score every new opportunity, and draft outreach. Ask me anything about your pipeline.",
    },
  ]);

  const send = React.useCallback((question: string) => {
    if (!question.trim()) return;
    setMessages((current) => [...current, { id: `user_${Date.now()}`, author: "user", body: question }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, answerFor(question)]);
      setThinking(false);
    }, 750);
  }, []);

  return (
    <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
      <SheetContent side="right" className="w-[440px] gap-0 p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI Assistant
          </SheetTitle>
          <SheetDescription>Grounded in your workspace data. Nothing is sent to prospects here.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={cn(
                  "max-w-[92%] rounded-lg border px-3 py-2 text-[13px] leading-relaxed",
                  message.author === "ai"
                    ? "border-border bg-card"
                    : "ml-auto border-primary/25 bg-primary/10 text-foreground",
                )}
              >
                {message.author === "ai" ? <AIBadge className="mb-1.5" size="sm" /> : null}
                <p>{message.body}</p>
              </div>

              {message.leads?.length ? (
                <div className="space-y-2">
                  {message.leads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      onClick={() => setAssistantOpen(false)}
                      className="block rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{lead.company.name}</p>
                          <p className="truncate text-[12px] text-muted-foreground">{lead.jobPost?.title}</p>
                        </div>
                        <IntentBadge intent={lead.intent} />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <ScoreMeter score={lead.score} />
                        <span className="text-[11px] text-muted-foreground">{lead.company.location}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {thinking ? (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <AIThinking />
              Analysing your workspace…
            </div>
          ) : null}
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="relative">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about a lead, stage, or campaign…"
              className="min-h-[68px] pr-10"
            />
            <Button
              size="icon-sm"
              className="absolute right-2 bottom-2"
              onClick={() => send(input)}
              aria-label="Send message"
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
