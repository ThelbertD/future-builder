/**
 * Bundled demo dataset.
 *
 * Every page reads through this barrel so that swapping to Supabase queries is a
 * change in one layer (lib/supabase/queries.ts) rather than across the UI.
 */
export * from "./workspace";
export * from "./companies";
export * from "./jobs";
export * from "./pipeline";
export * from "./leads";
export * from "./conversations";
export * from "./appointments";
export * from "./campaigns";
export * from "./activity";
export * from "./analytics";
export * from "./integrations";
