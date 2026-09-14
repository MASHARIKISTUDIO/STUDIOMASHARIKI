import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { categoryValidator } from "./categories";
import { toPublicMedia, visibleMediaForViewer } from "./media";
import {
  canModerateMedia,
  ensureCurrentUser,
  getCurrentUser,
  resolveRole,
} from "./model/users";
import { mediaTypeValidator, providerValidator } from "./schema";

/** Default page size for public listings; keeps every query bounded. */
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

/**
 * Slug alphabet excludes look-alike characters (0/O, 1/l/I) so slugs survive
 * being read aloud or copied off a screen. 8 chars over a 32-char alphabet is
 * ~40 bits, which is what keeps unlisted galleries effectively unguessable.
 */
const SLUG_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";
const SLUG_LENGTH = 8;

function randomSlug(): string {
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i += 1) {
    slug += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
  }
  return slug;
}

/** Generates a slug that is not already taken. */
async function generateUniqueSlug(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = randomSlug();
    const clash = await ctx.db
      .query("galleries")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (clash === null) {
      return slug;
    }
  }
  throw new Error("Could not allocate a unique gallery slug.");
}

/** Normalises the category list so `category` is always the first entry. */
function normaliseCategories(
  category: Doc<"galleries">["category"],
  extra: Doc<"galleries">["categories"] | undefined,
): Doc<"galleries">["categories"] {
  return Array.from(new Set([category, ...(extra ?? [])]));
}

/**
 * Loads a gallery the caller is allowed to modify.
 * Ownership is resolved server-side; a non-owner gets the same error as a
 * missing gallery so the endpoint does not confirm that a slug exists.
 */
async function loadOwnedGallery(
  ctx: MutationCtx,
  galleryId: Id<"galleries">,
): Promise<{ gallery: Doc<"galleries">; user: Doc<"users"> }> {
  const user = await ensureCurrentUser(ctx);
  const gallery = await ctx.db.get("galleries", galleryId);
  if (gallery === null || gallery.userId !== user._id) {
    throw new Error("Gallery not found.");
  }
  return { gallery, user };
}

