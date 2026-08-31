"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  notice?: string;
}

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signUpSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
  workspaceName: z.string().trim().max(120).optional(),
});

/** Supabase returns provider wording we do not want to show verbatim. */
function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password do not match.";
  if (/email not confirmed/i.test(message)) return "Confirm your email address first, then sign in.";
  if (/already registered|already exists/i.test(message)) return "An account already exists for that email.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a moment and try again.";
  return "We could not complete that request. Try again.";
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  // Demo mode: no backend to authenticate against.
  if (!isSupabaseConfigured) redirect("/dashboard");

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) redirect("/dashboard");

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    workspaceName: formData.get("workspaceName") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const { email, password, fullName, workspaceName } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: friendlyError(error.message) };

  // With email confirmation enabled there is no session yet, so the workspace
  // is provisioned on first sign-in instead (see ensureWorkspace).
  if (!data.session) {
    return { notice: "Check your inbox to confirm your email, then sign in." };
  }

  const { error: workspaceError } = await supabase.rpc("create_workspace", {
    workspace_name: workspaceName?.trim() || `${fullName.split(" ")[0]}'s workspace`,
  });

  if (workspaceError) {
    return { error: "Your account was created but the workspace was not. Sign in to finish setup." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Creates a workspace for a signed-in user who does not have one yet — the
 * path taken when email confirmation delayed provisioning at sign-up.
 */
export async function ensureWorkspace(name?: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return {};

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in." };

  const { data: existing } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();

  if (existing) return {};

  const fallback = auth.user.user_metadata?.full_name?.split(" ")[0] ?? auth.user.email?.split("@")[0] ?? "My";
  const { error } = await supabase.rpc("create_workspace", {
    workspace_name: name?.trim() || `${fallback}'s workspace`,
  });

  if (error) return { error: "Could not create your workspace." };

  revalidatePath("/", "layout");
  return {};
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
