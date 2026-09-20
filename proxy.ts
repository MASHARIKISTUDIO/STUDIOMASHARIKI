import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextProxy } from "next/server";
import {
  clerkPublishableKey,
  isClerkConfigured,
  isClerkSecretConfigured,
} from "@/lib/clerk-config";
import { roleFromSessionClaims } from "@/lib/roles";

/**
 * Next.js 16 renamed the `middleware` convention to `proxy` (and the exported
 * function to `proxy`). The `proxy` runtime is always `nodejs`.
 *
 * Clerk still ships `clerkMiddleware` as the factory; only the file and export
 * names changed.
 */
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

/**
 * Admin surface. Checked separately from `isProtectedRoute` because it needs a
 * role, not merely a session.
 */
const isAdminRoute = createRouteMatcher(["/dashboard/admin(.*)", "/api/admin(.*)"]);

const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    // Redirects unauthenticated visitors to the Clerk sign-in flow.
    await auth.protect();
  }

  if (isAdminRoute(request)) {
    const { sessionClaims } = await auth();

    /**
     * Reads the role from the session token, which requires the Clerk session
     * token to be customised with `{ "metadata": "{{user.public_metadata}}" }`.
     * `roleFromSessionClaims` defaults to the photographer role, so a missing
     * claim denies admin access rather than granting it.
     *
     * This is a routing guard only. It stops an admin page from rendering, but
     * it is NOT what protects admin data - every admin Convex function
     * re-checks the role against its own `users` row. Treat this as UX.
     */
    if (roleFromSessionClaims(sessionClaims) !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
}, { publishableKey: clerkPublishableKey });

const passThrough: NextProxy = () => NextResponse.next();

/**
 * Clerk's middleware throws on every matched request when the secret key is
 * missing. Export both the Next.js 16 named `proxy` and a default export so
 * Clerk can detect the middleware.
 */
export const proxy =
  isClerkConfigured && isClerkSecretConfigured() ? clerkProxy : passThrough;
export default proxy;

export const config = {
  matcher: [
    // Skip Next internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
