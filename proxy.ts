import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session and gates the workspace routes.
 *
 * Next 16 replaced the `middleware` convention with `proxy`, which runs on the
 * Node.js runtime. That matters here: the Supabase client pulled into the Edge
 * bundle was the source of MIDDLEWARE_INVOCATION_FAILED in production.
 *
 * Two deliberate safety properties:
 *
 * 1. The matcher covers only the routes that need a session, so a failure here
 *    can never take down the marketing site, the API routes or static assets.
 * 2. Any error falls through to the request instead of throwing. This is a
 *    convenience layer, not the security boundary — the dashboard layout
 *    redirects signed-out users and row level security scopes every query — so
 *    failing open beats returning a 500 for the whole application.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/finder",
  "/leads",
  "/pipeline",
  "/companies",
  "/conversations",
  "/outreach",
  "/appointments",
  "/analytics",
  "/ai-settings",
  "/integrations",
  "/settings",
];

const AUTH_ROUTES = ["/login", "/signup"];

/** Guards against a dashboard link being pasted in place of the API URL. */
function readSupabaseUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.hostname === "supabase.com" || url.pathname.length > 1) {
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL looks like a dashboard link. Use the project API URL, e.g. https://<ref>.supabase.co",
      );
      return null;
    }
    return url.origin;
  } catch {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabaseUrl = readSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured, or misconfigured: run as the open demo rather than fail.
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const { pathname } = request.nextUrl;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // getUser() revalidates the token with Supabase, which also refreshes the
    // auth cookies written onto the response above.
    const { data } = await supabase.auth.getUser();

    const needsAuth = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (!data.user && needsAuth) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (data.user && AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("Auth proxy failed, letting the request through:", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/finder/:path*",
    "/leads/:path*",
    "/pipeline/:path*",
    "/companies/:path*",
    "/conversations/:path*",
    "/outreach/:path*",
    "/appointments/:path*",
    "/analytics/:path*",
    "/ai-settings/:path*",
    "/integrations/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
