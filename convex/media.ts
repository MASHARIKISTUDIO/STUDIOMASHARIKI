import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import {
  canModerateMedia,
  ensureCurrentUser,
  getCurrentUser,
  resolveRole,
} from "./model/users";

const MAX_LIMIT = 100;

/**
 * Loads a media item together with its gallery, asserting the caller may
 * moderate it.
 *
 * Both the admin and the uploading photographer pass; everyone else gets the
 * same "not found" error as for a non-existent id, so the endpoint does not
 * confirm which media ids exist.
 */
async function loadModerableMedia(
  ctx: MutationCtx,
  mediaId: Id<"media_items">,
): Promise<{
  media: Doc<"media_items">;
  gallery: Doc<"galleries">;
  user: Doc<"users">;
}> {
  const user = await ensureCurrentUser(ctx);

  const media = await ctx.db.get("media_items", mediaId);
  if (media === null) {
    throw new Error("Media not found.");
  }

  const gallery = await ctx.db.get("galleries", media.galleryId);
  if (gallery === null) {
    throw new Error("Media not found.");
  }

  if (!canModerateMedia(user, media, gallery)) {
    throw new Error("Media not found.");
  }

  return { media, gallery, user };
}

/**
 * True when an item may be shown to the public / attendees.
 *
 * Single source of truth for the visibility rule, so a new surface cannot
 * accidentally leak hidden media by reimplementing the check. Unset legacy
 * flags are treated as visible, matching the pre-moderation behaviour; the
 * `migrations:backfillMediaFlags` run makes them explicit.
 */
export function isPubliclyVisible(media: Doc<"media_items">): boolean {
  return media.isHidden !== true && media.isNsfw !== true;
}

// ---------------------------------------------------------------------------
// Moderation mutations
// ---------------------------------------------------------------------------

/** Hides or unhides an item. Admin or the uploading photographer. */
export const setMediaHidden = mutation({
  args: { mediaId: v.id("media_items"), isHidden: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { media, user } = await loadModerableMedia(ctx, args.mediaId);

    await ctx.db.patch("media_items", media._id, {
      isHidden: args.isHidden,
      moderatedBy: user._id,
      moderatedAt: Date.now(),
    });
    return null;
  },
});

