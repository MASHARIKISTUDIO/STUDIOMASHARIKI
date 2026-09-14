/**
 * Roles, shared by the Next.js layer and the Convex layer.
 *
 * Two systems hold a copy of a user's role, on purpose:
 *
 *  - Clerk `publicMetadata.role` is authoritative for the *edge*: `proxy.ts`
 *    reads it off the session token to decide whether a route renders at all.
 *    Reading it there is free and needs no database round trip.
 *  - `users.role` in Convex is authoritative for *data access*. Every Convex
 *    query/mutation resolves the role from its own row, never from the token,
 *    so a stale or tampered token cannot widen what a caller can read or write.
 *
 * The Clerk webhook (`convex/http.ts`) keeps the second in sync with the first.
 * When they disagree, Convex wins for data and Clerk wins for routing - which
 * fails closed, because a user who slips past the edge check still cannot read
 * anything their Convex row does not permit.
 */

export const ROLES = ["admin", "event_photographer"] as const;

export type Role = (typeof ROLES)[number];

/**
 * Role granted on public self-registration. Photographers need no approval, and
 * an unrecognised or missing role must resolve to this rather than to `admin`.
 */
export const DEFAULT_ROLE: Role = "event_photographer";

/** Narrows an untrusted value (session claim, webhook body) to a Role. */
export function parseRole(value: unknown): Role | null {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null;
}

/** Human-readable label for role badges and the admin user table. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  event_photographer: "Event photographer",
};

/**
 * Shape of the custom session-token claim.
 *
 * Requires a one-time Clerk configuration step - see `docs` in the project
 * README / the Step 1 notes: Clerk Dashboard -> Sessions -> Customize session
 * token, with the claim:
 *
 *   { "metadata": "{{user.public_metadata}}" }
 *
 * Without it `sessionClaims.metadata` is undefined and every role check at the
 * edge falls back to the default role.
 */
export type SessionMetadata = {
  role?: Role;
};

/**
 * Reads the role out of Clerk session claims, defaulting safely.
 *
 * Typed loosely (`unknown`-ish) on purpose: the caller passes Clerk's
 * `JwtPayload`, whose `metadata` shape depends on dashboard configuration we
 * cannot verify at compile time. Everything is re-narrowed at runtime.
 */
export function roleFromSessionClaims(
  claims: { metadata?: unknown } | null | undefined,
): Role {
  const metadata = claims?.metadata;
  if (typeof metadata !== "object" || metadata === null) {
    return DEFAULT_ROLE;
  }
  return parseRole((metadata as SessionMetadata).role) ?? DEFAULT_ROLE;
}
