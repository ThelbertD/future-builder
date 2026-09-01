import "server-only";

import { cache } from "react";

import { CURRENT_USER, CURRENT_WORKSPACE, WORKSPACE_MEMBERS } from "@/lib/mock";
import { isSupabaseConfigured, useMockData } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { sanitizeUrl } from "@/lib/utils";
import type { User, Workspace, WorkspaceMember, WorkspaceRole } from "@/types";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  timezone: string | null;
  created_at: string;
}

interface MembershipRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    logo_url: string | null;
    booking_url?: string | null;
    created_at: string;
  } | null;
  profile?: ProfileRow | null;
}

/**
 * The signed-in user, or the demo user when Supabase is not configured.
 *
 * Wrapped in cache() so a single request resolves it once no matter how many
 * server components ask.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return CURRENT_USER;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, job_title, timezone, created_at")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  return {
    id: auth.user.id,
    email: profile?.email ?? auth.user.email ?? "",
    fullName: profile?.full_name || auth.user.email?.split("@")[0] || "There",
    avatarUrl: profile?.avatar_url ?? undefined,
    jobTitle: profile?.job_title ?? undefined,
    timezone: profile?.timezone ?? "UTC",
    createdAt: profile?.created_at ?? auth.user.created_at,
  };
});

/** The workspace the signed-in user is currently working in. */
export const getActiveWorkspace = cache(async (): Promise<Workspace | null> => {
  if (!isSupabaseConfigured) return CURRENT_WORKSPACE;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, role, status, joined_at, workspace:workspaces(*)")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle<MembershipRow>();

  const workspace = data?.workspace;
  if (!workspace) return null;

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan as Workspace["plan"],
    logoUrl: workspace.logo_url ?? undefined,
    // Falls back to the environment value until migration 0005 has run.
    bookingUrl:
      sanitizeUrl(workspace.booking_url) ?? sanitizeUrl(process.env.NEXT_PUBLIC_BOOKING_URL),
    createdAt: workspace.created_at,
  };
});

/**
 * Guarantees a signed-in user has a workspace.
 *
 * Sign-up provisions one immediately, but only when Supabase returns a session.
 * With email confirmation enabled there is no session at that moment, so the
 * first authenticated request provisions instead. Safe to call on every
 * request: it returns early as soon as a membership exists.
 */
export const ensureWorkspaceProvisioned = cache(async (): Promise<void> => {
  if (!isSupabaseConfigured) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();

  if (membership) return;

  const metadataName = auth.user.user_metadata?.full_name as string | undefined;
  const fallback = metadataName?.split(" ")[0] ?? auth.user.email?.split("@")[0] ?? "My";

  const { error } = await supabase.rpc("create_workspace", {
    workspace_name: `${fallback}'s workspace`,
  });

  if (error) console.error("Workspace provisioning failed:", error.message);
});

/** Workspace id used to scope every query. Null when the user has no workspace. */
export const getActiveWorkspaceId = cache(async (): Promise<string | null> => {
  const workspace = await getActiveWorkspace();
  return workspace?.id ?? null;
});

export const getWorkspaceMembers = cache(async (): Promise<WorkspaceMember[]> => {
  if (useMockData) return WORKSPACE_MEMBERS;

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, role, status, joined_at, profile:profiles(*)")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true })
    .returns<MembershipRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role as WorkspaceRole,
    status: row.status as WorkspaceMember["status"],
    joinedAt: row.joined_at,
    user: {
      id: row.user_id,
      fullName: row.profile?.full_name ?? row.profile?.email ?? "Teammate",
      email: row.profile?.email ?? "",
      avatarUrl: row.profile?.avatar_url ?? undefined,
      jobTitle: row.profile?.job_title ?? undefined,
    },
  }));
});
