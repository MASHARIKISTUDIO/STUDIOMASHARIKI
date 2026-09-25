import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./model/users";

/** Row that holds the public hero videos. Separate from booking settings. */
const HERO_SETTINGS_KEY = "hero";

const heroVideosValidator = v.object({
  homeVideoUrl: v.union(v.string(), v.null()),
  galleryVideoUrl: v.union(v.string(), v.null()),
});

const MAX_VIDEO_URL_LENGTH = 2000;

function normaliseVideoUrl(raw: string): string {
  const url = raw.trim();
  if (url.length === 0) {
    throw new Error("Enter a video URL, or remove the background.");
  }
  if (url.length > MAX_VIDEO_URL_LENGTH) {
    throw new Error("That video URL is too long.");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a full https URL to an MP4 or WebM file.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Hero videos must use an https URL.");
  }
  return parsed.toString();
}

function loadHeroSettings(ctx: MutationCtx) {
  return ctx.db
    .query("site_settings")
    .withIndex("by_key", (q) => q.eq("key", HERO_SETTINGS_KEY))
    .unique();
}

/** Drop one optional video field without wiping the rest of the row. */
function withoutVideo(
  existing: Doc<"site_settings">,
  field: "homeHeroVideoUrl" | "galleryHeroVideoUrl",
  updatedAt: number,
  updatedBy: Doc<"users">["_id"],
) {
  return {
    key: existing.key,
    ...(existing.heroTitle !== undefined ? { heroTitle: existing.heroTitle } : {}),
    ...(existing.heroSubtitle !== undefined
      ? { heroSubtitle: existing.heroSubtitle }
      : {}),
    ...(existing.heroImageUrl !== undefined
      ? { heroImageUrl: existing.heroImageUrl }
      : {}),
    ...(existing.heroCtaLabel !== undefined
      ? { heroCtaLabel: existing.heroCtaLabel }
      : {}),
    ...(existing.heroCtaHref !== undefined
      ? { heroCtaHref: existing.heroCtaHref }
      : {}),
    ...(existing.defaultPriceKes !== undefined
      ? { defaultPriceKes: existing.defaultPriceKes }
      : {}),
    ...(existing.whatsappNumber !== undefined
      ? { whatsappNumber: existing.whatsappNumber }
      : {}),
    ...(field !== "homeHeroVideoUrl" && existing.homeHeroVideoUrl !== undefined
      ? { homeHeroVideoUrl: existing.homeHeroVideoUrl }
      : {}),
    ...(field !== "galleryHeroVideoUrl" &&
    existing.galleryHeroVideoUrl !== undefined
      ? { galleryHeroVideoUrl: existing.galleryHeroVideoUrl }
      : {}),
    updatedAt,
    updatedBy,
  };
}

/**
 * Background videos for the homepage and gallery heroes.
 * Public: the URLs are already world-readable media.
 */
export const getHeroVideos = query({
  args: {},
  returns: heroVideosValidator,
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("site_settings")
      .withIndex("by_key", (q) => q.eq("key", HERO_SETTINGS_KEY))
      .unique();
    return {
      homeVideoUrl: settings?.homeHeroVideoUrl ?? null,
      galleryVideoUrl: settings?.galleryHeroVideoUrl ?? null,
    };
  },
});

/** Set or clear one hero background. `null` removes it. Admin only. */
export const setHeroVideo = mutation({
  args: {
    page: v.union(v.literal("home"), v.literal("gallery")),
    videoUrl: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const field =
      args.page === "home" ? "homeHeroVideoUrl" : "galleryHeroVideoUrl";
    const existing = await loadHeroSettings(ctx);
    const now = Date.now();

    if (args.videoUrl === null) {
      if (existing === null) {
        return null;
      }
      await ctx.db.replace(
        "site_settings",
        existing._id,
        withoutVideo(existing, field, now, admin._id),
      );
      return null;
    }

    const videoUrl = normaliseVideoUrl(args.videoUrl);
    if (existing === null) {
      await ctx.db.insert("site_settings", {
        key: HERO_SETTINGS_KEY,
        [field]: videoUrl,
        updatedAt: now,
        updatedBy: admin._id,
      });
      return null;
    }

    await ctx.db.patch("site_settings", existing._id, {
      [field]: videoUrl,
      updatedAt: now,
      updatedBy: admin._id,
    });
    return null;
  },
});
