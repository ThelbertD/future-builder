import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal .env loader for standalone scripts.
 *
 * Next.js loads .env.local automatically, but scripts run through tsx do not,
 * so seeding and health checks read it here. Values already present in the
 * environment always win, which keeps CI overrides working.
 */
function parse(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) values[key] = value;
  }

  return values;
}

export function loadEnv(files = [".env.local", ".env"]): void {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    const values = parse(readFileSync(path, "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value;
      }
    }
  }
}
