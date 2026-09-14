import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { SocialLinks } from "@/components/social-links";
import { STUDIO_LOGO } from "@/lib/partners";
import { siteConfig } from "@/lib/site";

/**
 * Site header.
 *
 * Stays a Server Component: the two interactive pieces (`MainNav` for the
 * active-link state, `MobileNav` for the menu panel) are the only islands that
 * need JavaScript, so the logo, motto and social row ship as static markup.
 *
 * Account controls are NOT here. The design has no room for them beside the
 * motto and social icons, so sign-in / dashboard live inside the menu panel.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo lockup: mark, wordmark, and the craft line as a hairline strip
            underneath - the full signature from the design, not just the mark. */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
          aria-label={`${siteConfig.name} home`}
        >
          <Image
            src={STUDIO_LOGO.src}
            alt=""
            width={STUDIO_LOGO.width}
            height={STUDIO_LOGO.height}
            sizes="40px"
            priority
            className="size-10 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]"
          />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[0.95rem] font-bold uppercase tracking-[0.02em] text-white">
              Studio Mashariki
            </span>
            <span className="mt-1 text-[0.5rem] font-medium uppercase tracking-[0.2em] text-blue-400">
              Record &bull; Mix &bull; Master &bull; Create
            </span>
          </span>
        </Link>

        <MainNav />

        <div className="flex shrink-0 items-center gap-3">
          {/**
           * "Your Sound | Our Mission" in the display script.
           *
           * Two spans with a separator rather than one string, so the divider is
           * styled independently and screen readers get a pause instead of
           * reading a pipe character.
           */}
          <p className="hidden items-baseline gap-2 font-script text-lg leading-none text-blue-300 xl:flex">
            <span>{siteConfig.motto.first}</span>
            <span aria-hidden="true" className="font-sans text-sm text-blue-500/50">
              |
            </span>
            <span>{siteConfig.motto.second}</span>
          </p>

          <SocialLinks className="hidden items-center gap-0.5 sm:flex" />

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
