/**
 * Canonical site-wide constants.
 *
 * Kept in one place because these strings appear in metadata, JSON-LD, the
 * sitemap and robots.txt - any drift between them is an SEO bug.
 */

const fallbackUrl = "https://studiomashariki.com";

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return fallbackUrl;
  }
  try {
    return new URL(raw).origin;
  } catch {
    return fallbackUrl;
  }
}

/** Absolute origin, no trailing slash. */
export const siteUrl = resolveSiteUrl();

export const siteConfig = {
  name: "Studio Mashariki",
  legalName: "Studio Mashariki",
  url: siteUrl,
  locale: "en_KE",

  /**
   * Positioning, taken from the homepage design.
   *
   * This used to read "Cinematic Film & Media Delivery", describing the studio
   * as a delivery platform. The homepage leads with the recording studio, and
   * since these strings feed `<title>`, the meta description, the footer and the
   * JSON-LD Organization, the two cannot be allowed to disagree - a page whose
   * H1 says one thing and whose `<title>` says another is both confusing to a
   * visitor and a mixed signal to a crawler. Delivery is still what the galleries
   * and dashboard do; it is a capability, not the headline.
   */
  tagline: "Professional Recording Studio",

  /** Hero copy, verbatim from the design. */
  heroDescription:
    "Built for artists, creators and dreamers. We turn your ideas into high quality sound.",

  /** Social proof line, verbatim from the brief. */
  socialProof:
    "Trusted by leading creators, churches, and families across East Africa and worldwide.",

  /** Used for meta description and the Organization description. */
  description:
    "Studio Mashariki is a professional recording studio for artists, creators and dreamers - recording, mixing and mastering, beat production, video and photography, delivered in Nairobi and across East Africa.",

  areaServed: ["Kenya", "East Africa", "Worldwide"],

  /** The script accent beside the header nav. */
  motto: { first: "Your Sound", second: "Our Mission" },
} as const;

/**
 * Social profiles shown in the site header.
 *
 * ⚠️ THESE HANDLES ARE UNVERIFIED PLACEHOLDERS. They are the obvious guess from
 * the brand name, not confirmed accounts - correct them (or delete the entries)
 * before launch, because a header icon that 404s is worse than no icon.
 *
 * Deliberately NOT fed into `organizationSchema().sameAs` in `lib/seo.ts`. That
 * module's header explains why: emitting `sameAs` for accounts we have not
 * verified is a Google structured-data violation. Once these are confirmed real,
 * wiring them into `sameAs` is a genuine SEO win and worth doing then.
 */
export type SocialPlatform = "instagram" | "youtube" | "tiktok";

export const socialLinks: ReadonlyArray<{
  platform: SocialPlatform;
  /** Used as the accessible name, since the icons are decorative. */
  label: string;
  href: string;
}> = [
  {
    platform: "instagram",
    label: "Studio Mashariki on Instagram",
    href: "https://www.instagram.com/studiomashariki",
  },
  {
    platform: "youtube",
    label: "Studio Mashariki on YouTube",
    href: "https://www.youtube.com/@studiomashariki",
  },
  {
    platform: "tiktok",
    label: "Studio Mashariki on TikTok",
    href: "https://www.tiktok.com/@studiomashariki",
  },
];

/** Builds an absolute URL from a root-relative path. */
export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Public gallery permalink. */
export function galleryUrl(slug: string): string {
  return absoluteUrl(`/galleries/${slug}`);
}

/** Category landing page permalink. */
export function categoryUrl(slug: string): string {
  return absoluteUrl(`/categories/${slug}`);
}

/** Public path for a service landing page. Booking is a top-level route. */
export function servicePath(slug: string): string {
  return slug === "book-a-session" ? "/book-a-session" : `/services/${slug}`;
}

/** Service landing page permalink. */
export function serviceUrl(slug: string): string {
  return absoluteUrl(servicePath(slug));
}
