"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveWorkspaceId } from "@/lib/supabase/auth";
import { useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  /** Specific notifications, or every unread one when omitted. */
  ids: z.array(z.string().min(1).max(64)).max(50).optional(),
});

/**
 * Marks notifications read.
 *
 * The bell used to do this in local state alone, which was invisible for as
 * long as nothing refreshed. Now that the shell polls and re-reads from the
 * server, an unpersisted read would come straight back a minute later.
 */
export async function markNotificationsReadAction(input: z.input<typeof schema> = {}): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  if (useMockData) return { ok: true };

  const [supabase, workspaceId] = await Promise.all([createClient(), getActiveWorkspaceId()]);
  if (!workspaceId) return { ok: false };

  let query = supabase.from("notifications").update({ read: true }).eq("workspace_id", workspaceId);

  if (parsed.data.ids && parsed.data.ids.length > 0) {
    query = query.in("id", parsed.data.ids);
  } else {
    query = query.eq("read", false);
  }

  const { error } = await query;
  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}
