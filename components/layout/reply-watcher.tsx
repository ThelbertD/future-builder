"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { syncRepliesAction } from "@/app/(dashboard)/conversations/actions";

/** How often the mailbox is checked while a tab is open and visible. */
const INTERVAL_MS = 60_000;

/**
 * Watches the mailbox for the whole app, not just the inbox screen.
 *
 * Polling from the Conversations page meant replies only arrived while you
 * happened to be looking at that one screen. A reply is the event this product
 * exists to catch, so it is watched from the shell: whatever page you are on,
 * the answer lands, the bell updates and a toast says who wrote.
 *
 * Only the tab in front of you polls. A backgrounded tab would keep opening
 * IMAP connections to no purpose, and several tabs would multiply that.
 */
export function ReplyWatcher() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    let running = false;

    const check = async () => {
      if (cancelled || running || document.visibilityState !== "visible") return;

      running = true;
      try {
        const result = await syncRepliesAction();
        if (cancelled || !result.ok || result.added === 0) return;

        toast.success(`${result.added} new ${result.added === 1 ? "reply" : "replies"}`, {
          description:
            result.stopped > 0
              ? `${result.stopped} sequences stopped, because they answered.`
              : "Open Conversations to read them.",
        });

        // Pulls the new messages, the bell and the unread badge in one pass.
        router.refresh();
      } catch {
        // A background poll that fails is not worth a message. The button on
        // the inbox reports properly when someone asks for a check directly.
      } finally {
        running = false;
      }
    };

    void check();
    const timer = window.setInterval(() => void check(), INTERVAL_MS);
    // Coming back to the tab is exactly when a reply is most likely waiting.
    document.addEventListener("visibilitychange", check);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return null;
}
