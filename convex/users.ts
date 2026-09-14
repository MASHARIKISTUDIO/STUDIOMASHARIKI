import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  applyRole,
  bumpStat,
  ensureCurrentUser,
  getCurrentUser,
  parseRole,
  requireAdmin,
  resolveRole,
  statKeyForRole,
} from "./model/users";
import { roleValidator } from "./schema";

/**
 * The signed-in user's mirror row, or null when signed out.
 *
 * `role` is included so the client can render role-appropriate navigation.
 * It is a convenience for the UI only - it is not what authorizes anything.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    return { ...user, role: resolveRole(user) };
  },
});

/**
 * Idempotently creates the local mirror of the Clerk user.
 *
 * The dashboard calls this once after sign-in so the first upload does not pay
 * for user creation. Takes no arguments on purpose: identity is read from the
 * request's auth token, never passed in by the client.
 */
export const store = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const user = await ensureCurrentUser(ctx);
    return user._id;
  },
});

/**
 * Mirrors a role from Clerk into the local row.
 *
 * INTERNAL on purpose. This is the one function that can change a role, and it
 * is reachable only from the verified Clerk webhook in `http.ts`. Exposing it
 * publicly would let any signed-in user promote themselves to admin.
 *
 * Idempotent: Clerk retries webhooks, and `user.updated` fires for edits that
 * have nothing to do with the role.
 */
export const syncRoleFromClerk = internalMutation({
  args: { clerkId: v.string(), role: roleValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    // No mirror row yet - the user has not made an authenticated Convex call.
    // `ensureCurrentUser` will assign the default role on their first write,
    // and a later `user.updated` webhook re-delivers any admin grant.
    if (user === null) {
      return null;
    }

    await applyRole(ctx, user, args.role);
    return null;
  },
});

/**
 * Removes the mirror row when Clerk reports the account deleted.
 *
 * Galleries and media are deliberately left in place: deleting a photographer's
 * account must not silently destroy delivered client galleries or invalidate
 * HD downloads attendees have already paid for. Reassignment is an admin
 * decision, handled in the dashboard.
 */
export const deleteByClerkId = internalMutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user === null) {
      return null;
    }

    await bumpStat(ctx, statKeyForRole(resolveRole(user)), -1);
    await ctx.db.delete("users", user._id);
    return null;
  },
});

/**
 * Admin-only role editor, for the dashboard's user table.
 *
 * Note the asymmetry with `syncRoleFromClerk`: this writes only the Convex
 * mirror. The Clerk `publicMetadata` update is issued from the Next.js server
 * action that calls this, because the Clerk backend SDK needs a Node runtime
 * and a secret key that does not belong in a Convex query.
 */
export const setRole = mutation({
  args: { userId: v.id("users"), role: roleValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const target = await ctx.db.get("users", args.userId);
    if (target === null) {
      throw new Error("User not found.");
    }

    // Guard against an admin removing their own last privilege by accident.
    if (target._id === admin._id && args.role !== "admin") {
      throw new Error("You cannot remove your own admin role.");
    }

    await applyRole(ctx, target, args.role);
    return null;
  },
});

/**
 * Ensures the caller has a mirror row AND that the row reflects the role Clerk
 * currently reports, without trusting the client for the value.
 *
 * The client passes the role it read from its own session claims; we accept it
 * only when it *narrows* privileges (photographer), and ignore an `admin` claim
 * entirely. Promotions arrive exclusively through the verified webhook.
 */
export const storeWithClaimedRole = mutation({
  args: { claimedRole: v.optional(v.string()) },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const user = await ensureCurrentUser(ctx);

    const claimed = parseRole(args.claimedRole);
    if (claimed === "event_photographer" && user.role === undefined) {
      await applyRole(ctx, user, claimed);
    }

    return user._id;
  },
});
