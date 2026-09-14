import { auth } from "@clerk/nextjs/server";
import { DEFAULT_ROLE, roleFromSessionClaims, type Role } from "@/lib/roles";

/**
 * Server-side role helpers for React Server Components and route handlers.
 *
 * These read the Clerk session token, so they are cheap and involve no database
 * round trip - which is also their limitation. Use them to decide what to
 * *render*. Do not use them to decide what data a caller may read or write:
 * that check belongs in the Convex function, against `users.role`.
 */

/** The caller's role, or null when signed out. */
export async function getCurrentRole(): Promise<Role | null> {
  const { userId, sessionClaims } = await auth();
  if (userId === null) {
    return null;
  }
  return roleFromSessionClaims(sessionClaims);
}

/** True when the caller is a signed-in admin. */
export async function isAdmin(): Promise<boolean> {
  return (await getCurrentRole()) === "admin";
}

/**
 * Asserts an admin caller, for use at the top of an admin route handler.
 * Throws rather than redirecting, so an API route returns an error instead of
 * an HTML redirect.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Not authorized.");
  }
}

/** Re-exported so callers need only one import for the common case. */
export { DEFAULT_ROLE, type Role };
