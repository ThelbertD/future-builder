import { sanitizeUrl } from "@/lib/utils";

/**
 * The origin this deployment is served from.
 *
 * `metadataBase` is built at module scope, so anything that throws here fails
 * the whole build rather than one page — which is what an empty
 * NEXT_PUBLIC_APP_URL did: `??` only falls back on null and undefined, and a
 * variable that exists but holds "" sails past it into `new URL("")`.
 *
 * So every candidate goes through sanitizeUrl, which returns undefined for
 * anything that is not a real URL, and Vercel's own variables act as the
 * fallback. A fresh project then builds correctly with nothing configured:
 * VERCEL_PROJECT_PRODUCTION_URL is the stable domain, while VERCEL_URL is the
 * per-deployment one and only stands in for previews.
 */
export function resolveSiteUrl(): URL {
  const candidate =
    sanitizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    sanitizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    sanitizeUrl(process.env.VERCEL_URL) ??
    "http://localhost:3000";

  try {
    return new URL(candidate);
  } catch {
    // sanitizeUrl already vetted the shape, so this is unreachable in practice.
    // Metadata is not worth a failed build either way.
    return new URL("http://localhost:3000");
  }
}
