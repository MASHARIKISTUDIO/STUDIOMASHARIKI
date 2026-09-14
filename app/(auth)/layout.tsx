import { ArrowLeft, Mic, Sparkles, SlidersHorizontal, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { STUDIO_LOGO } from "@/lib/partners";
import { siteConfig } from "@/lib/site";

/**
 * Shared shell for `/sign-in` and `/sign-up`.
 *
 * `(auth)` is a route group, so it adds no URL segment - the pages underneath
 * still live at `/sign-in` and `/sign-up`, which is what `app/robots.ts`
 * already disallows and what Clerk is pointed at via
 * `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`.
 *
 * Deliberately NOT wrapped in `SiteHeader`/`SiteFooter`. An auth page with the
 * full site nav gives someone half-way through a password reset a dozen ways to
 * leave; the single "Back to site" link is the only exit that belongs here.
 */

/** The four-beat brand line from the homepage hero. */
const CRAFT = ["Record", "Mix", "Master", "Create"] as const;

/**
 * The homepage's assurance strip, reused verbatim.
 *
 * This is the panel's whole job: someone is about to hand over a password, and
 * the fastest way to earn that is to show the same claims they just read on the
 * page they arrived from. New copy here would read as a different site.
 */
const ASSURANCES = [
  {
    icon: Mic,
    title: "Professional equipment",
    body: "Industry standard gear for crystal clear sound.",
  },
  {
    icon: SlidersHorizontal,
    title: "Expert engineers",
    body: "Skilled and experienced sound professionals.",
  },
  {
    icon: Sparkles,
    title: "Creative environment",
    body: "A space that inspires greatness.",
  },
  {
    icon: Users,
    title: "Artist support",
    body: "From recording to release, we're with you.",
  },
] as const;

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/**
       * Two glows, not one. The top-centre wash is the same one the homepage
       * hero uses, so the pages feel continuous; the second, tighter glow sits
       * behind the left panel to stop the wide layout from going flat black in
       * the middle. Both are `aria-hidden` decoration behind the content.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.22),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_12%_45%,rgba(59,130,246,0.16),transparent_75%)]"
      />

      <header className="relative border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
            aria-label={`${siteConfig.name} home`}
          >
            <Image
              src={STUDIO_LOGO.src}
              alt=""
              width={STUDIO_LOGO.width}
              height={STUDIO_LOGO.height}
              sizes="36px"
              priority
              className="size-9 shrink-0 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-blue-400">
                Studio
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                Mashariki
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20 lg:py-20">
          {/**
           * Hidden below `lg` rather than stacked above the form. On a phone the
           * only thing someone came here to do is sign in, and pushing the form
           * below a screenful of marketing copy buries it.
           */}
          <section className="hidden lg:block">
            <Image
              src={STUDIO_LOGO.src}
              alt=""
              width={STUDIO_LOGO.width}
              height={STUDIO_LOGO.height}
              sizes="88px"
              priority
              /* The neon halo the mark carries on the homepage hero. The logo is
                 gold-and-blue on transparent, so it needs no plate behind it. */
              className="size-20 object-contain drop-shadow-[0_0_28px_rgba(59,130,246,0.45)]"
            />

            {/* Uppercase, heavy and slightly opened up, with the same neon halo
                as the mark above it - that lockup is the homepage hero's
                signature, and a default tight-tracked heading here would read
                as a different brand. */}
            <h2 className="mt-7 text-4xl font-bold uppercase leading-[1.1] tracking-[0.01em] text-white [text-shadow:0_0_30px_rgba(59,130,246,0.5)]">
              {siteConfig.name}
            </h2>

            {/* Record · Mix · Master · Create, as a separated list so a screen
                reader announces four items instead of one run-on string. */}
            <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {CRAFT.map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-blue-400"
                >
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-blue-500/40">
                      &bull;
                    </span>
                  ) : null}
                  {step}
                </li>
              ))}
            </ul>

            {/* Blue left rule, bold lead line, quieter body - the homepage
                hero's exact treatment. */}
            <div className="mt-8 max-w-md border-l-2 border-blue-500/50 pl-4">
              <p className="font-semibold text-white">{siteConfig.tagline}</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-gray-300">
                {siteConfig.heroDescription}
              </p>
            </div>

            {/**
             * Hairline dividers between the columns, echoing the divided
             * assurance strip under the homepage hero. Applied to the even
             * children only, and only from `sm` up, so the single-column stack
             * gets no stray vertical rule.
             */}
            <ul className="mt-12 grid max-w-lg gap-y-8 sm:grid-cols-2">
              {ASSURANCES.map((assurance, index) => (
                <li
                  key={assurance.title}
                  className={
                    index % 2 === 1
                      ? "sm:border-l sm:border-white/10 sm:pl-8"
                      : "sm:pr-8"
                  }
                >
                  <span
                    className="inline-flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                    aria-hidden="true"
                  >
                    <assurance.icon className="size-5" />
                  </span>
                  <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-white">
                    {assurance.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                    {assurance.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* `justify-center` on mobile, `justify-end` once the brand panel is
              alongside, so the card stays optically tied to the right edge of
              the 6xl container instead of drifting mid-gutter. */}
          <div className="flex justify-center lg:justify-end">{children}</div>
        </div>
      </main>
    </div>
  );
}
