"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createLocalId, formatRelative, MOCK_NOW, nowIso } from "@/lib/utils";

interface Note {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export function LeadNotes({ initialNote, authorName }: { initialNote?: string; authorName: string }) {
  const [notes, setNotes] = React.useState<Note[]>(
    initialNote
      ? [
          {
            id: "note_seed",
            author: authorName,
            body: initialNote,
            createdAt: new Date(MOCK_NOW.getTime() - 36 * 3_600_000).toISOString(),
          },
        ]
      : [],
  );
  const [draft, setDraft] = React.useState("");

  const add = () => {
    if (!draft.trim()) return;
    setNotes((current) => [
      { id: createLocalId("note"), author: authorName, body: draft.trim(), createdAt: nowIso() },
      ...current,
    ]);
    setDraft("");
    toast.success("Note added");
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a note for your team…"
          className="min-h-[72px]"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={add} disabled={!draft.trim()}>
            Add note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium">{note.author}</span>
                <span className="text-[11px] text-muted-foreground">{formatRelative(note.createdAt)}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
