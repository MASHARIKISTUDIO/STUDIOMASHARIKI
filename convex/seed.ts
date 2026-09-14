import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import type { GalleryCategory } from "./categories";

/**
 * Seed data for Studio Mashariki.
 *
 * Run with:  pnpm seed          (alias for `convex run seed:run`)
 * Clear with: pnpm exec convex run seed:clear
 *
 * Registered as an `internalMutation` so it is NOT reachable from the public
 * API - it writes data, and nothing on the internet should be able to trigger
 * it. The Convex CLI has admin access and can still invoke it.
 *
 * Idempotent: each gallery uses a fixed slug, and a rerun deletes the previous
 * seed rows before reinserting, so `pnpm seed` twice yields the same state.
 *
 * Every media URL below was verified to return 200/206 before being committed.
 * Photography: Pexels / Unsplash. The one Cloudflare item is Cloudflare's own
 * public documentation video, so the Stream playback path renders for real
 * rather than pointing at a fabricated UID.
 */

/** Pexels delivers a resized JPEG from these query params. */
function pexels(id: number, width: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

function unsplash(id: string, width: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;
}

const FULL = 1600;
const THUMB = 600;

type SeedMedia = {
  type: "video" | "image";
  provider: "s3" | "cloudflare";
  url: string;
  title: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  playbackId?: string;
  width?: number;
  height?: number;
};

type SeedGallery = {
  slug: string;
  title: string;
  description: string;
  category: GalleryCategory;
  categories: GalleryCategory[];
  isPrivate: boolean;
  eventDate: string;
  location: string;
  media: SeedMedia[];
};

const SEED_GALLERIES: SeedGallery[] = [
  // ---------------------------------------------------------------------
  // 1. Arusi & Ruracio hybrid - video + photos
  //    Uses the slug from the brief's example URL.
  // ---------------------------------------------------------------------
  {
    slug: "xep92awt",
    title: "Wanjiku & Kamau - Ruracio & Arusi",
    description:
      "Two ceremonies, one story. The Ruracio negotiations in Nyeri followed by the Arusi at Karen Country Lodge, delivered in 4K with every original file available to download.",
    category: "arusi",
    categories: ["arusi", "ruracio"],
    isPrivate: false,
    eventDate: "2026-01-17",
    location: "Karen, Nairobi, Kenya",
    media: [
      {
        type: "video",
        provider: "s3",
        url: "https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4",
        title: "Arusi Highlight Film - 4K",
        thumbnailUrl: pexels(265722, THUMB),
        downloadUrl:
          "https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4",
        width: 2560,
        height: 1440,
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(265722, FULL),
        title: "Exchanging vows",
        thumbnailUrl: pexels(265722, THUMB),
        downloadUrl: pexels(265722, 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(1024993, FULL),
        title: "The couple, golden hour",
        thumbnailUrl: pexels(1024993, THUMB),
        downloadUrl: pexels(1024993, 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(313707, FULL),
        title: "Rings and dowry gifts",
        thumbnailUrl: pexels(313707, THUMB),
        downloadUrl: pexels(313707, 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: unsplash("1519741497674-611481863552", FULL),
        title: "Ruracio family blessing",
        thumbnailUrl: unsplash("1519741497674-611481863552", THUMB),
        downloadUrl: unsplash("1519741497674-611481863552", 2400),
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 2. Choir Chorals & Music Videos - music video + high-res stills.
  //    Includes the one Cloudflare Stream item (real, playable UID).
  // ---------------------------------------------------------------------
  {
    slug: "km4tz9rb",
    title: "Sauti ya Mashariki - Choral Concert & Music Video",
    description:
      "A 40-voice choral performance recorded multi-camera at All Saints Cathedral, plus the studio music video for the lead single. Ad-free 4K streaming with high-resolution stills.",
    category: "choir-chorals",
    categories: ["choir-chorals", "music-videos"],
    isPrivate: false,
    eventDate: "2025-11-29",
    location: "All Saints Cathedral, Nairobi, Kenya",
    media: [
      {
        // Cloudflare Stream: `url` is the HLS manifest and `playbackId` is the
        // Stream UID the <Stream> player needs.
        type: "video",
        provider: "cloudflare",
        url: "https://customer-f33zs165nr7gyfy4.cloudflarestream.com/6b9e68b07dfee8cc2d116e4c51d6a957/manifest/video.m3u8",
        title: "Choral Concert - Full Performance (HLS)",
        thumbnailUrl:
          "https://customer-f33zs165nr7gyfy4.cloudflarestream.com/6b9e68b07dfee8cc2d116e4c51d6a957/thumbnails/thumbnail.jpg",
        playbackId: "6b9e68b07dfee8cc2d116e4c51d6a957",
      },
      {
        type: "video",
        provider: "s3",
        url: "https://videos.pexels.com/video-files/4114797/4114797-hd_1920_1080_25fps.mp4",
        title: "Music Video - Lead Single",
        thumbnailUrl: pexels(1246437, THUMB),
        downloadUrl:
          "https://videos.pexels.com/video-files/4114797/4114797-hd_1920_1080_25fps.mp4",
        width: 1920,
        height: 1080,
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(1246437, FULL),
        title: "Full choir under stage lights",
        thumbnailUrl: pexels(1246437, THUMB),
        downloadUrl: pexels(1246437, 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(1105666, FULL),
        title: "Soloist mid-performance",
        thumbnailUrl: pexels(1105666, THUMB),
        downloadUrl: pexels(1105666, 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: unsplash("1516280440614-37939bbacd81", FULL),
        title: "Conductor and first sopranos",
        thumbnailUrl: unsplash("1516280440614-37939bbacd81", THUMB),
        downloadUrl: unsplash("1516280440614-37939bbacd81", 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(210922, FULL),
        title: "Studio session stills",
        thumbnailUrl: pexels(210922, THUMB),
        downloadUrl: pexels(210922, 2400),
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 3. Graduations & Social Media Reels - vertical video formats + photos
  // ---------------------------------------------------------------------
  {
    slug: "q7hd3npv",
    title: "Achieng' Graduation - Ceremony & Reels",
    description:
      "The full walk across the stage plus a set of vertical reels cut for Instagram and TikTok the same afternoon. Portrait gallery included.",
    category: "graduations",
    categories: ["graduations", "social-media-reels"],
    isPrivate: false,
    eventDate: "2026-06-12",
    location: "Kenyatta University, Nairobi, Kenya",
    media: [
      {
        // Genuinely portrait: 1080x1920.
        type: "video",
        provider: "s3",
        url: "https://videos.pexels.com/video-files/5495890/5495890-hd_1080_1920_30fps.mp4",
        title: "Graduation Reel - Vertical 9:16",
        thumbnailUrl: unsplash("1541339907198-e08756dedf3f", THUMB),
        downloadUrl:
          "https://videos.pexels.com/video-files/5495890/5495890-hd_1080_1920_30fps.mp4",
        width: 1080,
        height: 1920,
      },
      {
        type: "image",
        provider: "s3",
        url: unsplash("1541339907198-e08756dedf3f", FULL),
        title: "Cap toss on the lawn",
        thumbnailUrl: unsplash("1541339907198-e08756dedf3f", THUMB),
        downloadUrl: unsplash("1541339907198-e08756dedf3f", 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(267885, FULL),
        title: "Receiving the certificate",
        thumbnailUrl: pexels(267885, THUMB),
        downloadUrl: pexels(267885, 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: unsplash("1627556704302-624286467c65", FULL),
        title: "Portrait with family",
        thumbnailUrl: unsplash("1627556704302-624286467c65", THUMB),
        downloadUrl: unsplash("1627556704302-624286467c65", 2400),
      },
      {
        type: "image",
        provider: "s3",
        url: pexels(1454360, FULL),
        title: "Campus celebration",
        thumbnailUrl: pexels(1454360, THUMB),
        downloadUrl: pexels(1454360, 2400),
      },
    ],
  },
];

/**
 * Demo owner for seeded galleries.
 *
 * The `tokenIdentifier` is intentionally not a real Clerk identity, so no
 * signed-in user is ever treated as the owner of seed content (`isOwner` stays
 * false and the destructive owner-only controls stay hidden).
 */
const SEED_TOKEN_IDENTIFIER = "seed|studio-mashariki-demo";

async function ensureSeedUser(ctx: MutationCtx): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", SEED_TOKEN_IDENTIFIER),
    )
    .unique();

  if (existing !== null) {
    return existing._id;
  }

  return await ctx.db.insert("users", {
    clerkId: "seed_studio_mashariki_demo",
    tokenIdentifier: SEED_TOKEN_IDENTIFIER,
    name: "Studio Mashariki",
    email: "hello@studiomashariki.com",
  });
}

/** Removes a seeded gallery and its media so the seed can be re-run cleanly. */
async function removeGalleryBySlug(ctx: MutationCtx, slug: string) {
  const gallery = await ctx.db
    .query("galleries")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (gallery === null) {
    return;
  }

  const media = await ctx.db
    .query("media_items")
    .withIndex("by_galleryId", (q) => q.eq("galleryId", gallery._id))
    .take(200);

  for (const item of media) {
    await ctx.db.delete("media_items", item._id);
  }
  await ctx.db.delete("galleries", gallery._id);
}

export const run = internalMutation({
  args: {},
  returns: v.object({
    galleries: v.number(),
    mediaItems: v.number(),
    slugs: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const userId = await ensureSeedUser(ctx);

    let mediaCount = 0;

    for (const seed of SEED_GALLERIES) {
      // Idempotency: clear any previous run of this exact gallery.
      await removeGalleryBySlug(ctx, seed.slug);

      const cover =
        seed.media.find((item) => item.type === "image")?.url ??
        seed.media.find((item) => item.thumbnailUrl !== undefined)
          ?.thumbnailUrl;

      const galleryId = await ctx.db.insert("galleries", {
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        category: seed.category,
        categories: seed.categories,
        isPrivate: seed.isPrivate,
        userId,
        coverImageUrl: cover,
        eventDate: seed.eventDate,
        location: seed.location,
        createdAt: Date.now(),
      });

      for (const [index, item] of seed.media.entries()) {
        await ctx.db.insert("media_items", {
          galleryId,
          type: item.type,
          provider: item.provider,
          url: item.url,
          title: item.title,
          thumbnailUrl: item.thumbnailUrl,
          downloadUrl: item.downloadUrl,
          playbackId: item.playbackId,
          width: item.width,
          height: item.height,
          order: index,
        });
        mediaCount += 1;
      }
    }

    return {
      galleries: SEED_GALLERIES.length,
      mediaItems: mediaCount,
      slugs: SEED_GALLERIES.map((seed) => seed.slug),
    };
  },
});

/** Removes everything `run` created, including the demo owner. */
export const clear = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const seed of SEED_GALLERIES) {
      await removeGalleryBySlug(ctx, seed.slug);
    }

    const seedUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", SEED_TOKEN_IDENTIFIER),
      )
      .unique();

    if (seedUser !== null) {
      await ctx.db.delete("users", seedUser._id);
    }
    return null;
  },
});
