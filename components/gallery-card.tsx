import { ImageIcon, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_META } from "@/convex/categories";
import type { PublicGallery } from "@/lib/convex-server";

/**
 * Poster tile for a gallery, used on the galleries index and category pages.
 *
 * Reads only the denormalised `coverImageUrl` on the gallery document, so a
 * listing of N galleries stays a single query with no fan-out into media_items.
 */
export function GalleryCard({ gallery }: { gallery: PublicGallery }) {
  const primary = CATEGORY_META[gallery.category];

  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-soft transition-all duration-200 hover:border-blue-500/40 hover:shadow-soft-md">
      <Link
        href={`/galleries/${gallery.slug}`}
        className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
          {gallery.coverImageUrl !== undefined ? (
            <Image
              src={gallery.coverImageUrl}
              alt={gallery.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-700">
              <ImageIcon className="size-8" aria-hidden="true" />
            </div>
          )}

          {/* Scrim only where the badges sit, so the photograph is not dimmed
              across its whole area. */}
          <div
            className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent"
            aria-hidden="true"
          />

          <PlayCircle
            className="absolute bottom-3 right-3 size-9 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {gallery.categories.map((slug) => (
              <Badge
                key={slug}
                className="border-none bg-blue-600 text-[11px] font-medium text-white"
              >
                {CATEGORY_META[slug].label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-white">
            {gallery.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-400">
            {gallery.description ?? primary.tagline}
          </p>
          {gallery.location !== undefined && (
            <p className="mt-3 text-xs text-gray-500">{gallery.location}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
