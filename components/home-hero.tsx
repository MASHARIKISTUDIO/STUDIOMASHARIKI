import { CalendarDays, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { STUDIO_LOGO } from "@/lib/partners";
import { HERO_IMAGE } from "@/lib/site-media";
import { siteConfig } from "@/lib/site";

const CRAFT = ["Record", "Mix", "Master", "Create"] as const;

/**
 * Homepage hero.
 *
 * Layered back to front: photograph (when one exists), a scrim to hold text
 * contrast over it, then the blue glows, then content. The glows sit ON TOP of
 * the photo rather than under it, which is what gives the neon cast the design
 * has - underneath, they would be completely hidden by an opaque image.
 */
export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {HERO_IMAGE !== null ? (
        <>
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            sizes="100vw"
            // The LCP element on the homepage, so it opts out of lazy loading
            // and is fetched at high priority.
            priority
            className="object-cover object-center"
          />
          {/**
           * Two-part scrim: a left-weighted horizontal wash so the copy column
           * stays legible over a bright control room, plus a bottom fade into the
           * services grid. Verified intent is contrast, not decoration - the
           * wordmark and body copy have to clear AA over whatever photo lands
           * here, and a photo alone cannot guarantee that.
           */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-950 to-transparent"
          />
        </>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_25%_15%,rgba(37,99,235,0.28),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_50%_at_85%_10%,rgba(56,189,248,0.14),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-xl">
          <Image
            src={STUDIO_LOGO.src}
            alt=""
            width={STUDIO_LOGO.width}
            height={STUDIO_LOGO.height}
            sizes="(min-width: 1024px) 132px, 104px"
            priority
            className="size-24 object-contain drop-shadow-[0_0_36px_rgba(59,130,246,0.55)] lg:size-32"
          />

          <h1 className="mt-6 text-4xl font-bold uppercase leading-[1.02] tracking-[0.01em] text-white [text-shadow:0_0_36px_rgba(59,130,246,0.5)] sm:text-5xl lg:text-6xl">
            {siteConfig.name}
          </h1>

          {/* Record • Mix • Master • Create. A list, so assistive tech announces
              four items rather than one run-on string with stray bullets. */}
          <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {CRAFT.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-blue-300 sm:text-xs"
              >
                {index > 0 ? (
                  <span aria-hidden="true" className="text-blue-500/50">
                    &bull;
                  </span>
                ) : null}
                {step}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-l-2 border-blue-500 pl-4">
            <p className="text-lg font-semibold text-white">
              {siteConfig.tagline}
            </p>
            <p className="mt-1 max-w-md leading-relaxed text-gray-300">
              {siteConfig.heroDescription}
            </p>
          </div>

          {/* Pill CTAs. `rounded-full` overrides the button's default `rounded-lg`
              for these two only - the design uses pills at hero scale and square
              corners everywhere else. */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full shadow-[0_0_28px_-6px_oklch(0.546_0.245_262.881/0.85)]"
            >
              <Link href="/book-a-session">
                <CalendarDays aria-hidden="true" />
                Book a Session
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/25 bg-white/5 backdrop-blur-sm hover:bg-white/10"
            >
              <Link href="/galleries">
                <Images aria-hidden="true" />
                View Gallery
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
