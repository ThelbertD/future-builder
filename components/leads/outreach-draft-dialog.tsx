"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, MessagesSquare } from "lucide-react";

import { AIBadge } from "@/components/ai/ai-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface OutreachDraft {
  companyName: string;
  subject: string;
  body: string;
  conversationId?: string;
}

/** Shows the generated draft for review. Nothing is sent from here. */
export function OutreachDraftDialog({
  draft,
  onOpenChange,
}: {
  draft: OutreachDraft | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [body, setBody] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  // Adopt a new draft during render rather than syncing through an effect.
  const [lastSubject, setLastSubject] = React.useState<string | null>(null);
  if (draft && draft.subject !== lastSubject) {
    setLastSubject(draft.subject);
    setBody(draft.body);
    setCopied(false);
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${draft?.subject ?? ""}\n\n${body}`);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked; the text is selectable either way.
    }
  };

  return (
    <Dialog open={draft !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Outreach draft
            <AIBadge label="Generated" size="sm" />
          </DialogTitle>
          <DialogDescription>
            Written from this lead&apos;s posting and score. Saved as a draft on the conversation — nothing is
            sent until you send it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <p className="rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[13px]">
              {draft?.subject}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="draft-body">Message to {draft?.companyName}</Label>
            <Textarea
              id="draft-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-[240px] leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
          {draft?.conversationId ? (
            <Button asChild size="sm">
              <Link href={`/conversations?c=${draft.conversationId}`}>
                <MessagesSquare />
                Open in conversations
              </Link>
            </Button>
          ) : (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
