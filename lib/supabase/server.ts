import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Request-scoped Supabase client for server components, route handlers and
 * server actions. Runs as the signed-in user, so row level security applies.
 */
export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured for the server runtime.");
  }

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component — the middleware refreshes the session instead.
        }
      },
    },
  });
}