const mediaInputValidator = v.object({
  type: mediaTypeValidator,
  provider: providerValidator,
  /**
   * Public playback/display source. Since the moderation+monetisation change
   * this is the WATERMARKED, downscaled preview - never the master. See
   * `lib/media/upload.ts`.
   */
  url: v.string(),
  title: v.string(),
  thumbnailUrl: v.optional(v.string()),
  downloadUrl: v.optional(v.string()),
  playbackId: v.optional(v.string()),
  objectKey: v.optional(v.string()),
  /** Private key of the HD master, under the non-public bucket prefix. */
  hdObjectKey: v.optional(v.string()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  durationSeconds: v.optional(v.number()),
  sizeBytes: v.optional(v.number()),
  /** Optional per-item HD price; falls back to the site default. */
  priceKes: v.optional(v.number()),
});

/**
 * Default HD price applied when an upload does not specify one.
 * Read from `site_settings`, so the admin can change it without a deploy.
 */
async function defaultPriceKes(ctx: MutationCtx): Promise<number | undefined> {
  const settings = await ctx.db
    .query("site_settings")
    .withIndex("by_key", (q) => q.eq("key", "hero"))
    .unique();
  return settings?.defaultPriceKes;
}

/**
 * Normalises a client-supplied media row before insert.
 *
 * Two things are forced server-side and never taken from the client:
 *  - `uploadedBy`, so moderation rights cannot be reassigned by the caller;
 *  - `isHidden`/`isNsfw`, which must be explicitly `false` rather than unset,
 *    because the public visibility index matches on `false` and would skip a
 *    row whose flags are `undefined`.
 */
function normaliseMediaInsert(
  media: typeof mediaInputValidator.type,
  uploaderId: Id<"users">,
  order: number,
  fallbackPrice: number | undefined,
) {
  return {
    ...media,
    order,
    uploadedBy: uploaderId,
    isHidden: false,
    isNsfw: false,
    // Only priced when there is actually a master to deliver.
    priceKes:
      media.hdObjectKey === undefined
        ? undefined
        : (media.priceKes ?? fallbackPrice),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates an empty gallery owned by the caller and returns its slug so the
 * client can navigate straight to /galleries/[slug].
 */
export const createGallery = mutation({
  args: {
    title: v.string(),
    category: categoryValidator,
    categories: v.optional(v.array(categoryValidator)),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    eventDate: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  returns: v.object({ galleryId: v.id("galleries"), slug: v.string() }),
  handler: async (ctx, args) => {
    const user = await ensureCurrentUser(ctx);

    const title = args.title.trim();
    if (title.length === 0) {
      throw new Error("Gallery title is required.");
    }

    const slug = await generateUniqueSlug(ctx);
    const galleryId = await ctx.db.insert("galleries", {
      slug,
      title,
      description: args.description?.trim() || undefined,
      category: args.category,
      categories: normaliseCategories(args.category, args.categories),
      isPrivate: args.isPrivate ?? false,
      userId: user._id,
      eventDate: args.eventDate,
      location: args.location,
      createdAt: Date.now(),
    });

    return { galleryId, slug };
  },
});

/**
 * Appends an uploaded asset to a gallery owned by the caller.
 *
 * Also backfills `coverImageUrl` from the first available still, so listing
 * pages never have to fan out into `media_items`.
 */
export const addMediaToGallery = mutation({
  args: {
    galleryId: v.id("galleries"),
    media: mediaInputValidator,
  },
  returns: v.id("media_items"),
  handler: async (ctx, args) => {
    const { gallery, user } = await loadOwnedGallery(ctx, args.galleryId);

    // Append after the current highest `order` without reading the whole list.
    const last = await ctx.db
      .query("media_items")
      .withIndex("by_galleryId_and_order", (q) =>
        q.eq("galleryId", gallery._id),
      )
      .order("desc")
      .first();

    const mediaId = await ctx.db.insert("media_items", {
      galleryId: gallery._id,
      ...normaliseMediaInsert(
        args.media,
        user._id,
        last === null ? 0 : last.order + 1,
        await defaultPriceKes(ctx),
      ),
    });

    const cover =
      args.media.type === "image" ? args.media.url : args.media.thumbnailUrl;
    if (gallery.coverImageUrl === undefined && cover !== undefined) {
      await ctx.db.patch("galleries", gallery._id, { coverImageUrl: cover });
    }

    return mediaId;
  },
});

/**
 * Atomic create-and-populate used by the dashboard upload flow, so a failed
 * second call can never leave an empty orphan gallery behind.
 */
export const createGalleryWithMedia = mutation({
  args: {
    title: v.string(),
    category: categoryValidator,
    categories: v.optional(v.array(categoryValidator)),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    eventDate: v.optional(v.string()),
    location: v.optional(v.string()),
    media: v.array(mediaInputValidator),
  },
  returns: v.object({ galleryId: v.id("galleries"), slug: v.string() }),
  handler: async (ctx, args) => {
    const user = await ensureCurrentUser(ctx);

    const title = args.title.trim();
    if (title.length === 0) {
      throw new Error("Gallery title is required.");
    }
    if (args.media.length === 0) {
      throw new Error("At least one media item is required.");
    }

    const slug = await generateUniqueSlug(ctx);

    const cover =
      args.media.find((item) => item.type === "image")?.url ??
      args.media.find((item) => item.thumbnailUrl !== undefined)?.thumbnailUrl;

    const galleryId = await ctx.db.insert("galleries", {
      slug,
      title,
      description: args.description?.trim() || undefined,
      category: args.category,
      categories: normaliseCategories(args.category, args.categories),
      isPrivate: args.isPrivate ?? false,
      userId: user._id,
      coverImageUrl: cover,
      eventDate: args.eventDate,
      location: args.location,
      createdAt: Date.now(),
    });

    const fallbackPrice = await defaultPriceKes(ctx);
    for (const [index, item] of args.media.entries()) {
      await ctx.db.insert("media_items", {
        galleryId,
        ...normaliseMediaInsert(item, user._id, index, fallbackPrice),
      });
    }

    return { galleryId, slug };
  },
});

/** Flips the private-sharing toggle on a gallery owned by the caller. */
export const setGalleryPrivacy = mutation({
  args: { galleryId: v.id("galleries"), isPrivate: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { gallery } = await loadOwnedGallery(ctx, args.galleryId);
    await ctx.db.patch("galleries", gallery._id, {
      isPrivate: args.isPrivate,
    });
    return null;
  },
});

/** Deletes a gallery and its media rows. Owner only. */
export const deleteGallery = mutation({
  args: { galleryId: v.id("galleries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { gallery } = await loadOwnedGallery(ctx, args.galleryId);

    // Bounded batches; galleries hold tens of items, not millions.
    const media = await ctx.db
      .query("media_items")
      .withIndex("by_galleryId", (q) => q.eq("galleryId", gallery._id))
      .take(MAX_LIMIT);

    for (const item of media) {
      await ctx.db.delete("media_items", item._id);
    }

    await ctx.db.delete("galleries", gallery._id);
    return null;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Full gallery payload for /galleries/[slug], including its media.
 *
 * Privacy model (deliberate): a private gallery is *unlisted*, not
 * authenticated. It is withheld from public listings, the sitemap and search
 * engines, but anyone holding the ~40-bit slug can view it. This is what lets
 * a client share a funeral or wedding gallery with relatives who will never
 * create an account. `isPrivate` is returned so the page can emit
 * `robots: noindex`.
 */
export const getGalleryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const gallery = await ctx.db
      .query("galleries")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (gallery === null) {
      return null;
    }

    const viewer = await getCurrentUser(ctx);

    /**
     * Hidden and NSFW items are withheld here, not filtered in the UI. A
     * moderator additionally sees the items they can act on, so they can unhide
     * something without going to a separate screen.
     */
    const visible = await visibleMediaForViewer(ctx, gallery, viewer);

    const isAdmin = viewer !== null && resolveRole(viewer) === "admin";
    const isOwner = viewer !== null && viewer._id === gallery.userId;

    return {
      ...gallery,
      /**
       * Mapped through `toPublicMedia` so `hdObjectKey` never reaches the
       * client. Spreading the raw document here was how the paid master's
       * storage key would otherwise leak into the page payload.
       */
      media: visible.map((item) => ({
        ...toPublicMedia(item),
        isHidden: item.isHidden ?? false,
        isNsfw: item.isNsfw ?? false,
        canModerate:
          viewer !== null && canModerateMedia(viewer, item, gallery),
      })),
      /** Lets the UI show owner-only controls (privacy toggle, delete). */
      isOwner,
      isAdmin,
    };
  },
});

/**
 * Public, indexable galleries - newest first. Used by the landing page and by
 * `app/sitemap.ts`.
 */
export const getAllPublicGalleries = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    if (args.category !== undefined) {
      // Composite index keeps the category filter inside the index range.
      return await ctx.db
        .query("galleries")
        .withIndex("by_category_and_isPrivate", (q) =>
          q.eq("category", args.category!).eq("isPrivate", false),
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("galleries")
      .withIndex("by_isPrivate", (q) => q.eq("isPrivate", false))
      .order("desc")
      .take(limit);
  },
});

/** Galleries belonging to the signed-in user, for the dashboard list. */
export const getMyGalleries = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }

    return await ctx.db
      .query("galleries")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(Math.min(args.limit ?? DEFAULT_LIMIT, MAX_LIMIT));
  },
});
