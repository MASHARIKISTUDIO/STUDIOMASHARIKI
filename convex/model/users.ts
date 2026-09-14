import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Application role, mirrored from Clerk `publicMetadata.role`. */
export type Role = "admin" | "event_photographer";

/**
 * The role assigned to a brand-new account and to any legacy row whose `role`
 * is still unset. Deliberately the least-privileged role: an unset field must
 * never be readable as `admin`.
 */
export const DEFAULT_ROLE: Role = "event_photographer";

/** Narrows an untrusted string (Clerk metadata, webhook body) to a Role. */
export function parseRole(value: unknown): Role | null {
  return value === "admin" || value === "event_photographer" ? value : null;
}

/** Resolves a user's effective role, defaulting an unset field safely. */
export function resolveRole(user: Doc<"users">): Role {
  return user.role ?? DEFAULT_ROLE;
}

/**
 * Plain helper module (Convex's `convex/model` convention) - nothing here is a
 * registered Convex function.
 *
 * Identity rules enforced in this file:
 *  - The caller NEVER supplies a user id. Identity is always derived from
 *    `ctx.auth.getUserIdentity()` on the server.
 *  - Lookups key on `tokenIdentifier` (issuer + subject), Convex's canonical
 *    stable identity key, rather than `subject` alone.
 */

/** Returns the signed-in user's row, or null when unauthenticated/unseen. */
export async function getCurrentUser(
  ctx: QueryCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/**
 * Mutation-side variant that creates the mirror row on first write and keeps
 * the cached email/name fresh if they changed in Clerk.
 *
 * Throws when unauthenticated - callers treat that as a hard failure.
 */
export async function ensureCurrentUser(
  ctx: MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated.");
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  const email = identity.email ?? undefined;
  const name = identity.name ?? undefined;

  if (existing !== null) {
    if (existing.email !== email || existing.name !== name) {
      await ctx.db.patch("users", existing._id, { email, name });
      return { ...existing, email, name };
    }
    return existing;
  }

  const userId = await ctx.db.insert("users", {
    // `subject` is Clerk's user id (user_xxx); fine as a cross-reference,
    // but never used as the authorization key.
    clerkId: identity.subject,
    tokenIdentifier: identity.tokenIdentifier,
    email,
    name,
    // Self-registration needs no approval, so the default role is granted
    // immediately. The Clerk webhook may later upgrade this to `admin`; it can
    // never be escalated from a client-supplied argument.
    role: DEFAULT_ROLE,
  });

  await bumpStat(ctx, statKeyForRole(DEFAULT_ROLE), 1);

  const created = await ctx.db.get("users", userId);
  if (created === null) {
    throw new Error("Failed to create user record.");
  }
  return created;
}

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

/**
 * Returns the caller's row, asserting they are an admin.
 *
 * Every admin-only Convex function must funnel through this rather than
 * checking a role passed in by the client.
 */
export async function requireAdmin(ctx: MutationCtx): Promise<Doc<"users">> {
  const user = await ensureCurrentUser(ctx);
  if (resolveRole(user) !== "admin") {
    throw new Error("Not authorized.");
  }
  return user;
}

/** Read-side admin assertion, for admin-only queries. */
export async function requireAdminRead(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null || resolveRole(user) !== "admin") {
    throw new Error("Not authorized.");
  }
  return user;
}

/**
 * Moderation rule for a single media item: an admin may always moderate, and
 * so may the photographer who uploaded it.
 *
 * `uploadedBy` is optional on legacy rows, so ownership falls back to the
 * owner of the containing gallery.
 */
export function canModerateMedia(
  user: Doc<"users">,
  media: Doc<"media_items">,
  gallery: Doc<"galleries">,
): boolean {
  if (resolveRole(user) === "admin") {
    return true;
  }
  if (media.uploadedBy !== undefined) {
    return media.uploadedBy === user._id;
  }
  return gallery.userId === user._id;
}

// ---------------------------------------------------------------------------
// Counters
// ---------------------------------------------------------------------------

/** Counter key holding the number of registered users in a given role. */
export function statKeyForRole(role: Role): string {
  return `users.${role}`;
}

/**
 * Adjusts a denormalised counter, creating it on first use.
 *
 * Convex has no count operator and `.collect().length` does not scale, so the
 * dashboard totals are maintained here, inside the same transaction as the
 * write that changes them, and can therefore never drift.
 */
export async function bumpStat(
  ctx: MutationCtx,
  key: string,
  delta: number,
): Promise<void> {
  const existing = await ctx.db
    .query("stats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (existing === null) {
    await ctx.db.insert("stats", { key, value: delta });
    return;
  }
  await ctx.db.patch("stats", existing._id, { value: existing.value + delta });
}

/** Reads a counter, treating a missing row as zero. */
export async function readStat(ctx: QueryCtx, key: string): Promise<number> {
  const row = await ctx.db
    .query("stats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  return row?.value ?? 0;
}

/**
 * Applies a role change, keeping the per-role counters consistent.
 * Used by the Clerk webhook and by the admin's role editor.
 */
export async function applyRole(
  ctx: MutationCtx,
  user: Doc<"users">,
  role: Role,
): Promise<void> {
  const current = resolveRole(user);
  if (current === role && user.role !== undefined) {
    return;
  }
  await ctx.db.patch("users", user._id, { role });
  if (current !== role) {
    await bumpStat(ctx, statKeyForRole(current), -1);
    await bumpStat(ctx, statKeyForRole(role), 1);
  }
}
