/**
 * Environment access for Supabase.
 *
 * Only NEXT_PUBLIC_* values may be read in the browser. The service role key is
 * intentionally not exported here — see admin.ts, which is server-only.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once both public Supabase values are present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * The app ships with a bundled demo dataset. Set NEXT_PUBLIC_USE_MOCK_DATA=false
 * once the Supabase schema is migrated and seeded.
 */
export const useMockData =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false" || !isSupabaseConfigured;