/** Marks or clears the NSFW flag. Admin or the uploading photographer. */
export const setMediaNsfw = mutation({
  args: { mediaId: v.id("media_items"), isNsfw: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { media, user } = await loadModerableMedia(ctx, args.mediaId);

    await ctx.db.patch("media_items", media._id, {
      isNsfw: args.isNsfw,
      moderatedBy: user._id,
      moderatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Sets or clears the HD price, in whole shillings.
 *
 * `null` clears it, which removes the Buy HD affordance. Rejects fractional and
 * absurd values here rather than at the M-Pesa boundary, because Daraja will
 * reject a non-integer amount with an opaque error much later in the flow.
 */
export const setMediaPrice = mutation({
  args: {
    mediaId: v.id("media_items"),
    priceKes: v.union(v.number(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { media } = await loadModerableMedia(ctx, args.mediaId);

    if (args.priceKes !== null) {
      if (!Number.isInteger(args.priceKes)) {
        throw new Error("Price must be a whole number of shillings.");
      }
      if (args.priceKes < 1 || args.priceKes > 150_000) {
        throw new Error("Price must be between KES 1 and KES 150,000.");
      }
      if (media.hdObjectKey === undefined) {
        throw new Error(
          "This item has no stored HD original, so it cannot be sold.",
        );
      }
    }

    await ctx.db.patch("media_items", media._id, {
      priceKes: args.priceKes ?? undefined,
    });
    return null;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Public-facing media for a gallery.
 *
 * Uses the visibility index so hidden/NSFW rows are excluded inside the index
 * range rather than fetched and filtered in JS - which would both waste reads
 * and risk a future refactor forgetting the filter.
 *
 * `hdObjectKey` is stripped from the payload. It is a storage key for an object
 * the caller has not paid for, and it has no business reaching a browser.
 */
export const listPublicMedia = query({
  args: { galleryId: v.id("galleries"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("media_items")
      .withIndex("by_galleryId_and_visibility_and_order", (q) =>
        q
          .eq("galleryId", args.galleryId)
          .eq("isHidden", false)
          .eq("isNsfw", false),
      )
      .take(Math.min(args.limit ?? MAX_LIMIT, MAX_LIMIT));

    return rows.map(toPublicMedia);
  },
});

/** Shape sent to unauthenticated/attendee clients. */
export function toPublicMedia(media: Doc<"media_items">) {
  return {
    _id: media._id,
    _creationTime: media._creationTime,
    galleryId: media.galleryId,
    type: media.type,
    provider: media.provider,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    title: media.title,
    playbackId: media.playbackId,
    width: media.width,
    height: media.height,
    durationSeconds: media.durationSeconds,
    order: media.order,
    priceKes: media.priceKes,
    /** Lets the UI show a "Buy HD" button without exposing the key itself. */
    isForSale: media.priceKes !== undefined && media.hdObjectKey !== undefined,
  };
}

/**
 * Media for a moderator's view of a gallery: includes hidden and NSFW rows,
 * plus the flags themselves so the toggles can render their state.
 *
 * Returns `[]` for a caller who may not moderate anything in this gallery,
 * rather than throwing, so a shared gallery page can render the public grid and
 * simply omit the controls.
 */
export const listModerableMedia = query({
  args: { galleryId: v.id("galleries") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }

    const gallery = await ctx.db.get("galleries", args.galleryId);
    if (gallery === null) {
      return [];
    }

    const isAdmin = resolveRole(user) === "admin";
    if (!isAdmin && gallery.userId !== user._id) {
      // Might still own individual items in someone else's gallery.
      const own = await ctx.db
        .query("media_items")
        .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", user._id))
        .take(MAX_LIMIT);
      return own
        .filter((item) => item.galleryId === args.galleryId)
        .map((item) => toModerableMedia(item, true));
    }

    const rows = await ctx.db
      .query("media_items")
      .withIndex("by_galleryId_and_order", (q) =>
        q.eq("galleryId", args.galleryId),
      )
      .take(MAX_LIMIT);

    return rows.map((item) =>
      toModerableMedia(item, isAdmin || canModerateMedia(user, item, gallery)),
    );
  },
});

/** Shape sent to a moderator. Still omits `hdObjectKey`. */
function toModerableMedia(media: Doc<"media_items">, canModerate: boolean) {
  return {
    ...toPublicMedia(media),
    isHidden: media.isHidden ?? false,
    isNsfw: media.isNsfw ?? false,
    moderatedAt: media.moderatedAt,
    /** Whether an HD master exists at all, without revealing where. */
    hasHdOriginal: media.hdObjectKey !== undefined,
    canModerate,
  };
}

/**
 * A photographer's own uploads across every gallery, for their dashboard.
 * Scoped by `uploadedBy`, so it is inherently the caller's own media.
 */
export const listMyMedia = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }

    const rows = await ctx.db
      .query("media_items")
      .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", user._id))
      .order("desc")
      .take(Math.min(args.limit ?? 50, MAX_LIMIT));

    return rows.map((item) => toModerableMedia(item, true));
  },
});

/** Internal helper shared with galleries.ts for owner-aware gallery reads. */
export async function visibleMediaForViewer(
  ctx: QueryCtx,
  gallery: Doc<"galleries">,
  viewer: Doc<"users"> | null,
): Promise<Doc<"media_items">[]> {
  const rows = await ctx.db
    .query("media_items")
    .withIndex("by_galleryId_and_order", (q) => q.eq("galleryId", gallery._id))
    .take(MAX_LIMIT);

  if (viewer === null) {
    return rows.filter(isPubliclyVisible);
  }

  // A moderator sees everything they could act on; everyone else sees only
  // public items, even when signed in.
  return rows.filter(
    (item) => isPubliclyVisible(item) || canModerateMedia(viewer, item, gallery),
  );
}
