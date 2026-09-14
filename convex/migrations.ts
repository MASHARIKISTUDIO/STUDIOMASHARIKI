import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { DEFAULT_ROLE, resolveRole, statKeyForRole } from "./model/users";

/**
 * One-off backfills for the moderation/monetisation schema change.
 *
 * Run once after deploying the new schema:
 *   npx convex run migrations:backfillMediaFlags
 *   npx convex run migrations:backfillUserRoles
 *   npx convex run migrations:rebuildStats
 *
 * These are `internalMutation`s so they are never reachable from a client.
 *
 * Why the media backfill is mandatory rather than cosmetic: the new
 * `by_galleryId_and_visibility_and_order` index is queried with an explicit
 * `isHidden: false, isNsfw: false`. In Convex an unset optional field indexes as
 * `undefined`, which is a distinct key from `false` - so any pre-existing row
 * left unset would silently disappear from every public gallery page. The fields
 * are declared optional only so the deploy does not reject existing documents;
 * this migration is what makes them uniformly present.
 */

/** Batch size kept well inside a single mutation's read/write budget. */
const BATCH = 200;

export const backfillMediaFlags = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ processed: v.number(), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("media_items").paginate({
      numItems: BATCH,
      cursor: args.cursor ?? null,
    });

    let processed = 0;
    for (const item of page.page) {
      const patch: Record<string, unknown> = {};

      if (item.isHidden === undefined) patch.isHidden = false;
      if (item.isNsfw === undefined) patch.isNsfw = false;

      // Attribute legacy uploads to the gallery owner, which was the only
      // notion of ownership that existed before `uploadedBy`.
      if (item.uploadedBy === undefined) {
        const gallery = await ctx.db.get("galleries", item.galleryId);
        if (gallery !== null) {
          patch.uploadedBy = gallery.userId;
        }
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch("media_items", item._id, patch);
        processed += 1;
      }
    }

    // Continue in a fresh transaction rather than risking the document limit.
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillMediaFlags, {
        cursor: page.continueCursor,
      });
    }

    return { processed, isDone: page.isDone };
  },
});

/** Gives every pre-existing user an explicit, least-privileged role. */
export const backfillUserRoles = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ processed: v.number(), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("users").paginate({
      numItems: BATCH,
      cursor: args.cursor ?? null,
    });

    let processed = 0;
    for (const user of page.page) {
      if (user.role === undefined) {
        await ctx.db.patch("users", user._id, { role: DEFAULT_ROLE });
        processed += 1;
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillUserRoles, {
        cursor: page.continueCursor,
      });
    }

    return { processed, isDone: page.isDone };
  },
});

/**
 * Recomputes the denormalised per-role user counters from scratch.
 *
 * Safe to re-run: it zeroes the counters on the first batch before counting.
 * Run this AFTER `backfillUserRoles`, and only on a user table small enough to
 * walk - which is the case here, since these are staff accounts, not attendees.
 */
export const rebuildStats = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    admin: v.optional(v.number()),
    photographer: v.optional(v.number()),
  },
  returns: v.object({ admin: v.number(), photographer: v.number() }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("users").paginate({
      numItems: BATCH,
      cursor: args.cursor ?? null,
    });

    let admin = args.admin ?? 0;
    let photographer = args.photographer ?? 0;

    for (const user of page.page) {
      if (resolveRole(user) === "admin") admin += 1;
      else photographer += 1;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.rebuildStats, {
        cursor: page.continueCursor,
        admin,
        photographer,
      });
      return { admin, photographer };
    }

    // Final batch: write absolute totals, replacing whatever drifted.
    for (const [key, value] of [
      [statKeyForRole("admin"), admin],
      [statKeyForRole("event_photographer"), photographer],
    ] as const) {
      const row = await ctx.db
        .query("stats")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (row === null) {
        await ctx.db.insert("stats", { key, value });
      } else {
        await ctx.db.patch("stats", row._id, { value });
      }
    }

    return { admin, photographer };
  },
});
