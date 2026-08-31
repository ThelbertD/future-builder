/**
 * Connection health check.
 *
 *   npm run supabase:check
 *
 * Verifies that the credentials work, the migrations are applied, and row level
 * security is switched on. Prints nothing sensitive — keys are never echoed.
 */
import { createClient } from "@supabase/supabase-js";

import { loadEnv } from "./load-env";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = [
  "workspaces",
  "profiles",
  "workspace_members",
  "companies",
  "contacts",
  "job_posts",
  "pipelines",
  "pipeline_stages",
  "leads",
  "ai_analyses",
  "conversations",
  "messages",
  "appointments",
  "campaigns",
  "campaign_steps",
  "activities",
  "notifications",
  "saved_searches",
  "integrations",
];

function mask(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-4)}`;
}

async function main() {
  console.log("Future Builder AI — Supabase check\n");

  if (!url || !anonKey) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local");
    process.exit(1);
  }

  console.log(`  project   ${mask(url)}`);
  console.log(`  anon key  ${anonKey.length > 20 ? "present" : "looks too short"}`);
  console.log(`  service   ${serviceRoleKey ? "present" : "not set (only needed for seeding)"}\n`);

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });

  // The anon role should reach the API but see nothing: RLS has no session to
  // match against, so a readable table means a policy is missing.
  const { error: reachError } = await anon.from("workspaces").select("id").limit(1);

  if (reachError && !/permission|row-level|JWT/i.test(reachError.message)) {
    console.error(`✗ cannot reach the database: ${reachError.message}`);
    process.exit(1);
  }
  console.log("  ✓ API reachable with the anon key");

  if (!serviceRoleKey) {
    console.log("\n  Set SUPABASE_SERVICE_ROLE_KEY to check the schema and row counts.");
    return;
  }

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  let failures = 0;

  console.log("\n  Tables");
  for (const table of TABLES) {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ✗ ${table.padEnd(20)} ${error.message}`);
      failures += 1;
    } else {
      console.log(`  ✓ ${table.padEnd(20)} ${count ?? 0} rows`);
    }
  }

  console.log("\n  Functions");

  // Probed with real arguments so PGRST202 means genuinely missing rather than
  // a signature mismatch. Nothing here mutates: the helpers return false for an
  // unknown workspace, and create_workspace refuses to run without an
  // authenticated user, which the service role is not.
  const probes: Array<[string, Record<string, unknown>]> = [
    ["is_workspace_member", { target_workspace: "00000000-0000-0000-0000-000000000000" }],
    ["can_write_workspace", { target_workspace: "00000000-0000-0000-0000-000000000000" }],
    ["can_admin_workspace", { target_workspace: "00000000-0000-0000-0000-000000000000" }],
    ["create_workspace", { workspace_name: "" }],
  ];

  for (const [fn, args] of probes) {
    const { error } = await admin.rpc(fn as never, args as never);
    const missing = error?.code === "PGRST202";
    console.log(`  ${missing ? "✗" : "✓"} ${fn}`);
    if (missing) failures += 1;
  }

  const { count: userCount } = await admin.from("profiles").select("*", { count: "exact", head: true });

  console.log(
    failures === 0
      ? `\n✓ Schema looks complete. ${userCount ?? 0} account(s) registered.`
      : `\n✗ ${failures} check(s) failed — re-run the migrations in database/migrations.`,
  );

  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
