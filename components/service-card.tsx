import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MediaThumb } from "@/components/media-thumb";
import { CATEGORY_META } from "@/convex/categories";
import type { Service } from "@/lib/services";

/**
 * One tile in the services grid.
 *
 * Link structure matters here. The card has a primary destination (the arrow
 * button, bottom-right) and, on some cards, a list of category links inside it.
 * Nested interactive elements are invalid HTML and unusable with a keyboard, so
 * the whole card is NOT one big anchor: the title is the primary link and it
 * carries a `::after` overlay that makes the card's empty space clickable, while
 * the category links sit above that overlay in the stacking order and stay
 * independently focusable.
 */
export function ServiceCard({
  service,
  imageSizes,
}: {
  service: Service;
  imageSizes: string;
}) {
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-soft transition-all duration-200 hover:border-blue-500/50 hover:shadow-soft-md">
      <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
        <MediaThumb
          src={service.image}
          alt=""
          icon={service.icon}
          sizes={imageSizes}
        />
        {/* Fade into the card body so the thumbnail does not end on a hard line. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-900 to-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <service.icon
          className="size-5 shrink-0 text-blue-400"
          aria-hidden="true"
        />

        <h3 className="mt-2.5 text-[0.8rem] font-bold uppercase leading-tight tracking-[0.06em] text-white">
          {/* `after:absolute inset-0` turns the card into one large hit target
              without wrapping it in an anchor. `z-0` keeps it below the category
              links, which are lifted to `z-10`. */}
          <Link
            href={service.href}
            className="rounded after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {service.title}
          </Link>
        </h3>

        {service.lines.length > 0 ? (
          <p className="mt-1.5 text-[0.8rem] leading-snug text-gray-400">
            {service.lines.map((line, index) => (
              <span key={line} className="block">
                {line}
                {index < service.lines.length - 1 ? " " : null}
              </span>
            ))}
          </p>
        ) : null}

        {service.categoryLinks !== undefined ? (
          <ul className="relative z-10 mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.75rem] leading-snug text-gray-400">
            {service.categoryLinks.map((link, index) => (
              <li key={link.category} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-blue-500/40">
                    |
                  </span>
                ) : null}
                <Link
                  href={`/categories/${link.category}`}
                  title={CATEGORY_META[link.category].tagline}
                  className="rounded transition-colors hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {/* `mt-auto` pins the arrow to the bottom of the tallest card in the row,
            so the buttons line up across a row of uneven copy lengths. */}
        <div className="mt-auto flex justify-end pt-3">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-200 group-hover:bg-blue-500 group-hover:shadow-[0_0_16px_-2px_oklch(0.623_0.214_259.815/0.9)]"
          >
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
