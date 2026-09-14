import { v } from "convex/values";

/**
 * Studio Mashariki product taxonomy.
 *
 * This module is the single source of truth for the 12 supported categories.
 * It is imported by the Convex schema/functions AND by the Next.js frontend
 * (`@/convex/categories`) so the slugs, labels and JSON-LD types can never
 * drift between database, UI and structured data.
 *
 * Only plain values are exported here - no Convex functions are registered.
 */

/**
 * Argument/schema validator for a single category.
 *
 * Written out as explicit literals (rather than mapped from the metadata array)
 * so TypeScript infers a precise string-literal union instead of `string`.
 */
export const categoryValidator = v.union(
  v.literal("ruracio"),
  v.literal("arusi"),
  v.literal("events"),
  v.literal("funeral"),
  v.literal("dowry"),
  v.literal("music-videos"),
  v.literal("choir-chorals"),
  v.literal("social-media-reels"),
  v.literal("birthday-parties"),
  v.literal("baby-showers"),
  v.literal("anniversaries"),
  v.literal("graduations"),
);

export type GalleryCategory = typeof categoryValidator.type;

/**
 * schema.org types used for per-category JSON-LD on gallery pages.
 * Ceremonies and milestones are `Event`; music work uses the music vocabulary.
 */
export type CategorySchemaType =
  | "Event"
  | "MusicGroup"
  | "MusicVideoObject"
  | "VideoObject";

export type CategoryMeta = {
  slug: GalleryCategory;
  /** Human label shown in UI and used in structured data names. */
  label: string;
  /** Short marketing line for the products grid. */
  tagline: string;
  /** Longer copy used for SEO landing sections and meta descriptions. */
  description: string;
  /** Primary schema.org @type for a gallery in this category. */
  schemaType: CategorySchemaType;
  /** Keywords appended to page metadata. */
  keywords: string[];
};

/**
 * Ordered exactly as the 12 products should appear in the UI.
 * `Record` keyed by slug guarantees at compile time that every category in the
 * validator union has metadata - a missing entry is a type error.
 */
export const CATEGORY_META: Record<GalleryCategory, CategoryMeta> = {
  ruracio: {
    slug: "ruracio",
    label: "Ruracio",
    tagline: "Dowry ceremony films, honoured properly.",
    description:
      "Cinematic Ruracio coverage that captures the negotiation, the blessing and the joining of two families in 4K.",
    schemaType: "Event",
    keywords: ["ruracio", "dowry ceremony", "kikuyu traditional ceremony"],
  },
  arusi: {
    slug: "arusi",
    label: "Arusi",
    tagline: "Wedding films made to be rewatched.",
    description:
      "Full Arusi wedding films and photo galleries, delivered in 4K with original-quality downloads for the family archive.",
    schemaType: "Event",
    keywords: ["arusi", "wedding film", "wedding videographer"],
  },
  events: {
    slug: "events",
    label: "Events",
    tagline: "Corporate and community events.",
    description:
      "General event coverage for conferences, launches, fundraisers and community gatherings, delivered as a shareable gallery.",
    schemaType: "Event",
    keywords: ["event videography", "event photography", "corporate event"],
  },
  funeral: {
    slug: "funeral",
    label: "Funeral",
    tagline: "Memorial services, handled with care.",
    description:
      "Respectful memorial and funeral service coverage, privately shared with family members who could not travel.",
    schemaType: "Event",
    keywords: ["funeral service", "memorial video", "celebration of life"],
  },
  dowry: {
    slug: "dowry",
    label: "Dowry",
    tagline: "Standalone dowry coverage.",
    description:
      "Dedicated dowry ceremony films and photography for families marking the agreement between two households.",
    schemaType: "Event",
    keywords: ["dowry ceremony", "traditional engagement"],
  },
  "music-videos": {
    slug: "music-videos",
    label: "Music Videos",
    tagline: "Broadcast-ready music videos.",
    description:
      "Music video delivery with 4K streaming, ad-free playback and original masters available for download.",
    schemaType: "MusicVideoObject",
    keywords: ["music video", "4k music video", "gospel music video"],
  },
  "choir-chorals": {
    slug: "choir-chorals",
    label: "Choir Chorals",
    tagline: "Choral performances in full fidelity.",
    description:
      "Multi-camera choir and choral performance recordings with high-fidelity audio, built for churches and choirs.",
    schemaType: "MusicGroup",
    keywords: ["choir", "choral performance", "church choir recording"],
  },
  "social-media-reels": {
    slug: "social-media-reels",
    label: "Social Media Reels",
    tagline: "Vertical cuts, ready to post.",
    description:
      "Vertical, platform-ready reels cut from your main film for Instagram, TikTok and YouTube Shorts.",
    schemaType: "VideoObject",
    keywords: ["social media reels", "vertical video", "short form video"],
  },
  "birthday-parties": {
    slug: "birthday-parties",
    label: "Birthday Parties",
    tagline: "Every candle, every year.",
    description:
      "Birthday party films and photo galleries, from first birthdays to milestone celebrations.",
    schemaType: "Event",
    keywords: ["birthday party", "birthday videographer"],
  },
  "baby-showers": {
    slug: "baby-showers",
    label: "Baby Showers",
    tagline: "Welcoming the newest arrival.",
    description:
      "Baby shower and gender reveal coverage, delivered as a private gallery for close family and friends.",
    schemaType: "Event",
    keywords: ["baby shower", "gender reveal"],
  },
  anniversaries: {
    slug: "anniversaries",
    label: "Anniversaries",
    tagline: "Years worth celebrating.",
    description:
      "Anniversary films that revisit the story so far, delivered alongside a full photo gallery.",
    schemaType: "Event",
    keywords: ["anniversary", "vow renewal"],
  },
  graduations: {
    slug: "graduations",
    label: "Graduations",
    tagline: "The walk, the cap, the moment.",
    description:
      "Graduation ceremony films and portrait galleries, plus vertical reels for sharing the same day.",
    schemaType: "Event",
    keywords: ["graduation", "graduation photography", "campus ceremony"],
  },
};

/** All categories in display order. */
export const CATEGORIES: CategoryMeta[] = Object.values(CATEGORY_META);

/** All valid slugs, useful for sitemap generation and static params. */
export const CATEGORY_SLUGS = CATEGORIES.map((category) => category.slug);

/** Narrowing helper for untrusted input (route params, query strings). */
export function isGalleryCategory(value: string): value is GalleryCategory {
  return Object.prototype.hasOwnProperty.call(CATEGORY_META, value);
}

/** Convenience lookup that never returns undefined for a valid slug. */
export function getCategoryMeta(slug: GalleryCategory): CategoryMeta {
  return CATEGORY_META[slug];
}
