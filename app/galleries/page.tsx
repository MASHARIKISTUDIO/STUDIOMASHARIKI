import type { Metadata } from "next";
import { GalleryCard } from "@/components/gallery-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { listPublicGalleries } from "@/lib/convex-server";
import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * Public gallery index.
 *
 * Exists because the homepage's "View more" link needs a real destination - the
 * design points at a full gallery and there was no route behind it.
 *
 * Known gap, inherited not introduced: `GalleryCard` links each tile to
 * `/galleries/[slug]`, and that detail route does not exist yet. Until it does,
 * the cards here dead-end. The listing itself is correct and useful, and the
 * detail page is a separate piece of work.
 */
export const metadata: Metadata = {
  title: "Gallery",
  description: `Sessions, artists and delivered work from ${siteConfig.name}.`,
  alternates: { canonical: absoluteUrl("/galleries") },
};

export default async function GalleriesPage() {
  const galleries = await listPublicGalleries({ limit: 60 });

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-gray-950">
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_0%,rgba(37,99,235,0.2),transparent_70%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-0.5 w-8 shrink-0 rounded-full bg-blue-500"
              />
              <h1 className="text-3xl font-bold uppercase tracking-[0.03em] text-white sm:text-4xl">
                Our <span className="text-blue-400">Gallery</span>
              </h1>
            </div>
            <p className="mt-4 max-w-xl leading-relaxed text-gray-300">
              Moments from our studio sessions, the artists we work with, and the
              work we deliver.
            </p>
          </div>
        </section>

        <section aria-labelledby="galleries-heading" className="py-14 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="galleries-heading" className="sr-only">
              Public galleries
            </h2>

            {galleries.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {galleries.map((gallery) => (
                  <GalleryCard key={gallery._id} gallery={gallery} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-gray-500">
                No public galleries yet. Run{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-gray-300">
                  pnpm seed
                </code>{" "}
                to publish the sample galleries.
              </p>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
