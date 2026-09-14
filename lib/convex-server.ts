import { fetchQuery } from "convex/nextjs";
import { unstable_rethrow } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { GalleryCategory } from "@/convex/categories";

/**
 * Server-side Convex reads for Server Components, `sitemap.ts` and
 * `generateMetadata`.
 *
 * Every helper degrades to an empty/null result instead of throwing. A page
 * that renders without its gallery strip is recoverable; a sitemap request that
 * hard-fails because Convex was briefly unreachable is not.
 *
 * IMPORTANT: `unstable_rethrow` must be the first statement in each catch.
 * Convex's `fetchQuery` issues its request with `cache: "no-store"`, and Next
 * signals "this route cannot be prerendered" by *throwing* on such a fetch
 * during static generation. Swallowing that error would let a route be
 * prerendered with permanently empty data. Rethrowing lets Next mark the route
 * dynamic, which is what we want here since gallery listings must stay fresh.
 */

function convexConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  return url !== undefined && url.trim() !== "";
}

export type PublicGallery = Awaited<
  ReturnType<typeof listPublicGalleries>
>[number];

export async function listPublicGalleries(options?: {
  limit?: number;
  category?: GalleryCategory;
}) {
  if (!convexConfigured()) {
    return [];
  }

  try {
    return await fetchQuery(api.galleries.getAllPublicGalleries, {
      limit: options?.limit,
      category: options?.category,
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("[convex] getAllPublicGalleries failed:", error);
    return [];
  }
}

export async function getGalleryBySlug(slug: string) {
  if (!convexConfigured()) {
    return null;
  }

  try {
    return await fetchQuery(api.galleries.getGalleryBySlug, { slug });
  } catch (error) {
    unstable_rethrow(error);
    console.error("[convex] getGalleryBySlug failed:", error);
    return null;
  }
}
