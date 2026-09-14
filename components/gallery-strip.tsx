import { ArrowRight, Camera } from "lucide-react";
import Link from "next/link";
import { MediaThumb } from "@/components/media-thumb";
import type { PublicGallery } from "@/lib/convex-server";

/** The design shows seven tiles across. */
const TILE_COUNT = 7;

/**
 * "Our Gallery" - a strip of session photography.
 *
 * The tiles are deliberately NOT links. The design shows plain thumbnails with a
 * single "View more" link for the section, and there is no gallery detail route
 * in the app to link each tile to; `/galleries/[slug]` does not exist yet (see
 * `components/gallery-card.tsx`, which already points at it). Rather than emit
 * seven anchors to a 404, the section has one destination.
 *
 * The strip always renders `TILE_COUNT` slots. Real gallery covers fill them
 * first, and any remainder falls back to the branded placeholder, so the layout
 * holds its shape whether Convex returns seven galleries, two, or none.
 */
export function GalleryStrip({ galleries }: { galleries: PublicGallery[] }) {
  const tiles = Array.from(
    { length: TILE_COUNT },
    (_, index) => galleries[index],
  );

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="py-10 lg:py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {/* Short blue rule leading into the heading. */}
              <span
                aria-hidden="true"
                className="h-0.5 w-8 shrink-0 rounded-full bg-blue-500"
              />
              <h2
                id="gallery-heading"
                className="text-xl font-bold uppercase tracking-[0.04em] text-white sm:text-2xl"
              >
                Our <span className="text-blue-400">Gallery</span>
              </h2>
            </div>
            <p className="mt-1.5 max-w-md text-[0.8rem] leading-snug text-gray-400">
              Take a look at some moments from our studio sessions, artists and
              the work we do.
            </p>
          </div>

          <Link
            href="/galleries"
            className="inline-flex shrink-0 items-center gap-1.5 rounded text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-gray-300 transition-colors hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
          >
            View more
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {tiles.map((gallery, index) => (
            <li
              key={gallery?._id ?? `placeholder-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-gray-950"
            >
              <MediaThumb
                src={gallery?.coverImageUrl}
                /**
                 * Decorative when it is a placeholder, described when it is a
                 * real photograph - a screen reader gains nothing from "gradient
                 * tile" seven times.
                 */
                alt={gallery !== undefined ? gallery.title : ""}
                icon={Camera}
                sizes="(min-width: 1024px) 150px, (min-width: 640px) 25vw, 50vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
