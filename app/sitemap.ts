import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/convex/categories";
import { listPublicGalleries } from "@/lib/convex-server";
import { listServicePageSlugs } from "@/lib/service-pages";
import { absoluteUrl, categoryUrl, galleryUrl, serviceUrl } from "@/lib/site";

/**
 * Dynamic sitemap: static pages + the 12 category landing pages + every
 * PUBLIC gallery.
 *
 * Private galleries are never listed. `getAllPublicGalleries` filters on the
 * `by_isPrivate` index, so unlisted galleries cannot leak into the sitemap even
 * by accident.
 *
 * Revalidated hourly so galleries published after a deploy still get indexed
 * without rebuilding the site.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const galleries = await listPublicGalleries({ limit: 100 });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // The gallery index, linked from the homepage's "View more".
      url: absoluteUrl("/galleries"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: categoryUrl(category.slug),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = listServicePageSlugs().map(
    (slug) => ({
      url: serviceUrl(slug),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: slug === "book-a-session" ? 0.9 : 0.8,
    }),
  );

  const galleryRoutes: MetadataRoute.Sitemap = galleries.map((gallery) => ({
    url: galleryUrl(gallery.slug),
    lastModified: new Date(gallery.createdAt),
    changeFrequency: "monthly",
    priority: 0.7,
    // Image sitemap entry improves discovery of the gallery's poster frame.
    ...(gallery.coverImageUrl !== undefined
      ? { images: [gallery.coverImageUrl] }
      : {}),
  }));

  return [...staticRoutes, ...serviceRoutes, ...categoryRoutes, ...galleryRoutes];
}
